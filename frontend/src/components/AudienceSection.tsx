import { CheckCircle2 } from 'lucide-react';
import { Reveal } from './Reveal';
import { AUDIENCES } from '../data/content';

export function AudienceSection() {
  return (
    <section id="audiences" className="border-t border-gray-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built for everyone on campus.
            </h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {AUDIENCES.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-gray-200 bg-white p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <p className="mt-5 font-mono text-xs uppercase tracking-wide text-blue-600">{item.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">{item.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
