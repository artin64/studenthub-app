import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { messagesApi, type ConversationSummary, type Message } from '../lib/api';

export function MessagesPage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get('with');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(withUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    if (!token) return;
    const list = await messagesApi.conversations(token);
    setConversations(list);
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    messagesApi.withUser(token, selectedId).then(setMessages);
    messagesApi.markRead(token, selectedId);
  }, [token, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedId || !content.trim()) return;
    setSending(true);
    try {
      await messagesApi.send(token, selectedId, content);
      setContent('');
      const updated = await messagesApi.withUser(token, selectedId);
      setMessages(updated);
      await loadConversations();
    } finally {
      setSending(false);
    }
  };

  const activeName =
    conversations.find((c) => c.user.id === selectedId)?.user ??
    (withUserId ? { firstName: 'New', lastName: 'conversation' } : null);

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Messages</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Inbox</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-surface-darkCard">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.user.id}
                onClick={() => setSelectedId(c.user.id)}
                className={`block w-full border-b border-gray-50 px-4 py-3 text-left last:border-0 dark:border-gray-800 ${
                  selectedId === c.user.id ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {c.user.firstName} {c.user.lastName}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{c.lastMessage}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white sm:col-span-2 dark:border-gray-800 dark:bg-surface-darkCard">
          {!selectedId ? (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Select a conversation.</p>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activeName ? `${activeName.firstName} ${activeName.lastName}` : ''}
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '360px' }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.senderId === user?.id
                        ? 'ml-auto bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={onSend} className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
