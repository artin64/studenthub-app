import { RefreshCw } from 'lucide-react';
import { Reveal } from './Reveal';
import { CYCLE } from '../data/content';

export function AcademicCycle() {
  return (
    <section id="cycle" className="border-t border-gray-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide text-gray-600">
              <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
              The Academic Cycle
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              One continuous system, from enrollment to career.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Every stage of a student's academic life runs on the same platform, so nothing gets lost
              in the handoff between tools.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-16">
            <div className="hidden md:block">
              <div className="grid grid-cols-8 gap-2">
                {CYCLE.map((stage) => (
                  <div key={stage.n} className="flex flex-col items-center text-center">
                    <div className="relative flex h-4 w-full items-center justify-center">
                      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-200" />
                      <div className="relative z-10 h-2 w-2 rounded-full bg-blue-600 ring-4 ring-white" />
                    </div>
                    <p className="mt-3 font-mono text-xs text-gray-400">{stage.n}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{stage.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {CYCLE.map((stage) => (
                <div
                  key={stage.n}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <span className="font-mono text-xs text-gray-400">{stage.n}</span>
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
