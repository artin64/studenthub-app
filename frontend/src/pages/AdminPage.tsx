import { useEffect, useState, type FormEvent } from 'react';
import { Users, BookOpen, GraduationCap, CheckCircle2, Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import {
  analyticsApi,
  adminApi,
  usersApi,
  parentApi,
  demoRequestsApi,
  type InstitutionAnalytics,
  type Me,
  type Faculty,
  type ParentLinkRequest,
} from '../lib/api';

const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';
const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white';

export function AdminPage() {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<InstitutionAnalytics | null>(null);
  const [users, setUsers] = useState<Me[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [pendingUsers, setPendingUsers] = useState<Me[]>([]);
  const [pendingLinks, setPendingLinks] = useState<ParentLinkRequest[]>([]);
  const [demoRequests, setDemoRequests] = useState<Awaited<ReturnType<typeof demoRequestsApi.list>>>([]);
  const [loading, setLoading] = useState(true);

  const [facultyName, setFacultyName] = useState('');
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [addingDept, setAddingDept] = useState(false);

  const load = async () => {
    if (!token) return;
    const [overview, userList, facultyList, pendingList, pendingLinkList, demoList] = await Promise.all([
      analyticsApi.institution(token),
      usersApi.list(token, { pageSize: 50 }),
      adminApi.listFaculties(token),
      usersApi.listPending(token),
      parentApi.pendingLinkRequests(token),
      demoRequestsApi.list(token),
    ]);
    setStats(overview);
    setUsers(userList.items);
    setFaculties(facultyList);
    setPendingUsers(pendingList);
    setPendingLinks(pendingLinkList);
    setDemoRequests(demoList);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onApproveUser = async (id: string) => {
    if (!token) return;
    await usersApi.approve(token, id);
    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
  };
  const onRejectUser = async (id: string) => {
    if (!token) return;
    await usersApi.reject(token, id);
    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
  };
  const onApproveLink = async (id: string) => {
    if (!token) return;
    await parentApi.approveLink(token, id);
    setPendingLinks((prev) => prev.filter((l) => l.id !== id));
  };
  const onRejectLink = async (id: string) => {
    if (!token) return;
    await parentApi.rejectLink(token, id);
    setPendingLinks((prev) => prev.filter((l) => l.id !== id));
  };
  const onMarkContacted = async (id: string) => {
    if (!token) return;
    await demoRequestsApi.markContacted(token, id);
    setDemoRequests((prev) => prev.map((d) => (d.id === id ? { ...d, contacted: true } : d)));
  };

  const onAddFaculty = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingFaculty(true);
    try {
      await adminApi.createFaculty(token, facultyName);
      setFacultyName('');
      await load();
    } finally {
      setAddingFaculty(false);
    }
  };

  const onAddDepartment = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedFacultyId) return;
    setAddingDept(true);
    try {
      await adminApi.createDepartment(token, selectedFacultyId, departmentName);
      setDepartmentName('');
      await load();
    } finally {
      setAddingDept(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>;

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.admin')}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Institution overview
      </h1>

      {stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className={cardClass}>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Total users</p>
            <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
              {stats.usersByRole.reduce((s, r) => s + r.count, 0)}
            </p>
          </div>
          <div className={cardClass}>
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Courses</p>
            <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
              {stats.coursesCount}
            </p>
          </div>
          <div className={cardClass}>
            <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Avg grade</p>
            <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
              {stats.averageGrade ?? '—'}
            </p>
          </div>
          <div className={cardClass}>
            <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Attendance check-ins</p>
            <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
              {stats.attendanceCheckIns}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('approvals.title')}</h2>
        <div className={`mt-3 ${cardClass}`}>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('approvals.empty')}</p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {u.email} · <span className="font-mono">{u.role}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onApproveUser(u.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" /> {t('common.approve')}
                    </button>
                    <button
                      onClick={() => onRejectUser(u.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white dark:border-gray-700 dark:text-gray-300"
                    >
                      <X className="h-3 w-3" /> {t('common.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{t('approvals.parentLinks')}</h3>
        <div className={`mt-3 ${cardClass}`}>
          {pendingLinks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('approvals.empty')}</p>
          ) : (
            <div className="space-y-2">
              {pendingLinks.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 dark:bg-white/5">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {l.parent?.firstName} {l.parent?.lastName} → {l.student?.firstName} {l.student?.lastName}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onApproveLink(l.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" /> {t('common.approve')}
                    </button>
                    <button
                      onClick={() => onRejectLink(l.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white dark:border-gray-700 dark:text-gray-300"
                    >
                      <X className="h-3 w-3" /> {t('common.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {demoRequests.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">Demo requests</h3>
            <div className={`mt-3 ${cardClass}`}>
              <div className="space-y-2">
                {demoRequests.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 dark:bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {d.name} {d.institution ? `— ${d.institution}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">{d.email}{d.phone ? ` · ${d.phone}` : ''}</p>
                      {d.message && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{d.message}</p>}
                    </div>
                    {!d.contacted && (
                      <button
                        onClick={() => onMarkContacted(d.id)}
                        className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white dark:border-gray-700 dark:text-gray-300"
                      >
                        Mark contacted
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {stats && (
        <div className={`mt-8 ${cardClass}`}>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Users by role</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.usersByRole.map((r) => (
              <span
                key={r.role}
                className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300"
              >
                {r.role}: {r.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Add faculty</p>
          <form onSubmit={onAddFaculty} className="mt-3 flex gap-2">
            <input
              required
              placeholder="Faculty name"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={addingFaculty}
              className="whitespace-nowrap rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
            >
              Add
            </button>
          </form>
        </div>

        <div className={cardClass}>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Add department</p>
          <form onSubmit={onAddDepartment} className="mt-3 space-y-2">
            <select
              required
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select faculty…</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                required
                placeholder="Department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={addingDept}
                className="whitespace-nowrap rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>

      {faculties.length > 0 && (
        <div className="mt-4 space-y-2">
          {faculties.map((f) => (
            <div key={f.id} className={cardClass}>
              <p className="font-medium text-gray-900 dark:text-white">{f.name}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {f.departments.length === 0
                  ? 'No departments yet'
                  : f.departments.map((d) => d.name).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">All users</p>
        <div className={`mt-3 overflow-hidden ${cardClass} p-0`}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-white/5 dark:text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800">
                  <td className="px-5 py-3 text-gray-900 dark:text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{u.role}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{u.status}</td>
                  <td className="px-5 py-3 text-right">
                    {u.id !== user?.id && u.status === 'ACTIVE' && (
                      <button
                        onClick={async () => {
                          if (!token) return;
                          await usersApi.suspend(token, u.id);
                          await load();
                        }}
                        className="text-xs font-medium text-gray-400 hover:text-red-500"
                      >
                        Suspend
                      </button>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <button
                        onClick={async () => {
                          if (!token) return;
                          await usersApi.reactivate(token, u.id);
                          await load();
                        }}
                        className="text-xs font-medium text-gray-400 hover:text-emerald-500"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
