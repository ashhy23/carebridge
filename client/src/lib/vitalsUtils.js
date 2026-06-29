/**
 * Maps API vitals entries (Prisma field names) to chart/form display shape.
 */
export function normalizeVitalsEntry(entry) {
  return {
    id: entry.id,
    recordedAt: entry.recordedAt,
    heartRate: entry.heartRate ?? null,
    systolicBp: entry.systolic ?? entry.systolicBp ?? null,
    diastolicBp: entry.diastolic ?? entry.diastolicBp ?? null,
    bloodOxygen: entry.bloodOxygen ?? null,
    temperature: entry.temperatureCelsius ?? entry.temperature ?? null,
    weight: entry.weightKg ?? entry.weight ?? null,
    notes: entry.notes ?? null,
  };
}

export function formatChartDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function buildVitalsPayload(form) {
  const payload = {};

  if (form.heartRate !== '') payload.heartRate = Number(form.heartRate);
  if (form.systolicBp !== '') payload.systolic = Number(form.systolicBp);
  if (form.diastolicBp !== '') payload.diastolic = Number(form.diastolicBp);
  if (form.bloodOxygen !== '') payload.bloodOxygen = Number(form.bloodOxygen);
  if (form.temperature !== '') payload.temperatureCelsius = Number(form.temperature);
  if (form.weight !== '') payload.weightKg = Number(form.weight);
  if (form.notes.trim()) payload.notes = form.notes.trim();

  return payload;
}
