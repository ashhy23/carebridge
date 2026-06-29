import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import ShiftCard from '../components/shifts/ShiftCard';
import api from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { PAST_STATUSES, UPCOMING_STATUSES } from '../lib/shiftsUtils';

function ShiftSection({ title, shifts }) {
  if (shifts.length === 0) return null;

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="space-y-4">
        {shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} />
        ))}
      </div>
    </section>
  );
}

export default function ShiftsPage() {
  const { user } = useAuth();
  const canViewShifts = user.role === 'CAREGIVER' || user.role === 'ADMIN';

  const { data: shifts = [], isLoading, isError, error } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data } = await api.get('/shifts');
      return data;
    },
    enabled: canViewShifts,
  });

  if (!canViewShifts) {
    return <Navigate to="/dashboard" replace />;
  }

  const upcoming = shifts.filter((s) => UPCOMING_STATUSES.includes(s.status));
  const past = shifts.filter((s) => PAST_STATUSES.includes(s.status));
  const hasShifts = shifts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Shifts</h2>
          <p className="mt-1 text-gray-600">
            {user.role === 'ADMIN'
              ? 'View all scheduled and completed care shifts.'
              : 'Your assigned care shifts.'}
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Loading shifts...</p>
          </div>
        )}

        {isError && (
          <div className="rounded-xl bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-700">
              {error.response?.data?.error || 'Failed to load shifts. Please try again.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && !hasShifts && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">No shifts assigned yet.</p>
          </div>
        )}

        {!isLoading && !isError && hasShifts && (
          <div className="space-y-10">
            <ShiftSection title="Upcoming & Active" shifts={upcoming} />
            <ShiftSection title="Past Shifts" shifts={past} />
          </div>
        )}
      </main>
    </div>
  );
}
