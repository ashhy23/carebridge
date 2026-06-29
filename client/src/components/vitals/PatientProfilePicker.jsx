/**
 * Lets caregivers and family members choose which patient's vitals to view.
 */
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

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
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Select patient</h3>
      <p className="mt-1 text-sm text-gray-500">
        Choose a linked patient to view their vitals history.
      </p>

      {isLoading && (
        <p className="mt-4 text-sm text-gray-500">Loading linked patients...</p>
      )}

      {isError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.response?.data?.error || 'Failed to load linked patients.'}
        </p>
      )}

      {!isLoading && !isError && patients.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No linked patients found. Family links or care shifts must be set up in the
          database first.
        </p>
      )}

      {!isLoading && patients.length > 0 && (
        <div className="mt-4">
          <label htmlFor="patientSelect" className="mb-1 block text-sm font-medium text-gray-700">
            Patient
          </label>
          <select
            id="patientSelect"
            value={selectedId}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a patient...</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
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
