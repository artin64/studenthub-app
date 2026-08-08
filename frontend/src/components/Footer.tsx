import { Logomark } from './Logomark';
import { FOOTER_COLUMNS } from '../data/content';

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logomark />
              <span className="text-lg font-semibold text-white">StudentHub</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-gray-400">
              The AI-powered digital campus operating system. Learning, administration, and career,
              unified.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-white">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-400 transition-colors hover:text-white">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">© 2026 StudentHub. All rights reserved.</p>
          <p className="font-mono text-xs text-gray-500">contact@studenthub.app</p>
        </div>
      </div>
    </footer>
  );
}
