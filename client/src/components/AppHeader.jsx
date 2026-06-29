/**
 * Shared top navigation for authenticated pages.
 */
import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../lib/api';
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
  const canViewAlerts =
    user?.role === 'CAREGIVER' || user?.role === 'ADMIN' || user?.role === 'FAMILY_MEMBER';

  const { data: unreadData } = useQuery({
    queryKey: ['alerts-unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/alerts/unread-count');
      return data;
    },
    enabled: canViewAlerts,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

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
            {canViewAlerts && (
              <NavLink to="/alerts" className={NAV_LINK_CLASS}>
                <span className="relative inline-flex items-center">
                  Alerts
                  {unreadCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                      {badgeLabel}
                    </span>
                  )}
                </span>
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
