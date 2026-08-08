import { Award, Brain } from 'lucide-react';
import { Reveal } from './Reveal';

const INSIGHTS = [
  'Predictive completion & risk scoring',
  'Personalized course & certification paths',
  'Strength and weakness mapping by subject',
];

export function IntelligenceSpotlight() {
  return (
    <section className="border-t border-gray-200 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide text-gray-600">
                <Brain className="h-3.5 w-3.5 text-indigo-500" />
                Student Intelligence Center
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Beyond grades. Real academic intelligence.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                StudentHub's AI continuously reads performance and engagement to surface strengths, flag
                risk early, and recommend the next best step, for every student, automatically.
              </p>
              <ul className="mt-8 space-y-3">
                {INSIGHTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Brain className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7">
              <p className="text-xs font-medium text-gray-400">Your Academic Intelligence</p>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4">
                <div>
                  <p className="text-xs text-gray-400">Current Level</p>
                  <p className="text-sm font-semibold text-gray-900">Advanced Student</p>
                </div>
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-gray-400">Strength</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">Programming</p>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-gray-400">Focus Area</p>
                  <p className="mt-1 text-sm font-semibold text-amber-600">Mathematics</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">Semester Completion Forecast</p>
                  <p className="font-mono text-sm font-bold text-indigo-600">92%</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
