import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Logomark } from '../components/Logomark';
import { useLanguage } from '../lib/language-context';
import { authApi } from '../lib/api';

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
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
          <h1 className="text-xl font-semibold text-gray-900">{t('forgotPassword.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('forgotPassword.subtitle')}</p>

          {message ? (
            <p className="mt-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? t('login.verifying') : t('forgotPassword.submit')}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              {t('common.back')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
