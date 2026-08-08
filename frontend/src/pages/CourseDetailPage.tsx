import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Pencil, Trash2, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { CourseExams } from '../components/CourseExams';
import { CourseAnalytics } from '../components/CourseAnalytics';
import { CourseMaterials } from '../components/CourseMaterials';
import { CourseForum } from '../components/CourseForum';
import { CourseGroups } from '../components/CourseGroups';
import {
  coursesApi,
  assignmentsApi,
  attendanceApi,
  gradesApi,
  peerReviewApi,
  type Course,
  type Assignment,
  type Submission,
} from '../lib/api';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [peerReviewEnabled, setPeerReviewEnabled] = useState(false);
  const [creating, setCreating] = useState(false);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [checkInCode, setCheckInCode] = useState('');
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null);

  const load = async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const c = await coursesApi.get(token, id);
      setCourse(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const onCreateAssignment = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setCreating(true);
    try {
      await assignmentsApi.create(token, id, { title, dueDate: new Date(dueDate).toISOString(), peerReviewEnabled });
      setTitle('');
      setDueDate('');
      setPeerReviewEnabled(false);
      setShowNewAssignment(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const onGenerateSession = async () => {
    if (!token || !id) return;
    try {
      const session = await attendanceApi.createSession(token, id, durationMinutes);
      setSessionToken(session.qrToken);
      setSessionExpiresAt(session.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
  };

  const onCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await attendanceApi.checkIn(token, checkInCode);
      setAttendanceMessage('Checked in!');
      setCheckInCode('');
    } catch (err) {
      setAttendanceMessage(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!course) return null;

  const isProfessor = (user?.role === 'PROFESSOR' && course.professorId === user.id) || user?.role === 'ADMIN';
  // A non-member sees a light preview (see backend courses.service.ts) — no
  // assignments/materials/exams/forum here since those are course-scoped.
  if (course.restricted) {
    return (
      <div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Course</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{course.title}</h1>
        {course.description && <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{course.description}</p>}
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
          <Lock className="h-4 w-4 shrink-0" />
          {user?.role === 'STUDENT'
            ? 'Enroll in this course from the Courses page to see its materials, assignments, and discussion.'
            : "You don't have access to this course's content."}
        </div>
        {user?.role === 'STUDENT' && (
          <button
            onClick={async () => {
              if (!token || !id) return;
              await coursesApi.enroll(token, id);
              await load();
            }}
            className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Enroll
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Course</p>
      <div className="flex items-center justify-between">
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {course.title}
        </h1>
        {!isProfessor && course.professor && (
          <Link
            to={`/app/messages?with=${course.professor.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <MessageCircle className="h-4 w-4" />
            Message professor
          </Link>
        )}
      </div>
      {course.description && (
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{course.description}</p>
      )}

      <CourseMaterials courseId={course.id} isProfessor={isProfessor} />

      {isProfessor && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance QR</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">{t('attendance.sessionDuration')}</label>
              <input
                type="number"
                min={1}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
              />
              <button
                onClick={onGenerateSession}
                className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                {t('attendance.generate')}
              </button>
            </div>
          </div>
          {sessionToken && (
            <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-gray-50 p-5 dark:bg-white/5 sm:flex-row sm:items-start">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={`${window.location.origin}/app/attendance?token=${sessionToken}`} size={144} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('attendance.scanFormat')}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">{t('attendance.manualFormat')}</p>
                <p className="mt-1 break-all rounded-lg bg-white p-2.5 font-mono text-xs text-gray-700 dark:bg-surface-dark dark:text-gray-300">
                  {sessionToken}
                </p>
                {sessionExpiresAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    {t('attendance.expiresAt')} {new Date(sessionExpiresAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isProfessor && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Check in to this session</h2>
          <form onSubmit={onCheckIn} className="mt-3 flex gap-2">
            <input
              required
              placeholder="Paste QR token"
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            />
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Check in
            </button>
          </form>
          {attendanceMessage && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{attendanceMessage}</p>}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignments</h2>
          {isProfessor && (
            <button
              onClick={() => setShowNewAssignment((v) => !v)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + New assignment
            </button>
          )}
        </div>

        {showNewAssignment && (
          <form
            onSubmit={onCreateAssignment}
            className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
          >
            <input
              required
              placeholder="Assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            />
            <input
              required
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={peerReviewEnabled}
                onChange={(e) => setPeerReviewEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              Allow students to review each other’s submissions (peer review)
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
            >
              {creating ? 'Creating…' : 'Create assignment'}
            </button>
          </form>
        )}

        <div className="mt-4 space-y-3">
          {(course.assignments ?? []).map((a) => (
            <AssignmentRow key={a.id} assignment={a} isProfessor={isProfessor} onChanged={load} />
          ))}
          {(course.assignments ?? []).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No assignments yet.</p>
          )}
        </div>
      </div>

      <CourseExams courseId={course.id} isProfessor={isProfessor} />

      {isProfessor && <CourseAnalytics courseId={course.id} />}

      <CourseGroups courseId={course.id} isProfessor={isProfessor} />
      <CourseForum courseId={course.id} isProfessor={isProfessor} />
    </div>
  );
}

function AssignmentRow({
  assignment,
  isProfessor,
  onChanged,
}: {
  assignment: Assignment;
  isProfessor: boolean;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showPeerReview, setShowPeerReview] = useState(false);
  const [peerSubmissions, setPeerSubmissions] = useState<Submission[]>([]);
  const [peerError, setPeerError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(assignment.title);
  const [editDueDate, setEditDueDate] = useState(assignment.dueDate.slice(0, 16));

  const isPastDue = new Date(assignment.dueDate) < new Date();

  const loadSubmissions = async () => {
    if (!token) return;
    setLoadingSubmissions(true);
    try {
      const subs = await assignmentsApi.submissions(token, assignment.id);
      setSubmissions(subs);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadPeerSubmissions = async () => {
    if (!token) return;
    setPeerError(null);
    try {
      const subs = await assignmentsApi.peerSubmissions(token, assignment.id);
      setPeerSubmissions(subs);
    } catch (err) {
      setPeerError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  const onTogglePeerReview = () => {
    const next = !showPeerReview;
    setShowPeerReview(next);
    if (next) {
      loadPeerSubmissions();
    }
  };

  const onRate = async (submissionId: string, rating: number) => {
    if (!token) return;
    await peerReviewApi.create(token, submissionId, rating);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await assignmentsApi.submit(token, assignment.id, content);
      setMessage('Submitted!');
      setContent('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onToggle = () => {
    setOpen((v) => !v);
    if (!open && isProfessor) {
      loadSubmissions();
    }
  };

  const onGrade = async (submissionId: string, score: number) => {
    if (!token) return;
    try {
      await gradesApi.grade(token, submissionId, score);
      await loadSubmissions();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Grading failed');
    }
  };

  const onSaveEdit = async () => {
    if (!token) return;
    try {
      await assignmentsApi.update(token, assignment.id, { title: editTitle, dueDate: new Date(editDueDate).toISOString() });
      setEditing(false);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const onDelete = async () => {
    if (!token) return;
    if (!confirm(t('courses.archiveConfirm'))) return;
    await assignmentsApi.remove(token, assignment.id);
    onChanged();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onToggle} className="flex-1 text-left">
          {editing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-surface-dark dark:text-white"
              />
              <input
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-surface-dark dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{assignment.title}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Due {new Date(assignment.dueDate).toLocaleDateString()} · {assignment.maxScore} pts
                {assignment.peerReviewEnabled && ' · peer review on'}
              </p>
            </div>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {isProfessor && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:text-gray-600 dark:hover:bg-white/5"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <span onClick={onToggle} className="cursor-pointer text-xs text-gray-400">
            {open ? 'Hide' : 'Open'}
          </span>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          {!isProfessor && (
            <>
              {isPastDue ? (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  {t('assignment.deadlinePassed')}
                </p>
              ) : (
                <form onSubmit={onSubmit} className="space-y-2">
                  <textarea
                    required
                    placeholder="Your submission…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                  {message && <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>}
                </form>
              )}
            </>
          )}

          {!isProfessor && assignment.peerReviewEnabled && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button onClick={onTogglePeerReview} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                {showPeerReview ? 'Hide peer submissions' : 'Review peers\u2019 submissions'}
              </button>
              {showPeerReview && (
                <div className="mt-3 space-y-2">
                  {peerError ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('assignment.submitFirst')}</p>
                  ) : peerSubmissions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No peer submissions yet.</p>
                  ) : (
                    peerSubmissions.map((s) => (
                      <div key={s.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {s.student.firstName} {s.student.lastName}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.content}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => onRate(s.id, n)}
                              className="text-lg leading-none text-amber-400 hover:scale-110"
                              title={`Rate ${n}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {isProfessor && (
            <div className="space-y-3">
              {loadingSubmissions ? (
                <p className="text-sm text-gray-400">Loading submissions…</p>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No submissions yet.</p>
              ) : (
                submissions.map((s) => (
                  <div key={s.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {s.student.firstName} {s.student.lastName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {s.grade ? (
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                          {s.grade.score}/{assignment.maxScore}
                        </span>
                      ) : (
                        <GradeForm onSubmit={(score) => onGrade(s.id, score)} max={assignment.maxScore} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GradeForm({ onSubmit, max }: { onSubmit: (score: number) => void; max: number }) {
  const [score, setScore] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(score);
        if (!Number.isNaN(n)) onSubmit(n);
      }}
      className="flex items-center gap-2"
    >
      <input
        required
        type="number"
        min={0}
        max={max}
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
      />
      <button type="submit" className="text-sm font-medium text-blue-600 hover:text-blue-700">
        Grade
      </button>
    </form>
  );
}
