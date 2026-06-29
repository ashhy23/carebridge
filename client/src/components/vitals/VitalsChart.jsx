/**
 * Recharts trend visualisation for the last 30 vitals entries.
 */
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import { formatChartDate, normalizeVitalsEntry } from '../../lib/vitalsUtils';

const METRIC_LINES = [
  { key: 'heartRate', name: 'Heart Rate', color: '#3B82F6', unit: 'bpm' },
  { key: 'systolicBp', name: 'Systolic BP', color: '#EF4444', unit: 'mmHg' },
  { key: 'diastolicBp', name: 'Diastolic BP', color: '#F97316', unit: 'mmHg' },
  { key: 'bloodOxygen', name: 'SpO2', color: '#22C55E', unit: '%' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-md">
      <p className="mb-2 font-medium text-gray-900">{label}</p>
      <ul className="space-y-1 text-gray-700">
        {METRIC_LINES.map(({ key, name, unit }) => (
          <li key={key}>
            {name}: {point[key] != null ? `${point[key]} ${unit}` : '—'}
          </li>
        ))}
        <li>Temperature: {point.temperature != null ? `${point.temperature} °C` : '—'}</li>
        <li>Weight: {point.weight != null ? `${point.weight} kg` : '—'}</li>
        {point.notes && <li className="pt-1 text-gray-500">Notes: {point.notes}</li>}
      </ul>
    </div>
  );
}

function SecondaryTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-md">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-gray-700">
        {payload[0].value != null ? `${payload[0].value} ${unit}` : '—'}
      </p>
    </div>
  );
}

export default function VitalsChart({ className = '' }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientProfileId = searchParams.get('patientProfileId');
  const isPatient = user.role === 'PATIENT';
  const canFetch = isPatient || Boolean(patientProfileId);

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['vitals', patientProfileId],
    queryFn: async () => {
      const params = !isPatient && patientProfileId ? { patientProfileId } : undefined;
      const { data: entries } = await api.get('/vitals', { params });
      return entries.map(normalizeVitalsEntry);
    },
    enabled: canFetch,
  });

  const chartData = [...data]
    .reverse()
    .map((entry) => ({
      ...entry,
      dateLabel: formatChartDate(entry.recordedAt),
    }));

  const hasData = chartData.length > 0;

  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">30-Day Vitals Trends</h3>
      <p className="mt-1 text-sm text-gray-500">Recent readings over time (up to 30 entries).</p>

      {!isPatient && !patientProfileId && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Select a patient above to load their vitals chart.
        </p>
      )}

      {isLoading && canFetch && (
        <p className="mt-8 text-center text-sm text-gray-500">Loading vitals...</p>
      )}

      {isError && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.response?.data?.error || 'Failed to load vitals.'}
        </p>
      )}

      {!isLoading && !isError && canFetch && !hasData && (
        <p className="mt-8 text-center text-sm text-gray-500">
          {isPatient
            ? 'No vitals recorded yet. Use the form to log your first entry.'
            : 'No vitals recorded yet for this patient.'}
        </p>
      )}

      {!isLoading && !isError && hasData && (
        <div className="mt-6 space-y-8">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {METRIC_LINES.map(({ key, name, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={name}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Temperature (°C)</h4>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip content={<SecondaryTooltip unit="°C" />} />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Weight (kg)</h4>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip content={<SecondaryTooltip unit="kg" />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight"
                      stroke="#14B8A6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
