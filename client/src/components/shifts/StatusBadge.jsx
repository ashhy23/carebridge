import { getStatusLabel, getStatusStyle } from '../../lib/shiftsUtils';

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
