import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Reveal } from './Reveal';
import { PLANS } from '../data/content';

export function Plans() {
  return (
    <section id="pricing" className="border-t border-gray-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Plans for every institution.
            </h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={`h-full rounded-2xl border p-7 ${
                  plan.highlighted ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                }`}
              >
                <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className={`flex items-start gap-2.5 text-sm ${
                        plan.highlighted ? 'text-gray-200' : 'text-gray-600'
                      }`}
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      />
                      {feat}
                    </li>
                  ))}
                </ul>
                {plan.name === 'Student' ? (
                  <Link
                    to="/register"
                    className="mt-8 block w-full rounded-full bg-gray-900 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    className={`mt-8 w-full rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
