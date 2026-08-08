import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logomark } from '../components/Logomark';
import { useLanguage } from '../lib/language-context';
import { authApi } from '../lib/api';

export function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(email, token, newPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logomark />
          <span className="text-lg font-semibold tracking-tight text-gray-900">StudentHub</span>
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-900/5">
          <h1 className="text-xl font-semibold text-gray-900">{t('resetPassword.title')}</h1>

          {!email || !token ? (
            <p className="mt-4 text-sm text-red-600">{t('resetPassword.invalidLink')}</p>
          ) : done ? (
            <p className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">{t('resetPassword.success')}</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('resetPassword.newPassword')}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? t('login.verifying') : t('resetPassword.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
