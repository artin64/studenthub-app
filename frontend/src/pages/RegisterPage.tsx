import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Logomark } from '../components/Logomark';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import type { RegisterPayload } from '../lib/api';

const ROLES: { value: RegisterPayload['role']; labelKey: string }[] = [
  { value: 'STUDENT', labelKey: 'role.student' },
  { value: 'PROFESSOR', labelKey: 'role.professor' },
  { value: 'PARENT', labelKey: 'role.parent' },
  { value: 'COMPANY', labelKey: 'role.company' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterPayload['role']>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ firstName, lastName, email, password, role });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logomark />
          <span className="text-lg font-semibold tracking-tight text-gray-900">StudentHub</span>
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-900/5">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                ✓
              </div>
              <h1 className="mt-4 text-xl font-semibold text-gray-900">{t('register.pendingTitle')}</h1>
              <p className="mt-2 text-sm text-gray-500">{t('register.pendingBody')}</p>
              <Link
                to="/login"
                className="mt-6 inline-block w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {t('login.submit')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900">{t('register.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('register.subtitle')}</p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t('common.firstName')}</label>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t('common.lastName')}</label>
                    <input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('common.email')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('common.password')}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{t('register.passwordHint')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('register.iAmA')}</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          role === r.value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t(r.labelKey)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">{t('register.approvalNotice')}</p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? t('register.submitting') : t('register.submit')}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                {t('register.haveAccount')}{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                  {t('login.submit')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
