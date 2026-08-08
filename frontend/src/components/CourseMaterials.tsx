import { useEffect, useState, type FormEvent } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { materialsApi, type CourseMaterial } from '../lib/api';

export function CourseMaterials({ courseId, isProfessor }: { courseId: string; isProfessor: boolean }) {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!token) return;
    const list = await materialsApi.listForCourse(token, courseId);
    setMaterials(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token, courseId]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdding(true);
    try {
      await materialsApi.create(token, courseId, { title, url });
      setTitle('');
      setUrl('');
      setShowAdd(false);
      await load();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Materials</h2>
        {isProfessor && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            + Add material
          </button>
        )}
      </div>

      {showAdd && (
        <form
          onSubmit={onAdd}
          className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
        >
          <input
            required
            placeholder="Title (e.g. Week 3 slides)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <input
            required
            placeholder="Link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : materials.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No materials yet.</p>
        ) : (
          materials.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-surface-darkCard dark:hover:border-gray-700"
            >
              <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{m.title}</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
            </a>
          ))
        )}
      </div>
    </div>
  );
}
