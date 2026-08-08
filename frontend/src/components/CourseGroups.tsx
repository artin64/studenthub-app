import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { groupsApi, type ProjectGroup } from '../lib/api';

export function CourseGroups({ courseId, isProfessor }: { courseId: string; isProfessor: boolean }) {
  const { token, user } = useAuth();
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!token) return;
    const list = await groupsApi.listForCourse(token, courseId);
    setGroups(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token, courseId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      await groupsApi.create(token, courseId, name);
      setName('');
      await load();
    } finally {
      setCreating(false);
    }
  };

  const onJoin = async (groupId: string) => {
    if (!token) return;
    await groupsApi.join(token, groupId);
    await load();
  };

  const onLeave = async (groupId: string) => {
    if (!token) return;
    await groupsApi.leave(token, groupId);
    await load();
  };

  const isMember = (group: ProjectGroup) => group.members.some((m) => m.student.id === user?.id);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project groups</h2>
      </div>

      {isProfessor && (
        <form onSubmit={onCreate} className="mt-4 flex gap-2">
          <input
            required
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <button
            type="submit"
            disabled={creating}
            className="whitespace-nowrap rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            Create
          </button>
        </form>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No groups yet.</p>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
            >
              <p className="font-medium text-gray-900 dark:text-white">{g.name}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {g.members.length === 0
                  ? 'No members yet'
                  : g.members.map((m) => `${m.student.firstName} ${m.student.lastName}`).join(', ')}
              </p>
              {!isProfessor && (
                <button
                  onClick={() => (isMember(g) ? onLeave(g.id) : onJoin(g.id))}
                  className="mt-3 rounded-full border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {isMember(g) ? 'Leave' : 'Join'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
