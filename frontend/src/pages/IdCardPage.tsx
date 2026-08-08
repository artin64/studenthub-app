import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../lib/auth-context';
import { Logomark } from '../components/Logomark';
import { ectsApi } from '../lib/api';

export function IdCardPage() {
  const { user, token } = useAuth();
  const [ects, setEcts] = useState<{ earned: number; inProgress: number } | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'STUDENT') return;
    ectsApi.mine(token).then(setEcts);
  }, [token, user]);

  if (!user) return null;

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Digital ID</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Your student card
      </h1>

      <div className="mt-8 max-w-sm overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5 dark:border-gray-800 dark:bg-surface-darkCard">
        <div className="bg-gray-900 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Logomark className="h-7 w-7" />
            <span className="text-sm font-semibold text-white">StudentHub</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 font-mono text-xl font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user.email.split('@')[0]}</p>
              <p className="font-mono text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {user.role}
              </p>
            </div>
          </div>

          {ects && (
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">ECTS earned</p>
                <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{ects.earned}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">In progress</p>
                <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{ects.inProgress}</p>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-center border-t border-gray-100 pt-5 dark:border-gray-800">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={user.id} size={128} />
            </div>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-gray-400 dark:text-gray-500">{user.id}</p>
        </div>
      </div>
    </div>
  );
}
