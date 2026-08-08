import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { coursesApi, attendanceApi, type Course } from '../lib/api';

interface CourseRate {
  course: Course;
  rate: number;
  attended: number;
  totalSessions: number;
}

export function AttendancePage() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const scannedToken = params.get('token');
  const [rows, setRows] = useState<CourseRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const loadRates = async () => {
    if (!token) return;
    const enrollments = await coursesApi.mine(token);
    const results = await Promise.all(
      enrollments.map(async (e) => {
        const rate = await attendanceApi.myRate(token, e.course.id);
        return { course: e.course, ...rate };
      }),
    );
    setRows(results);
    setLoading(false);
  };

  // Landing here with ?token=... means someone scanned the QR from
  // CourseDetailPage with their phone camera — check them in right away.
  useEffect(() => {
    if (!token) return;
    const run = async () => {
      if (scannedToken) {
        try {
          await attendanceApi.checkIn(token, scannedToken);
          setScanMessage('Checked in!');
        } catch (err) {
          setScanMessage(err instanceof Error ? err.message : 'Check-in failed');
        }
      }
      await loadRates();
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, scannedToken]);

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Attendance</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Your attendance</h1>

      {scanMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {scanMessage}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Enroll in a course to see attendance.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.course.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard">
              <p className="font-medium text-gray-900 dark:text-white">{r.course.title}</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-gray-900 dark:text-white">{r.rate}%</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {r.attended} of {r.totalSessions} sessions
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
