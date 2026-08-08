import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, QrCode, Sparkles, ListChecks } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { GradeTrendChart } from '../components/GradeTrendChart';
import { coursesApi, analyticsApi, tasksApi, type Course, type StudentAnalytics, type TaskItem } from '../lib/api';
import { quoteOfTheDay } from '../data/quotes';

export function DashboardPage() {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quote = quoteOfTheDay();

  useEffect(() => {
    if (!token || !user) return;

    const load = async () => {
      try {
        if (user.role === 'STUDENT') {
          const [mine, stats, myTasks] = await Promise.all([
            coursesApi.mine(token),
            analyticsApi.studentMe(token),
            tasksApi.mine(token),
          ]);
          setCourses(mine.map((e) => e.course));
          setAnalytics(stats);
          setTasks(myTasks);
        } else if (user.role === 'PROFESSOR' || user.role === 'ADMIN') {
          const [all, myTasks] = await Promise.all([coursesApi.list(token, { pageSize: 100 }), tasksApi.mine(token)]);
          setCourses(all.items.filter((c) => c.professorId === user.id));
          setTasks(myTasks);
        } else {
          const myTasks = await tasksApi.mine(token);
          setTasks(myTasks);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  if (!user) return null;

  const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';
  const showCourseCards = user.role === 'STUDENT' || user.role === 'PROFESSOR' || user.role === 'ADMIN';

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.dashboard')}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {t('dashboard.greeting')}, {user.firstName || user.email.split('@')[0]}
      </h1>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {t('dashboard.quoteLabel')}
          </p>
          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{quote[language]}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {showCourseCards && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className={cardClass}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              {user.role === 'STUDENT' ? t('dashboard.enrolledCourses') : t('dashboard.coursesTaught')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-gray-900 dark:text-white">
              {loading ? '—' : courses.length}
            </p>
          </div>
          {user.role === 'STUDENT' && (
            <div className={cardClass}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{t('dashboard.averageGrade')}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? '—' : (analytics?.averageGrade ?? '—')}
              </p>
            </div>
          )}
          <div className={cardClass}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
              <QrCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              {user.role === 'STUDENT' ? t('dashboard.attendanceRate') : 'Role'}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-gray-900 dark:text-white">
              {user.role === 'STUDENT'
                ? loading
                  ? '—'
                  : analytics?.attendanceRate !== null && analytics?.attendanceRate !== undefined
                    ? `${analytics.attendanceRate}%`
                    : '—'
                : user.role}
            </p>
          </div>
        </div>
      )}

      {user.role === 'STUDENT' && !loading && analytics && analytics.gradesOverTime.length > 0 && (
        <div className={`mt-8 ${cardClass}`}>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('dashboard.gradesOverTime')}</p>
          <div className="mt-4">
            <GradeTrendChart points={analytics.gradesOverTime} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <ListChecks className="h-4 w-4 text-gray-400" />
            {t('dashboard.myTasks')}
          </h2>
          <Link to="/app/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            {t('common.viewAll')}
          </Link>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
        ) : tasks.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.noTasks')}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {tasks.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                to={task.link}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-surface-darkCard dark:hover:border-gray-700"
              >
                <span className="text-gray-900 dark:text-white">{task.title}</span>
                <span className="text-xs text-gray-400">{task.description}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCourseCards && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.role === 'STUDENT' ? t('dashboard.yourCourses') : t('dashboard.coursesYouTeach')}
            </h2>
            <Link to="/app/courses" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t('common.viewAll')}
            </Link>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
          ) : courses.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {user.role === 'STUDENT' ? t('dashboard.noCoursesStudent') : t('dashboard.noCoursesProfessor')}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {courses.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/courses/${c.id}`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-surface-darkCard dark:hover:border-gray-700"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{c.title}</p>
                  {c.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{c.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
