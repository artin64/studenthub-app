import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { notificationsApi, type Notification } from '../lib/api';

export function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    const refresh = () => {
      notificationsApi.unreadCount(token).then(setUnreadCount);
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && token) {
      const list = await notificationsApi.list(token);
      setNotifications(list);
    }
  };

  const onMarkAllRead = async () => {
    if (!token) return;
    await notificationsApi.markAllRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const onMarkRead = async (id: string) => {
    if (!token) return;
    await notificationsApi.markRead(token, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 font-mono text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 dark:border-gray-800 dark:bg-surface-darkCard">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 ${
                    n.read ? '' : 'bg-blue-50/50 dark:bg-blue-500/5'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                  <p className="mt-1 font-mono text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
