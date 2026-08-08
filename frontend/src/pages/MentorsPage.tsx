import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { mentorsApi, type Mentor } from '../lib/api';
import { Avatar } from '../components/Avatar';

export function MentorsPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const timeout = setTimeout(() => {
      mentorsApi
        .list(token, search || undefined)
        .then(setMentors)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [token, search]);

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.mentors')}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t('mentors.title')}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('mentors.subtitle')}</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('mentors.searchPlaceholder')}
        className="mt-6 w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-darkCard dark:text-white"
      />

      {loading ? (
        <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
            >
              <div className="flex items-center gap-3">
                <Avatar firstName={m.firstName} lastName={m.lastName} imageUrl={m.profileImageUrl} size={48} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {m.firstName} {m.lastName}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{m.bio || t('mentors.noBio')}</p>
              {m.coursesTaught.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {t('mentors.coursesTaught')}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.coursesTaught.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300"
                      >
                        {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
