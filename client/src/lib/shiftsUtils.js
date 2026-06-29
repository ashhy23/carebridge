const STATUS_STYLES = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function getStatusStyle(status) {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
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
