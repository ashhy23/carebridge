/**
 * Shared top navigation for authenticated pages.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const NAV_LINK_CLASS = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  ].join(' ');

export default function AppHeader() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const canViewShifts = user?.role === 'CAREGIVER' || user?.role === 'ADMIN';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-900">CareBridge</h1>
          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" className={NAV_LINK_CLASS}>
              Dashboard
            </NavLink>
            <NavLink to="/vitals" className={NAV_LINK_CLASS}>
              Vitals
            </NavLink>
            {canViewShifts && (
              <NavLink to="/shifts" className={NAV_LINK_CLASS}>
                Shifts
              </NavLink>
            )}
          </nav>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
