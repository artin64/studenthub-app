import { Reveal } from './Reveal';
import { FEATURES } from '../data/content';

export function Features() {
  return (
    <section id="product" className="border-t border-gray-200 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              One platform, every part of academic life.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From the first lecture to the first job offer, StudentHub replaces a dozen disconnected
              tools with one intelligent system.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
