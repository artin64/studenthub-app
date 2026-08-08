import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { parentApi, type ParentChild, type ChildOverview, type ParentLinkRequest } from '../lib/api';

const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';

export function ParentPage() {
  const { token } = useAuth();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ParentLinkRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overview, setOverview] = useState<ChildOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    const [list, requests] = await Promise.all([parentApi.children(token), parentApi.myRequests(token)]);
    setChildren(list);
    setPendingRequests(requests);
    if (list.length > 0 && !selectedId) {
      setSelectedId(list[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    parentApi.childOverview(token, selectedId).then(setOverview);
  }, [token, selectedId]);

  const onLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLinking(true);
    setError(null);
    try {
      await parentApi.linkChild(token, email);
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link student');
    } finally {
      setLinking(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Parent</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Your children
      </h1>

      <form onSubmit={onLink} className={`mt-6 flex gap-2 ${cardClass}`}>
        <input
          required
          type="email"
          placeholder="Child's account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
        />
        <button
          type="submit"
          disabled={linking}
          className="whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {linking ? 'Linking…' : 'Link student'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {pendingRequests.length > 0 && (
        <div className="mt-4 space-y-2">
          {pendingRequests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm dark:border-gray-800 dark:bg-white/5"
            >
              <span className="text-gray-700 dark:text-gray-300">
                {r.student?.firstName} {r.student?.lastName}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === 'REJECTED'
                    ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}
              >
                {r.status === 'PENDING' ? 'Pending approval' : `Rejected${r.rejectionReason ? `: ${r.rejectionReason}` : ''}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No children linked yet.</p>
      ) : (
        <>
          <div className="mt-6 flex gap-2">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedId === c.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                {c.firstName} {c.lastName}
              </button>
            ))}
          </div>

          {overview && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className={cardClass}>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Courses</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
                    {overview.courses.length}
                  </p>
                </div>
                <div className={cardClass}>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Average grade</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
                    {overview.averageGrade ?? '—'}
                  </p>
                </div>
                <div className={cardClass}>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Attendance check-ins</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
                    {overview.totalAttendanceCheckIns}
                  </p>
                </div>
              </div>

              <div className={cardClass}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent grades</p>
                {overview.recentGrades.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No grades yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {overview.recentGrades.map((g, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                          {g.submission.assignment.title}
                        </span>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {g.score}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
