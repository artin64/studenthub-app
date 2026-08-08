import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { examsApi, type Exam, type ExamQuestion, type ExamAnswer } from '../lib/api';

export function ExamTakePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [exam, setExam] = useState<(Exam & { questions: ExamQuestion[] }) | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: number; essayText?: string }>>({});
  const [submitted, setSubmitted] = useState<{ score: number | null; flagged?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  // Guards against double-flagging (e.g. blur + visibilitychange firing
  // together) and against flagging after the exam is already done.
  const closingRef = useRef(false);

  useEffect(() => {
    if (!token || !id) return;
    examsApi
      .take(token, id)
      .then((res) => {
        setExam(res.exam);
        const map: Record<string, { selectedOption?: number; essayText?: string }> = {};
        res.attempt.answers.forEach((a: ExamAnswer) => {
          map[a.questionId] = {
            selectedOption: a.selectedOption ?? undefined,
            essayText: a.essayText ?? undefined,
          };
        });
        setAnswers(map);
        if (res.attempt.submittedAt) {
          setSubmitted({ score: null });
          closingRef.current = true;
        }
        const end = new Date(res.exam.endsAt).getTime();
        setSecondsLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [token, id]);

  const onSubmit = async () => {
    if (!token || !id || closingRef.current) return;
    closingRef.current = true;
    try {
      const result = await examsApi.submit(token, id);
      setSubmitted({ score: result.score });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      closingRef.current = false;
    }
  };

  // Anti-cheat: leaving the tab/window closes the attempt automatically.
  // This is a soft, browser-level deterrent — it catches the common case
  // (switching tabs to look something up) but can't stop a determined
  // student with a second device. See exams.service.ts flagAttempt().
  useEffect(() => {
    if (!token || !id || submitted) return;

    const flag = async (reason: 'TAB_SWITCH' | 'WINDOW_BLUR') => {
      if (closingRef.current) return;
      closingRef.current = true;
      try {
        const result = await examsApi.flag(token, id, reason);
        setSubmitted({ score: result.score, flagged: true });
      } catch {
        closingRef.current = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) flag('TAB_SWITCH');
    };
    const onBlur = () => flag('WINDOW_BLUR');

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [token, id, submitted]);

  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) {
      onSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitted]);

  const timeLabel = useMemo(() => {
    if (secondsLeft === null) return '';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  const onAnswer = async (questionId: string, value: { selectedOption?: number; essayText?: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (!token || !id) return;
    try {
      await examsApi.answer(token, id, { questionId, ...value });
    } catch {
      // best-effort autosave
    }
  };

  if (loading) return <p className="p-10 text-sm text-gray-400">Loading…</p>;
  if (error) return <p className="p-10 text-sm text-red-600">{error}</p>;
  if (!exam) return null;

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-xl shadow-gray-900/5">
          {submitted.flagged ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-red-600">{t('exam.closedForViolation')}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Submitted</p>
          )}
          <h1 className="mt-2 text-xl font-semibold text-gray-900">{exam.title}</h1>
          {submitted.score !== null ? (
            <p className="mt-4 font-mono text-3xl font-bold text-blue-600">{submitted.score} pts</p>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Your answers have been recorded.</p>
          )}
          <button
            onClick={() => navigate(-1)}
            className="mt-6 w-full rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-semibold text-blue-700">
          {timeLabel}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t('exam.antiCheatWarning')}
      </div>

      <div className="mt-6 space-y-4">
        {exam.questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-900">
              {i + 1}. {q.prompt}
              <span className="ml-2 text-xs font-normal text-gray-400">({q.points} pts)</span>
            </p>

            {q.type === 'MULTIPLE_CHOICE' && q.options ? (
              <div className="mt-3 space-y-2">
                {q.options.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      answers[q.id]?.selectedOption === idx
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="sr-only"
                      checked={answers[q.id]?.selectedOption === idx}
                      onChange={() => onAnswer(q.id, { selectedOption: idx })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows={4}
                value={answers[q.id]?.essayText ?? ''}
                onChange={(e) => onAnswer(q.id, { essayText: e.target.value })}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                placeholder="Your answer…"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        className="mt-6 w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Submit exam
      </button>
    </div>
  );
}
