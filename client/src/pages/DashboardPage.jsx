/**
 * Protected dashboard placeholder shown after login.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const ROLE_LABELS = {
  PATIENT: 'Patient',
  CAREGIVER: 'Caregiver',
  FAMILY_MEMBER: 'Family Member',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">CareBridge</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </header>

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
