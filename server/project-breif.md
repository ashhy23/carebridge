cat > project-brief.md << 'EOF'
# CareBridge — Project Brief

## What it does
AI-powered elderly care coordination platform with three user roles:
- Patient (or family member acting on their behalf)
- Caregiver (professional)
- Family member (remote, read-only updates)

## Core features
- Vitals logging (BP, glucose, temperature, weight)
- Caregiver shift scheduling and task management
- AI symptom triage chatbot (Claude API)
- Care note summariser (end-of-shift AI summary)
- Real-time alerts via WebSockets
- Voice input for elderly users (Whisper API)
- Family dashboard with vitals trends and care feed

## Tech stack
- Frontend: React 18, Tailwind CSS, React Query, Recharts
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL
- Auth: JWT with refresh tokens, role-based access control
- AI: Claude API (triage + summarisation), Whisper (voice)
- Real-time: Socket.io
- DevOps: Docker, GitHub Actions, deploy to Railway
EOF