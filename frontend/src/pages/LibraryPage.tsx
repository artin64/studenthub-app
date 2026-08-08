import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, ExternalLink, Plus } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { libraryApi, type LibraryResource } from '../lib/api';

export function LibraryPage() {
  const { token, user } = useAuth();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState('Book');
  const [link, setLink] = useState('');
  const [adding, setAdding] = useState(false);

  const canAdd = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white';

  const load = async () => {
    if (!token) return;
    const list = await libraryApi.list(token);
    setResources(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdding(true);
    try {
      await libraryApi.create(token, { title, author: author || undefined, type, link: link || undefined });
      setTitle('');
      setAuthor('');
      setLink('');
      setShowAdd(false);
      await load();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 dark:text-gray-500">Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Digital library
          </h1>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add resource
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={onAdd} className={`mt-6 space-y-3 ${cardClass}`}>
          <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option>Book</option>
              <option>Paper</option>
              <option>Article</option>
              <option>Video</option>
            </select>
          </div>
          <input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} className={inputClass} />
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : resources.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No resources yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <div key={r.id} className={cardClass}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="mt-3 font-medium text-gray-900 dark:text-white">{r.title}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {r.type}
                  {r.author ? ` · ${r.author}` : ''}
                </p>
                {r.link && (
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
