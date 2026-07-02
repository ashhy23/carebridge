/**
 * Fixed left sidebar navigation for authenticated pages.
 */
import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/useAuth';

const NAV_LINK_CLASS = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
    'border-l-[3px]',
    isActive
      ? 'border-cb-blue bg-blue-600/20 text-white'
      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white',
  ].join(' ');

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(role) {
  if (!role) return '';
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const isPatient = user?.role === 'PATIENT';
  const canViewShifts = user?.role === 'CAREGIVER' || user?.role === 'ADMIN';
  const canViewVitals = isPatient || canViewShifts;
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

  function handleNavClick() {
    if (onClose) onClose();
  }

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-cb-border bg-cb-card',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
      ].join(' ')}
    >
      <div className="border-b border-cb-border px-6 py-6">
        <h1 className="text-xl font-bold text-white">CareBridge</h1>
        <p className="mt-1 text-xs font-medium text-cb-lime">Care Platform</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink to="/dashboard" className={NAV_LINK_CLASS} onClick={handleNavClick}>
          <span aria-hidden="true">🏠</span>
          Dashboard
        </NavLink>

        {canViewVitals && (
          <NavLink to="/vitals" className={NAV_LINK_CLASS} onClick={handleNavClick}>
            <span aria-hidden="true">💓</span>
            Vitals
          </NavLink>
        )}

        {canViewShifts && (
          <>
            <NavLink to="/shifts" end className={NAV_LINK_CLASS} onClick={handleNavClick}>
              <span aria-hidden="true">📅</span>
              Shifts
            </NavLink>
            <NavLink
              to="/shifts"
              className={NAV_LINK_CLASS}
              onClick={handleNavClick}
              isActive={(_, location) => location.pathname.startsWith('/shifts/')}
            >
              <span aria-hidden="true">✓</span>
              Tasks
            </NavLink>
          </>
        )}

        {canViewAlerts && (
          <NavLink to="/alerts" className={NAV_LINK_CLASS} onClick={handleNavClick}>
            <span aria-hidden="true">🔔</span>
            <span className="relative inline-flex items-center">
              Alerts
              {unreadCount > 0 && (
                <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                  {badgeLabel}
                </span>
              )}
            </span>
          </NavLink>
        )}
      </nav>

      <div className="border-t border-cb-border px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: 'var(--gradient-blue)' }}
          >
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{formatRole(user?.role)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-cb-border px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
