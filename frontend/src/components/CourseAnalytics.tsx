import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { analyticsApi, certificatesApi, downloadCourseGradesCsv, type CourseAnalyticsData } from '../lib/api';

export function CourseAnalytics({ courseId }: { courseId: string }) {
  const { token } = useAuth();
  const [data, setData] = useState<CourseAnalyticsData | null>(null);
  const [issuedIds, setIssuedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const [overview, certs] = await Promise.all([
      analyticsApi.course(token, courseId),
      certificatesApi.forCourse(token, courseId),
    ]);
    setData(overview);
    setIssuedIds(new Set(certs.map((c) => c.studentId)));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token, courseId]);

  const onDownload = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      await downloadCourseGradesCsv(token, courseId);
    } finally {
      setDownloading(false);
    }
  };

  const onIssue = async (studentId: string) => {
    if (!token) return;
    setIssuingId(studentId);
    try {
      await certificatesApi.issue(token, courseId, studentId);
      setIssuedIds((prev) => new Set(prev).add(studentId));
    } finally {
      setIssuingId(null);
    }
  };

  if (loading) return <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">Loading analytics…</p>;
  if (!data) return null;

  const atRiskStudents = data.students.filter((s) => s.atRisk);
  const cardClass = 'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-surface-darkCard';

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60 dark:text-blue-400"
        >
          {downloading ? 'Preparing…' : 'Download grades CSV'}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className={`${cardClass} p-4`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">Enrolled</p>
          <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
            {data.enrollmentsCount}
          </p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">Avg grade</p>
          <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
            {data.averageGrade ?? '—'}
          </p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">Submission rate</p>
          <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
            {data.submissionRate !== null ? `${data.submissionRate}%` : '—'}
          </p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">Attendance</p>
          <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
            {data.attendanceRate !== null ? `${data.attendanceRate}%` : '—'}
          </p>
        </div>
      </div>

      {atRiskStudents.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">At-risk students</p>
          <ul className="mt-2 space-y-1">
            {atRiskStudents.map((s) => (
              <li key={s.student.id} className="text-sm text-amber-700 dark:text-amber-300">
                {s.student.firstName} {s.student.lastName} — grade {s.averageGrade ?? '—'}, attendance{' '}
                {s.attendanceRate ?? '—'}%
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.students.length > 0 && (
        <div className={`mt-4 overflow-hidden ${cardClass}`}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-white/5 dark:text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Grade</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.student.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800">
                  <td className="px-5 py-3 text-gray-900 dark:text-white">
                    <Link
                      to={`/app/messages?with=${s.student.id}`}
                      className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {s.student.firstName} {s.student.lastName}
                      <MessageCircle className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">
                    {s.averageGrade ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">
                    {s.attendanceRate !== null ? `${s.attendanceRate}%` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {issuedIds.has(s.student.id) ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Issued ✓</span>
                    ) : (
                      <button
                        onClick={() => onIssue(s.student.id)}
                        disabled={issuingId === s.student.id}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60 dark:text-blue-400"
                      >
                        {issuingId === s.student.id ? 'Issuing…' : 'Issue certificate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
