/**
 * Role-aware dashboard with stats, vitals trend, alerts, and quick actions.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import { formatAlertType, timeAgo } from '../lib/alertsUtils';
import { useAuth } from '../lib/useAuth';
import { normalizeVitalsEntry } from '../lib/vitalsUtils';

const GRID_BG = {
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
};

const ACCENT_STYLES = {
  blue: 'bg-blue-500/20 text-blue-400',
  lime: 'bg-cb-lime/20 text-cb-lime',
  red: 'bg-red-500/20 text-red-400',
  purple: 'bg-purple-500/20 text-purple-400',
  orange: 'bg-orange-500/20 text-orange-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name) {
  return name?.split(' ')[0] || name;
}

function StatCard({ icon, title, value, label, accent, loading }) {
  return (
    <div className="rounded-2xl border border-cb-border bg-cb-card p-6 transition hover:border-blue-500/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.1)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${ACCENT_STYLES[accent]}`}
        >
          {icon}
        </div>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
      <p className="mt-4 text-4xl font-bold text-white">{loading ? '…' : value}</p>
      {label && <p className="mt-1 text-xs text-gray-500">{label}</p>}
    </div>
  );
}

function VitalsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-cb-border bg-cb-card px-3 py-2 text-xs text-gray-300 shadow-lg">
      {point.heartRate != null && <p>Heart Rate: {point.heartRate} bpm</p>}
      {point.bloodOxygen != null && <p>SpO2: {point.bloodOxygen}%</p>}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 .75.75 0 00-1.5 0 .75.75 0 11-1.5 0 .75.75 0 10-1.5 0z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function QuickActionButton({ to, children }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center rounded-xl border border-cb-border bg-cb-card px-4 py-5 text-sm font-medium text-white transition hover:border-blue-500"
    >
      {children}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user.role;
  const isCareTeam = role === 'CAREGIVER' || role === 'ADMIN';
  const isPatient = role === 'PATIENT';
  const isFamily = role === 'FAMILY_MEMBER';
  const canViewAlerts = isCareTeam || isFamily;
  const needsLinkedPatient = isCareTeam || isFamily;

  const { data: linkedPatients = [] } = useQuery({
    queryKey: ['linked-patients'],
    queryFn: async () => {
      const { data } = await api.get('/patients/linked');
      return data;
    },
    enabled: needsLinkedPatient && role !== 'ADMIN',
  });

  const linkedPatientId = linkedPatients[0]?.id;

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data } = await api.get('/shifts');
      return data;
    },
    enabled: isCareTeam,
  });

  const { data: unreadData, isLoading: unreadLoading } = useQuery({
    queryKey: ['alerts-unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/alerts/unread-count');
      return data;
    },
    enabled: canViewAlerts,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts');
      return data;
    },
    enabled: canViewAlerts,
  });

  const { data: vitals = [], isLoading: vitalsLoading } = useQuery({
    queryKey: ['vitals', linkedPatientId ?? 'self'],
    queryFn: async () => {
      const params = linkedPatientId ? { patientProfileId: linkedPatientId } : undefined;
      const { data } = await api.get('/vitals', { params });
      return data.map(normalizeVitalsEntry);
    },
    enabled: isPatient || Boolean(linkedPatientId),
  });

  const activeShifts = shifts.filter((s) => s.status === 'IN_PROGRESS').length;
  const scheduledShifts = shifts.filter((s) => s.status === 'SCHEDULED').length;
  const unreadCount = canViewAlerts ? (unreadData?.count ?? 0) : 0;
  const latestVital = vitals[0];
  const recentAlerts = alerts.slice(0, 3);

  const chartData = [...vitals]
    .slice(0, 7)
    .reverse()
    .map((entry, index) => ({
      index,
      heartRate: entry.heartRate,
      bloodOxygen: entry.bloodOxygen,
    }));

  const statsCards = isCareTeam
    ? [
        {
          key: 'active-shifts',
          title: 'Active Shifts',
          value: String(activeShifts),
          label: 'Currently in progress',
          accent: 'blue',
          icon: <CalendarIcon />,
          loading: shiftsLoading,
        },
        {
          key: 'scheduled-shifts',
          title: 'Scheduled Shifts',
          value: String(scheduledShifts),
          label: 'Upcoming assignments',
          accent: 'lime',
          icon: <ClockIcon />,
          loading: shiftsLoading,
        },
        {
          key: 'unread-alerts',
          title: 'Unread Alerts',
          value: String(unreadCount),
          label: 'Require attention',
          accent: 'red',
          icon: <BellIcon />,
          loading: unreadLoading,
        },
        {
          key: 'tasks-today',
          title: 'Tasks Today',
          value: '—',
          label: 'Summary coming soon',
          accent: 'purple',
          icon: <CheckIcon />,
          loading: false,
        },
      ]
    : [
        {
          key: 'heart-rate',
          title: 'Last Heart Rate',
          value: latestVital?.heartRate != null ? `${latestVital.heartRate}` : '—',
          label: latestVital?.heartRate != null ? 'bpm' : 'No reading yet',
          accent: 'red',
          icon: <HeartIcon />,
          loading: vitalsLoading,
        },
        {
          key: 'spo2',
          title: 'Last SpO2',
          value: latestVital?.bloodOxygen != null ? `${latestVital.bloodOxygen}%` : '—',
          label: latestVital?.bloodOxygen != null ? 'Blood oxygen' : 'No reading yet',
          accent: 'blue',
          icon: (
            <span className="text-sm font-bold">O₂</span>
          ),
          loading: vitalsLoading,
        },
        {
          key: 'temperature',
          title: 'Last Temperature',
          value: latestVital?.temperature != null ? `${latestVital.temperature}°` : '—',
          label: latestVital?.temperature != null ? 'Celsius' : 'No reading yet',
          accent: 'orange',
          icon: (
            <span className="text-sm font-bold">°C</span>
          ),
          loading: vitalsLoading,
        },
        {
          key: 'unread-alerts',
          title: 'Unread Alerts',
          value: String(unreadCount),
          label: isPatient ? 'Not applicable for patients' : 'Require attention',
          accent: 'yellow',
          icon: <BellIcon />,
          loading: isPatient ? false : unreadLoading,
        },
      ];

  const quickActions = isPatient
    ? [
        { to: '/vitals', label: 'Log Vitals' },
        { to: '/vitals', label: 'View History' },
      ]
    : isCareTeam
      ? [
          { to: '/shifts', label: 'View Shifts' },
          { to: '/alerts', label: 'View Alerts' },
          { to: '/vitals', label: 'View Vitals' },
          { to: '/dashboard', label: 'Refresh Dashboard' },
        ]
      : [
          { to: '/alerts', label: 'View Alerts' },
          { to: '/vitals', label: 'View Vitals' },
          { to: '/dashboard', label: 'Refresh Dashboard' },
          { to: '/alerts', label: 'Alert History' },
        ];

  const showVitalsChart = isPatient || Boolean(linkedPatientId);
  const vitalsEmptyMessage = isPatient
    ? 'No vitals recorded yet'
    : linkedPatients.length === 0
      ? 'No linked patients to display vitals for'
      : 'No vitals recorded yet';

  return (
    <div className="min-h-screen bg-cb-bg" style={GRID_BG}>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {getFirstName(user.name)}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Here&apos;s what&apos;s happening with your patients today.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card) => (
            <StatCard key={card.key} {...card} />
          ))}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
            <h2 className="text-lg font-semibold text-white">Recent Vitals Trend</h2>
            {!showVitalsChart && (
              <p className="mt-8 text-center text-sm text-gray-500">
                {role === 'ADMIN'
                  ? 'Select a patient on the Vitals page to view trends'
                  : vitalsEmptyMessage}
              </p>
            )}
            {showVitalsChart && vitalsLoading && (
              <p className="mt-8 text-center text-sm text-gray-500">Loading vitals...</p>
            )}
            {showVitalsChart && !vitalsLoading && chartData.length === 0 && (
              <p className="mt-8 text-center text-sm text-gray-500">{vitalsEmptyMessage}</p>
            )}
            {showVitalsChart && !vitalsLoading && chartData.length > 0 && (
              <div className="mt-4 h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <Tooltip content={<VitalsTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="bloodOxygen"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {canViewAlerts ? (
            <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
              <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
              {alertsLoading && (
                <p className="mt-8 text-center text-sm text-gray-500">Loading alerts...</p>
              )}
              {!alertsLoading && recentAlerts.length === 0 && (
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-green-400">
                  <CheckIcon />
                  All clear — no alerts
                </div>
              )}
              {!alertsLoading && recentAlerts.length > 0 && (
                <ul className="mt-4">
                  {recentAlerts.map((alert, index) => (
                    <li
                      key={alert.id}
                      className={[
                        'flex items-start gap-3 py-3',
                        index < recentAlerts.length - 1 ? 'border-b border-cb-border' : '',
                      ].join(' ')}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          alert.isRead ? 'bg-gray-500' : 'bg-red-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {formatAlertType(alert.type)}
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo(alert.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/alerts"
                className="mt-4 inline-block text-sm font-medium text-cb-blue hover:text-blue-400"
              >
                View all alerts →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <QuickActionButton key={`${action.to}-${index}`} to={action.to}>
                    {action.label}
                  </QuickActionButton>
                ))}
              </div>
            </div>
          )}
        </section>

        {canViewAlerts && (
          <section className="mt-6">
            <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <QuickActionButton key={`${action.to}-${index}`} to={action.to}>
                    {action.label}
                  </QuickActionButton>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
