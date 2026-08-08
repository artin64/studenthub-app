import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  QrCode,
  Settings,
  LogOut,
  Sun,
  Moon,
  Briefcase,
  Trophy,
  Building2,
  Users,
  CreditCard,
  Library,
  ShieldCheck,
  Heart,
  MessageSquare,
  GraduationCap,
  ListChecks,
} from 'lucide-react';
import { Logomark } from './Logomark';
import { Avatar } from './Avatar';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';
import { useLanguage } from '../lib/language-context';

const ALL_ROLES = ['STUDENT', 'PROFESSOR', 'ADMIN', 'PARENT', 'COMPANY'];

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const navItems = [
    { to: '/app', label: t('nav.dashboard'), icon: LayoutDashboard, end: true, roles: ALL_ROLES },
    { to: '/app/tasks', label: t('nav.tasks'), icon: ListChecks, roles: ['STUDENT', 'PROFESSOR', 'ADMIN', 'PARENT'] },
    { to: '/app/messages', label: t('nav.messages'), icon: MessageSquare, roles: ALL_ROLES },
    { to: '/app/courses', label: t('nav.courses'), icon: BookOpen, roles: ['STUDENT', 'PROFESSOR', 'ADMIN'] },
    { to: '/app/mentors', label: t('nav.mentors'), icon: GraduationCap, roles: ['STUDENT', 'PARENT', 'PROFESSOR', 'ADMIN'] },
    { to: '/app/grades', label: t('nav.grades'), icon: Award, roles: ['STUDENT'] },
    { to: '/app/attendance', label: t('nav.attendance'), icon: QrCode, roles: ['STUDENT'] },
    { to: '/app/portfolio', label: t('nav.portfolio'), icon: Briefcase, roles: ['STUDENT'] },
    { to: '/app/career', label: t('nav.career'), icon: Building2, roles: ['STUDENT', 'COMPANY'] },
    { to: '/app/leaderboard', label: t('nav.leaderboard'), icon: Trophy, roles: ['STUDENT', 'PROFESSOR', 'ADMIN'] },
    { to: '/app/alumni', label: t('nav.alumni'), icon: Users, roles: ['STUDENT', 'PROFESSOR', 'ADMIN'] },
    { to: '/app/id-card', label: t('nav.idCard'), icon: CreditCard, roles: ['STUDENT', 'PROFESSOR', 'ADMIN'] },
    { to: '/app/library', label: t('nav.library'), icon: Library, roles: ['STUDENT', 'PROFESSOR', 'ADMIN'] },
    { to: '/app/admin', label: t('nav.admin'), icon: ShieldCheck, roles: ['ADMIN'] },
    { to: '/app/parent', label: t('nav.myChildren'), icon: Heart, roles: ['PARENT'] },
    { to: '/app/settings', label: t('nav.settings'), icon: Settings, roles: ALL_ROLES },
  ].filter((item) => !user || item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-surface-dark">
      <aside className="hidden w-60 flex-col border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-surface-darkCard sm:flex">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Logomark className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
            StudentHub
          </span>
        </div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? t('settings.light') : t('settings.dark')}
          </button>
          <Link to="/app/settings" className="mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5">
            <Avatar firstName={user?.firstName} lastName={user?.lastName} imageUrl={user?.profileImageUrl} size={28} />
            <span className="min-w-0">
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
              <span className="block font-mono text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {user?.role}
              </span>
            </span>
          </Link>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logOut')}
          </button>
        </div>
      </aside>
      <main className="flex-1">
        <div className="flex items-center justify-end border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-surface-darkCard sm:px-10">
          <NotificationBell />
        </div>
        <div className="p-6 sm:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
