import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { BookDemoModal } from './BookDemoModal';

export function FinalCta() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="border-t border-gray-200 bg-gray-900 py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to modernize your campus?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Join the next generation of universities, schools, and bootcamps running on StudentHub.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              Get Started
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="rounded-full border border-gray-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Book a demo
            </button>
          </div>
        </Reveal>
      </div>
      <BookDemoModal open={showDemo} onClose={() => setShowDemo(false)} />
    </section>
  );
}
