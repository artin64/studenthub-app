import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logomark } from '../components/Logomark';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';

export function LoginPage() {
  const { login, verifyTwoFactor } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyTwoFactor(email, code);
      navigate('/app');
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
          {step === 'password' ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900">{t('login.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('login.subtitle')}</p>

              <form onSubmit={onSubmitPassword} className="mt-6 space-y-4">
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">{t('common.password')}</label>
                    <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      {t('login.forgotPassword')}
                    </Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? t('login.loggingIn') : t('login.submit')}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
                  {t('login.signUp')}
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900">{t('login.twoFactorTitle')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('login.twoFactorSubtitle')} {email}</p>

              <form onSubmit={onSubmitCode} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('login.code')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.5em] text-gray-900 focus:border-blue-500"
                    placeholder="••••••"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || code.length !== 6}
                  className="w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? t('login.verifying') : t('login.verify')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('common.back')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
