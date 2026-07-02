const STATUS_STYLES = {
  SCHEDULED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function getStatusStyle(status) {
  return STATUS_STYLES[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function formatShiftTimeRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const datePart = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const startPart = start.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const endPart = end.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart} · ${startPart} – ${endPart}`;
}

export function getPatientName(shift) {
  return shift?.patientProfile?.user?.name || 'Unknown patient';
}

export const UPCOMING_STATUSES = ['SCHEDULED', 'IN_PROGRESS'];
export const PAST_STATUSES = ['COMPLETED', 'CANCELLED'];
