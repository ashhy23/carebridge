import { Link } from 'react-router-dom';
import { formatShiftTimeRange, getPatientName } from '../../lib/shiftsUtils';
import StatusBadge from './StatusBadge';

export default function ShiftCard({ shift }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{getPatientName(shift)}</h3>
            <StatusBadge status={shift.status} />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {formatShiftTimeRange(shift.startTime, shift.endTime)}
          </p>
        </div>
        <Link
          to={`/shifts/${shift.id}`}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
