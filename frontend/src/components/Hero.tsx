import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CHART_BARS } from '../data/content';
import { BookDemoModal } from './BookDemoModal';

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Dashboard</p>
            <p className="text-base font-semibold text-gray-900">Good morning, Artin</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-900" />
        </div>

        <div className="mt-5 rounded-xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insight
          </div>
          <p className="mt-1.5 text-sm text-gray-700">
            Your Database performance improved{' '}
            <span className="font-mono font-semibold text-gray-900">18%</span> this week.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-400">Courses</p>
            <p className="mt-1 font-mono text-lg font-semibold text-gray-900">6</p>
            <p className="text-xs text-gray-400">active</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-400">Schedule</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">Today</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-400">Tasks</p>
            <p className="mt-1 font-mono text-lg font-semibold text-gray-900">4</p>
            <p className="text-xs text-gray-400">pending</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Academic Progress</span>
            <span className="font-mono font-medium text-emerald-600">+12%</span>
          </div>
          <div className="mt-2 flex h-16 items-end gap-1.5">
            {CHART_BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-blue-600" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg sm:block">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Attendance</p>
            <p className="text-sm font-semibold text-gray-900">
              <span className="font-mono">94%</span> · Excellent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? undefined : { opacity: 0, y: 16 };
  const animate = reduceMotion ? undefined : { opacity: 1, y: 0 };
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:pb-32 lg:pt-24">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div>
          <motion.div
            initial={initial}
            animate={animate}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide text-gray-600"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            AI-Native Digital Campus
          </motion.div>
          <motion.h1
            initial={initial}
            animate={animate}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
            className="mt-6 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            The intelligent operating system for modern education.
          </motion.h1>
          <motion.p
            initial={initial}
            animate={animate}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.16 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600"
          >
            Learn. Create. Achieve. StudentHub unifies courses, attendance, exams, AI tutoring, and career
            tools into a single platform built for the next decade of learning.
          </motion.p>
          <motion.div
            initial={initial}
            animate={animate}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-white"
            >
              Book a demo
            </button>
          </motion.div>
          <motion.p
            initial={initial}
            animate={animate}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.32 }}
            className="mt-8 font-mono text-xs uppercase tracking-wider text-gray-400"
          >
            Built for universities, schools & bootcamps
          </motion.p>
        </div>
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          <DashboardPreview />
        </motion.div>
      </div>
      <BookDemoModal open={showDemo} onClose={() => setShowDemo(false)} />
    </section>
  );
}
