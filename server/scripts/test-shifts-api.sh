#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5001}"
PASS="${TEST_PASSWORD:-testpass123}"
TS="${TS:-$(date +%s)}"

CG_EMAIL="caregiver_shift_${TS}@test.local"
PAT_EMAIL="patient_shift_${TS}@test.local"

register() {
  local name="$1" email="$2" role="$3"
  curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$PASS\",\"role\":\"$role\"}"
}

login() {
  local email="$1"
  curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASS\"}"
}

echo "=== Setup: register patient + caregiver ==="
register "Shift Test Patient" "$PAT_EMAIL" "PATIENT" >/dev/null
register "Shift Test Caregiver" "$CG_EMAIL" "CAREGIVER" >/dev/null

SETUP_JSON=$(DOTENV_CONFIG_QUIET=true node -e "
require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('./src/lib/prisma');
(async () => {
  const patientUser = await prisma.user.findUnique({
    where: { email: '$PAT_EMAIL' },
    include: { patientProfile: true },
  });
  const caregiverUser = await prisma.user.findUnique({
    where: { email: '$CG_EMAIL' },
    include: { caregiverProfile: true },
  });
  if (!patientUser?.patientProfile || !caregiverUser?.caregiverProfile) {
    throw new Error('profiles missing');
  }
  const adminToken = jwt.sign(
    { userId: caregiverUser.id, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log(JSON.stringify({
    patientProfileId: patientUser.patientProfile.id,
    caregiverProfileId: caregiverUser.caregiverProfile.id,
    adminToken,
  }));
  await prisma.\$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
")

PATIENT_PROFILE_ID=$(echo "$SETUP_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).patientProfileId))")
CAREGIVER_PROFILE_ID=$(echo "$SETUP_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).caregiverProfileId))")
ADMIN_TOKEN=$(echo "$SETUP_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).adminToken))")
CG_TOKEN=$(login "$CG_EMAIL" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).accessToken||'')}catch{console.log('')}})")

if [[ -z "$ADMIN_TOKEN" || -z "$CG_TOKEN" ]]; then
  echo "SETUP_ERROR: could not obtain tokens"
  exit 1
fi

echo ""
echo "=== 1. POST /api/shifts ==="
CREATE_RESP=$(curl -s -w "\n__HTTP__%{http_code}" -X POST "$BASE_URL/api/shifts" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"patientProfileId\":\"$PATIENT_PROFILE_ID\",\"caregiverId\":\"$CAREGIVER_PROFILE_ID\",\"startTime\":\"2026-06-30T09:00:00.000Z\",\"endTime\":\"2026-06-30T17:00:00.000Z\",\"notes\":\"Test shift notes\"}")
CREATE_HTTP=$(echo "$CREATE_RESP" | sed -n 's/^__HTTP__//p')
CREATE_BODY=$(echo "$CREATE_RESP" | sed '/^__HTTP__/d')
SHIFT_ID=$(echo "$CREATE_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch{console.log('')}})")
echo "HTTP $CREATE_HTTP | shiftId=${SHIFT_ID:-missing}"
if [[ "$CREATE_HTTP" != "201" ]]; then
  echo "body: $(echo "$CREATE_BODY" | head -c 300)"
fi

echo ""
echo "=== 2. GET /api/shifts (caregiver) ==="
LIST_RESP=$(curl -s -w "\n__HTTP__%{http_code}" "$BASE_URL/api/shifts" -H "Authorization: Bearer $CG_TOKEN")
LIST_HTTP=$(echo "$LIST_RESP" | sed -n 's/^__HTTP__//p')
LIST_COUNT=$(echo "$LIST_RESP" | sed '/^__HTTP__/d' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).length)}catch{console.log('0')}})")
echo "HTTP $LIST_HTTP | count=${LIST_COUNT:-0}"

echo ""
echo "=== 3. GET /api/shifts/:id (caregiver) ==="
if [[ -n "$SHIFT_ID" ]]; then
  DETAIL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/shifts/$SHIFT_ID" -H "Authorization: Bearer $CG_TOKEN")
  echo "HTTP $DETAIL_HTTP"
else
  DETAIL_HTTP="SKIP"
  echo "HTTP SKIP (no shift id)"
fi

echo ""
echo "=== 4. PATCH /api/shifts/:id/status (caregiver) ==="
if [[ -n "$SHIFT_ID" ]]; then
  STATUS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/shifts/$SHIFT_ID/status" \
    -H "Authorization: Bearer $CG_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"IN_PROGRESS"}')
  echo "HTTP $STATUS_HTTP"
else
  STATUS_HTTP="SKIP"
  echo "HTTP SKIP (no shift id)"
fi

echo ""
echo "=== 5. PATCH /api/shifts/:id/notes (caregiver) ==="
if [[ -n "$SHIFT_ID" ]]; then
  NOTES_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/shifts/$SHIFT_ID/notes" \
    -H "Authorization: Bearer $CG_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"notes":"Updated notes from curl test"}')
  echo "HTTP $NOTES_HTTP"
else
  NOTES_HTTP="SKIP"
  echo "HTTP SKIP (no shift id)"
fi

echo ""
echo "=== Summary ==="
printf '%s\n' \
  "1 POST         -> ${CREATE_HTTP} (expected 201)" \
  "2 GET          -> ${LIST_HTTP} (expected 200)" \
  "3 GET :id      -> ${DETAIL_HTTP} (expected 200)" \
  "4 PATCH status -> ${STATUS_HTTP} (expected 200)" \
  "5 PATCH notes  -> ${NOTES_HTTP} (expected 200)"
