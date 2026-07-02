/**
 * Registration page: creates an account via POST /auth/register.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthPageShell, {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SELECT_CLASS,
} from '../components/auth/AuthPageShell';
import api from '../lib/api';

const ROLE_OPTIONS = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'CAREGIVER', label: 'Caregiver' },
  { value: 'FAMILY_MEMBER', label: 'Family Member' },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/auth/register', { name, email, password, role });
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please sign in.' },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Create account"
      subtitle="Join CareBridge as a patient, caregiver, or family member"
      footer={
        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-cb-lime hover:brightness-110">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className={AUTH_LABEL_CLASS}>
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={AUTH_INPUT_CLASS}
            placeholder="Your full name"
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={AUTH_INPUT_CLASS}
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label htmlFor="role" className={AUTH_LABEL_CLASS}>
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={AUTH_SELECT_CLASS}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-cb-card text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-cb-lime py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthPageShell>
  );
}
