import { useEffect, useState, type FormEvent } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { alumniApi, type AlumniEntry } from '../lib/api';

export function AlumniPage() {
  const { token, user } = useAuth();
  const [alumni, setAlumni] = useState<AlumniEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [joined, setJoined] = useState(false);

  const load = async () => {
    if (!token) return;
    const list = await alumniApi.list(token);
    setAlumni(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const onJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await alumniApi.update(token, { isAlumnus: true, alumniCompany: company, alumniRole: role });
      setJoined(true);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Alumni</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Alumni network
      </h1>

      {user?.role === 'STUDENT' && !joined && (
        <form onSubmit={onJoin} className={`mt-6 space-y-3 ${cardClass}`}>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Already graduated? Join the directory</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            />
            <input
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Joining…' : 'Join alumni directory'}
          </button>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : alumni.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No alumni listed yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {alumni.map((a) => (
              <div key={a.id} className={`flex items-center gap-3 ${cardClass}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 dark:bg-white/10">
                  <Users className="h-4 w-4 text-white dark:text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {a.firstName} {a.lastName}
                  </p>
                  {(a.alumniRole || a.alumniCompany) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {[a.alumniRole, a.alumniCompany].filter(Boolean).join(' at ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
