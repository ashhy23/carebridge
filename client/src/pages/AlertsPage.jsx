import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import api from '../lib/api';
import { formatAlertType, timeAgo } from '../lib/alertsUtils';
import { useAuth } from '../lib/useAuth';

const ALERTS_ROLES = ['CAREGIVER', 'ADMIN', 'FAMILY_MEMBER'];

export default function AlertsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canViewAlerts = ALERTS_ROLES.includes(user?.role);

  const { data: alerts = [], isLoading, isError, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts');
      return data;
    },
    enabled: canViewAlerts,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/alerts/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/alerts/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });

  if (!canViewAlerts) {
    return <Navigate to="/dashboard" replace />;
  }

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  function handleAlertClick(alert) {
    if (!alert.isRead) {
      markReadMutation.mutate(alert.id);
    }
  }

  return (
    <div className="min-h-screen bg-cb-bg">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Alerts</h2>
            <p className="mt-1 text-sm text-gray-400">
              Vitals threshold notifications for your patients.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="rounded-xl border border-cb-border px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500 disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
            <p className="text-gray-500">Loading alerts...</p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
            <p className="text-sm text-red-400">
              {error.response?.data?.error || 'Failed to load alerts. Please try again.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && alerts.length === 0 && (
          <div className="rounded-2xl border border-cb-border bg-cb-card p-8 text-center">
            <p className="text-gray-500">No alerts. All vitals are within normal ranges.</p>
          </div>
        )}

        {!isLoading && !isError && alerts.length > 0 && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => handleAlertClick(alert)}
                className={[
                  'w-full cursor-pointer rounded-2xl border border-cb-border bg-cb-card p-5 text-left transition hover:border-[#2a2a3a]',
                  'border-l-4',
                  alert.isRead ? 'border-l-gray-700' : 'border-l-red-500 bg-red-500/5',
                ].join(' ')}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-semibold text-white">{formatAlertType(alert.type)}</p>
                  <p className="text-xs text-gray-600">{timeAgo(alert.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {alert.patientProfile?.user?.name ?? 'Unknown patient'}
                </p>
                <p className="mt-2 text-sm text-gray-300">{alert.message}</p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
