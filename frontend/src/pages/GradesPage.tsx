import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { gradesApi, type Grade } from '../lib/api';

export function GradesPage() {
  const { token } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    gradesApi
      .mine(token)
      .then(setGrades)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <p className="text-sm text-gray-400">Grades</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Your grades</h1>

      {loading ? (
        <p className="mt-6 text-sm text-gray-400">Loading…</p>
      ) : grades.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No grades yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Assignment</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-gray-900">{g.submission.assignment.title}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{g.score}</td>
                  <td className="px-5 py-3 text-gray-500">{g.feedback ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
