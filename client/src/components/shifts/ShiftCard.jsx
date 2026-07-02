import { Link } from 'react-router-dom';
import { formatShiftTimeRange, getPatientName } from '../../lib/shiftsUtils';
import StatusBadge from './StatusBadge';

export default function ShiftCard({ shift }) {
  return (
    <div className="rounded-2xl border border-cb-border bg-cb-card p-6 transition hover:border-blue-500/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{getPatientName(shift)}</h3>
            <StatusBadge status={shift.status} />
          </div>
          <p className="mt-2 text-sm text-gray-400">
            {formatShiftTimeRange(shift.startTime, shift.endTime)}
          </p>
        </div>
        <Link
          to={`/shifts/${shift.id}`}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-cb-border py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500 hover:text-white sm:w-auto sm:px-4"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
