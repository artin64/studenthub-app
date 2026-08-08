import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Archive } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { coursesApi, adminApi, type Course, type Faculty } from '../lib/api';

export function CoursesPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myCourseIds, setMyCourseIds] = useState<Set<string>>(new Set());
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async (targetPage = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await coursesApi.list(token, { page: targetPage });
      if (targetPage === 1) {
        setCourses(result.items);
      } else {
        setCourses((prev) => [...prev, ...result.items]);
      }
      setTotalPages(result.totalPages);
      setPage(result.page);
      if (user?.role === 'STUDENT') {
        const mine = await coursesApi.mine(token);
        setMyCourseIds(new Set(mine.map((e) => e.course.id)));
      }
      if (user?.role === 'PROFESSOR' || user?.role === 'ADMIN') {
        const facs = await adminApi.listFaculties(token);
        setFaculties(facs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      await coursesApi.create(token, { title, description: description || undefined, departmentId: departmentId || undefined });
      setTitle('');
      setDescription('');
      setDepartmentId('');
      setShowCreate(false);
      await load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const onEnroll = async (courseId: string) => {
    if (!token) return;
    try {
      await coursesApi.enroll(token, courseId);
      setMyCourseIds((prev) => new Set(prev).add(courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    }
  };

  const onArchive = async (courseId: string) => {
    if (!token) return;
    if (!confirm(t('courses.archiveConfirm'))) return;
    try {
      await coursesApi.remove(token, courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive course');
    }
  };

  const allDepartments = faculties.flatMap((f) => f.departments.map((d) => ({ ...d, facultyName: f.name })));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.courses')}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t('nav.courses')}</h1>
        </div>
        {(user?.role === 'PROFESSOR' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New course
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={onCreate}
          className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
        >
          <input
            required
            placeholder="Course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            rows={2}
          />
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          >
            <option value="">{t('courses.selectDepartment')}</option>
            {allDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.facultyName} — {d.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            {creating ? 'Creating…' : 'Create course'}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading && courses.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/app/courses/${c.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 dark:text-white"
                  >
                    {c.title}
                  </Link>
                  {(user?.role === 'ADMIN' || user?.id === c.professorId) && (
                    <button
                      onClick={() => onArchive(c.id)}
                      title={t('common.delete')}
                      className="shrink-0 rounded-md p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {c.description && (
                  <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{c.description}</p>
                )}
                {c.department && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{c.department.name}</p>
                )}
                {c.professor && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {c.professor.firstName} {c.professor.lastName}
                  </p>
                )}
                {user?.role === 'STUDENT' && (
                  <button
                    onClick={() => onEnroll(c.id)}
                    disabled={myCourseIds.has(c.id)}
                    className="mt-4 w-full rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    {myCourseIds.has(c.id) ? 'Enrolled' : 'Enroll'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {page < totalPages && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => load(page + 1)}
                disabled={loading}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {loading ? t('common.loading') : t('common.viewAll').replace(' →', '')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
