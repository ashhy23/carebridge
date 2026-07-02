/**
 * Vitals logging and trend charts for patients and care team viewers.
 */
import PatientProfilePicker from '../components/vitals/PatientProfilePicker';
import VitalsChart from '../components/vitals/VitalsChart';
import VitalsForm from '../components/vitals/VitalsForm';
import { useAuth } from '../lib/useAuth';

export default function VitalsPage() {
  const { user } = useAuth();
  const isPatient = user.role === 'PATIENT';

  return (
    <div className="min-h-screen bg-cb-bg">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Vitals</h2>
          <p className="mt-1 text-sm text-gray-400">
            {isPatient
              ? 'Log your readings and track trends over time.'
              : 'View recent vitals trends for a linked patient.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {isPatient ? (
            <VitalsForm />
          ) : (
            <PatientProfilePicker />
          )}
          <VitalsChart className={isPatient ? '' : 'lg:col-span-2'} />
        </div>
      </main>
    </div>
  );
}
