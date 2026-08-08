import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../lib/language-context';
import { demoRequestsApi } from '../lib/api';

export function BookDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await demoRequestsApi.create({
        name,
        email,
        institution: institution || undefined,
        phone: phone || undefined,
        message: message || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('demo.title')}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{t('demo.success')}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">{t('demo.subtitle')}</p>
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <input
                required
                placeholder={t('demo.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
              <input
                required
                type="email"
                placeholder={t('common.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
              <input
                placeholder={t('demo.institution')}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
              <input
                placeholder={t('demo.phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
              <textarea
                placeholder={t('demo.message')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? '…' : t('demo.submit')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
