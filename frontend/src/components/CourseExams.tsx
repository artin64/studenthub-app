import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { examsApi, type Exam } from '../lib/api';

function ExamRow({
  exam,
  isProfessor,
  onPublish,
  onDeleted,
}: {
  exam: Exam;
  isProfessor: boolean;
  onPublish: (id: string) => void;
  onDeleted: () => void;
}) {
  const { token } = useAuth();
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [points, setPoints] = useState('1');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onAddQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdding(true);
    try {
      await examsApi.addQuestion(token, exam.id, {
        type: 'MULTIPLE_CHOICE',
        prompt,
        options: options.filter((o) => o.trim() !== ''),
        correctOption,
        points: Number(points),
      });
      setPrompt('');
      setOptions(['', '', '', '']);
      setMessage('Question added');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{exam.title}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {exam.durationMinutes} min · {new Date(exam.startsAt).toLocaleString()} ·{' '}
            <span className={exam.status === 'PUBLISHED' ? 'text-emerald-600' : 'text-gray-400'}>
              {exam.status}
            </span>
          </p>
        </div>
        {isProfessor ? (
          <div className="flex items-center gap-3">
            {exam.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => setShowAddQuestion((v) => !v)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  + Question
                </button>
                <button
                  onClick={() => onPublish(exam.id)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Publish
                </button>
                <button
                  onClick={async () => {
                    if (!token) return;
                    if (!confirm('Delete this draft exam?')) return;
                    await examsApi.remove(token, exam.id);
                    onDeleted();
                  }}
                  className="text-sm font-medium text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </>
            )}
            <Link
              to={`/app/exams/${exam.id}/results`}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Results
            </Link>
          </div>
        ) : (
          exam.status === 'PUBLISHED' && (
            <Link
              to={`/app/exams/${exam.id}/take`}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Take exam
            </Link>
          )
        )}
      </div>

      {showAddQuestion && (
        <form onSubmit={onAddQuestion} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <input
            required
            placeholder="Question prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
          />
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${exam.id}`}
                checked={correctOption === idx}
                onChange={() => setCorrectOption(idx)}
              />
              <input
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = e.target.value;
                  setOptions(next);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500"
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Points</label>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {adding ? 'Adding…' : 'Add question'}
          </button>
          {message && <p className="text-xs text-gray-500">{message}</p>}
        </form>
      )}
    </div>
  );
}

export function CourseExams({ courseId, isProfessor }: { courseId: string; isProfessor: boolean }) {
  const { token } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await examsApi.listForCourse(token, courseId);
      setExams(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, courseId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      await examsApi.create(token, courseId, {
        title,
        durationMinutes: Number(duration),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      setTitle('');
      setStartsAt('');
      setEndsAt('');
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  const onPublish = async (examId: string) => {
    if (!token) return;
    try {
      await examsApi.publish(token, examId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Exams</h2>
        {isProfessor && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + New exam
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={onCreate} className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <input
            required
            placeholder="Exam title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Duration (min)</label>
              <input
                required
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Starts</label>
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Ends</label>
              <input
                required
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create exam'}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : exams.length === 0 ? (
          <p className="text-sm text-gray-500">No exams yet.</p>
        ) : (
          exams.map((exam) => (
            <ExamRow key={exam.id} exam={exam} isProfessor={isProfessor} onPublish={onPublish} onDeleted={load} />
          ))
        )}
      </div>
    </div>
  );
}
