/**
 * Route guard: waits for session restore, then requires a logged-in user.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

export default function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
