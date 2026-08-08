import { Link } from 'react-router-dom';
import { Logomark } from './Logomark';
import { NAV_LINKS } from '../data/content';

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-neutral-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <Logomark />
          <span className="text-lg font-semibold tracking-tight text-gray-900">StudentHub</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:block"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
