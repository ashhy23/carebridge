/**
 * Login page: email/password form wired to AuthContext.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthPageShell, { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from '../components/auth/AuthPageShell';
import { useAuth } from '../lib/useAuth';

const KEYWORDS = [
  'Real-time Vitals Monitoring',
  'Smart Abnormal Alerts',
  'AI Care Summaries',
  'Shift Management',
  'Family Care Updates',
];

function LoginKeywordCarousel() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((current) => (current + 1) % KEYWORDS.length);
        setVisible(true);
      }, 400);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6 flex justify-center">
      <span
        className={[
          'rounded-full border border-white/10 px-4 py-1.5 text-center text-xs text-gray-400 transition-opacity duration-[400ms]',
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {KEYWORDS[index]}
      </span>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      layout="centered"
      title="Welcome back"
      subtitle="Enter your email and password to continue"
      belowCard={<LoginKeywordCarousel />}
      footer={
        <p className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-cb-lime hover:brightness-110">
            Create one
          </Link>
        </p>
      }
    >
      {successMessage && (
        <p className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {successMessage}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={AUTH_INPUT_CLASS}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-cb-lime py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthPageShell>
  );
}
