import { useEffect, useState, type FormEvent } from 'react';
import { MessageSquare, Clock, Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { forumApi, type ForumPost, type ForumReply } from '../lib/api';

const STATUS_BADGE: Record<ForumPost['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

function PostRow({ post, isProfessor, onModerated }: { post: ForumPost; isProfessor: boolean; onModerated: () => void }) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const onToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && token && post.status === 'APPROVED') {
      const full = await forumApi.getPost(token, post.id);
      setReplies(full.replies);
    }
  };

  const onReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !reply.trim()) return;
    setSending(true);
    try {
      await forumApi.addReply(token, post.id, reply);
      setReply('');
      const full = await forumApi.getPost(token, post.id);
      setReplies(full.replies);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard">
      <button onClick={onToggle} className="flex w-full items-start justify-between text-left">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
            {post.status !== 'APPROVED' && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_BADGE[post.status]}`}>
                {post.status === 'PENDING' ? t('forum.pendingApproval') : t('forum.rejected')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.content}</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {post.author ? `${post.author.firstName} ${post.author.lastName}` : ''} · {post._count?.replies ?? 0} replies
          </p>
        </div>
      </button>

      {isProfessor && post.status === 'PENDING' && (
        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            onClick={async () => {
              if (!token) return;
              await forumApi.approvePost(token, post.id);
              onModerated();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Check className="h-3 w-3" /> {t('common.approve')}
          </button>
          <button
            onClick={async () => {
              if (!token) return;
              await forumApi.rejectPost(token, post.id);
              onModerated();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            <X className="h-3 w-3" /> {t('common.reject')}
          </button>
        </div>
      )}

      {open && post.status === 'APPROVED' && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          {replies.map((r) => (
            <div key={r.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {r.author ? `${r.author.firstName} ${r.author.lastName}` : ''}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.content}</p>
            </div>
          ))}
          <form onSubmit={onReply} className="flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
            >
              Reply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function CourseForum({ courseId, isProfessor }: { courseId: string; isProfessor: boolean }) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [pending, setPending] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (!token) return;
    const list = await forumApi.listForCourse(token, courseId);
    setPosts(list);
    if (isProfessor) {
      const pendingList = await forumApi.listPending(token, courseId);
      setPending(pendingList);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, courseId, isProfessor]);

  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPosting(true);
    try {
      await forumApi.createPost(token, courseId, { title, content });
      setTitle('');
      setContent('');
      setShowNew(false);
      await load();
    } finally {
      setPosting(false);
    }
  };

  // Professors see their moderation queue merged in with everything else,
  // students/parents-of-context only ever see APPROVED posts plus their own.
  const combined = isProfessor
    ? [...pending, ...posts.filter((p) => !pending.some((pp) => pp.id === p.id))]
    : posts;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          Discussion
          {isProfessor && pending.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock className="h-3 w-3" /> {pending.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          + New post
        </button>
      </div>

      {showNew && (
        <form
          onSubmit={onPost}
          className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard"
        >
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          <textarea
            required
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
          />
          {!isProfessor && <p className="text-xs text-gray-400 dark:text-gray-500">{t('forum.pendingApproval')}</p>}
          <button
            type="submit"
            disabled={posting}
            className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : combined.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" /> No discussion yet.
          </p>
        ) : (
          combined.map((post) => <PostRow key={post.id} post={post} isProfessor={isProfessor} onModerated={load} />)
        )}
      </div>
    </div>
  );
}
