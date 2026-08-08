import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { gamificationApi, type LeaderboardEntry } from '../lib/api';

export function LeaderboardPage() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    gamificationApi
      .leaderboard(token)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Leaderboard</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Top students
      </h1>

      {loading ? (
        <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-surface-darkCard">
          {entries.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-center justify-between px-5 py-3 ${
                i !== entries.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''
              } ${e.id === user?.id ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                    i === 0
                      ? 'bg-amber-100 text-amber-700'
                      : i === 1
                        ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                        : i === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500'
                  }`}
                >
                  {i < 3 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {e.firstName} {e.lastName}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{e.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
