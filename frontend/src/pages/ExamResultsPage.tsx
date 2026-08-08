import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { examsApi, type ExamAttempt } from '../lib/api';

export function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    examsApi
      .results(token, id)
      .then(setAttempts)
      .finally(() => setLoading(false));
  }, [token, id]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm text-gray-400">Exam results</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Attempts</h1>

      {loading ? (
        <p className="mt-6 text-sm text-gray-400">Loading…</p>
      ) : attempts.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No attempts yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-gray-900">
                    {a.student ? `${a.student.firstName} ${a.student.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{a.submittedAt ? 'Submitted' : 'In progress'}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{a.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
