import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Info, AlertTriangle, Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { tasksApi, usersApi, parentApi, type TaskItem } from '../lib/api';

const SEVERITY_STYLES: Record<TaskItem['severity'], string> = {
  urgent: 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
  info: 'border-gray-200 bg-white dark:border-gray-800 dark:bg-surface-darkCard',
};

const SEVERITY_ICON: Record<TaskItem['severity'], typeof Info> = {
  urgent: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function TasksPage() {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!token) return;
    tasksApi
      .mine(token)
      .then(setTasks)
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const canModerate = user?.role === 'PROFESSOR' || user?.role === 'ADMIN';

  const handleApprove = async (task: TaskItem) => {
    if (!token) return;
    if (task.type === 'REGISTRATION_APPROVAL') {
      await usersApi.approve(token, task.id.replace('approval-', ''));
    } else if (task.type === 'PARENT_LINK_APPROVAL' && task.id.startsWith('link-')) {
      await parentApi.approveLink(token, task.id.replace('link-', ''));
    }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const handleReject = async (task: TaskItem) => {
    if (!token) return;
    if (task.type === 'REGISTRATION_APPROVAL') {
      await usersApi.reject(token, task.id.replace('approval-', ''));
    } else if (task.type === 'PARENT_LINK_APPROVAL' && task.id.startsWith('link-')) {
      await parentApi.rejectLink(token, task.id.replace('link-', ''));
    }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const isActionable = (task: TaskItem) =>
    canModerate &&
    (task.type === 'REGISTRATION_APPROVAL' || (task.type === 'PARENT_LINK_APPROVAL' && task.id.startsWith('link-') && task.id !== 'parent-links'));

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.tasks')}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t('tasks.title')}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('tasks.subtitle')}</p>

      {loading ? (
        <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
      ) : tasks.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t('tasks.empty')}</p>
      ) : (
        <div className="mt-6 space-y-2.5">
          {tasks.map((task) => {
            const Icon = SEVERITY_ICON[task.severity];
            const actionable = isActionable(task);
            const content = (
              <>
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    task.severity === 'urgent'
                      ? 'text-red-600 dark:text-red-400'
                      : task.severity === 'warning'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{task.description}</p>
                </div>
              </>
            );

            if (actionable) {
              return (
                <div key={task.id} className={`flex items-start gap-3 rounded-xl border p-4 ${SEVERITY_STYLES[task.severity]}`}>
                  {content}
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleApprove(task)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" /> {t('common.approve')}
                    </button>
                    <button
                      onClick={() => handleReject(task)}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white dark:border-gray-700 dark:text-gray-300"
                    >
                      <X className="h-3 w-3" /> {t('common.reject')}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={task.id}
                to={task.link}
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-gray-300 dark:hover:border-gray-700 ${SEVERITY_STYLES[task.severity]}`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
