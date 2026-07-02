/**
 * Lets caregivers and family members choose which patient's vitals to view.
 */
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

const SELECT_CLASS =
  'w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export default function PatientProfilePicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('patientProfileId') ?? '';

  const { data: patients = [], isLoading, isError, error } = useQuery({
    queryKey: ['linked-patients'],
    queryFn: async () => {
      const { data } = await api.get('/patients/linked');
      return data;
    },
  });

  function handleChange(e) {
    const id = e.target.value;
    if (id) {
      setSearchParams({ patientProfileId: id });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
      <h3 className="text-lg font-semibold text-white">Select patient</h3>
      <p className="mt-1 text-sm text-gray-400">
        Choose a linked patient to view their vitals history.
      </p>

      {isLoading && (
        <p className="mt-4 text-sm text-gray-500">Loading linked patients...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-red-400">
          {error.response?.data?.error || 'Failed to load linked patients.'}
        </p>
      )}

      {!isLoading && !isError && patients.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          No linked patients found. Family links or care shifts must be set up in the
          database first.
        </p>
      )}

      {!isLoading && patients.length > 0 && (
        <div className="mt-4">
          <label htmlFor="patientSelect" className="mb-1 block text-sm text-gray-300">
            Patient
          </label>
          <select
            id="patientSelect"
            value={selectedId}
            onChange={handleChange}
            className={SELECT_CLASS}
          >
            <option value="" className="bg-cb-card text-white">
              Select a patient...
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id} className="bg-cb-card text-white">
                {patient.name}
                {patient.relationship ? ` (${patient.relationship})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
