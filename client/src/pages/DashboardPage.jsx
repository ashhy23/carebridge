/**
 * Protected dashboard placeholder shown after login.
 */
import AppHeader from '../components/AppHeader';
import { useAuth } from '../lib/useAuth';

const ROLE_LABELS = {
  PATIENT: 'Patient',
  CAREGIVER: 'Caregiver',
  FAMILY_MEMBER: 'Family Member',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Welcome, {user.name}</h2>
        <p className="mt-2 text-gray-600">You are signed in to your CareBridge account.</p>
        <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          {roleLabel}
        </span>
      </main>
    </div>
  );
}
