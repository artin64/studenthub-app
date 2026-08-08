import { useEffect, useState, type FormEvent } from 'react';
import { Award, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { portfolioApi, gamificationApi, certificatesApi, type PortfolioItem, type Certificate } from '../lib/api';

export function PortfolioPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [xp, setXp] = useState<{ xp: number; level: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const [mine, certs, level] = await Promise.all([
      portfolioApi.mine(token),
      certificatesApi.mine(token),
      gamificationApi.me(token),
    ]);
    setItems(mine);
    setCertificates(certs);
    setXp(level);
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
      await portfolioApi.create(token, { title, description: description || undefined, link: link || undefined });
      setTitle('');
      setDescription('');
      setLink('');
      await load();
    } finally {
      setAdding(false);
    }
  };

  const onRemove = async (id: string) => {
    if (!token) return;
    await portfolioApi.remove(token, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Portfolio</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Your achievements
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
            <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Level</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{loading ? '—' : xp?.level}</p>
        </div>
        <div className={cardClass}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Experience</p>
          <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
            {loading ? '—' : xp?.xp} XP
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Certificates</h2>
        {loading ? (
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : certificates.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">None issued yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {certificates.map((c) => (
              <div key={c.id} className={cardClass}>
                <p className="font-medium text-gray-900 dark:text-white">{c.course?.title}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Issued {new Date(c.issuedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Projects</h2>
        <form onSubmit={onAdd} className={`mt-3 space-y-3 ${cardClass}`}>
          <input
            required
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <input
            placeholder="Link (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {adding ? 'Adding…' : 'Add project'}
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`flex items-start justify-between ${cardClass}`}>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                )}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {item.link} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="text-gray-300 hover:text-red-500 dark:text-gray-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
