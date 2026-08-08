import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  BarChart3,
  GraduationCap,
  Users,
  Building2,
} from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Bot,
    title: 'AI Personal Tutor',
    desc: 'Instant explanations, practice sets, and flashcards tailored to every student.',
  },
  {
    icon: QrCode,
    title: 'QR Attendance',
    desc: 'Dynamic, tokenized QR codes with device verification. Attendance in seconds.',
  },
  {
    icon: CheckCircle2,
    title: 'AI Assignment Evaluation',
    desc: 'Automated feedback on structure, code quality, and originality.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Online Exams',
    desc: 'Lockdown browser, tab-switch detection, and full activity monitoring.',
  },
  {
    icon: Briefcase,
    title: 'Career Hub',
    desc: 'CV builder, portfolios, internships, and direct company applications.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'Performance insight for students, professors, and administrators alike.',
  },
];

export interface Audience {
  icon: LucideIcon;
  label: string;
  heading: string;
  points: string[];
}

export const AUDIENCES: Audience[] = [
  {
    icon: GraduationCap,
    label: 'For Students',
    heading: 'Study smarter, not harder.',
    points: [
      '24/7 AI tutor for every subject',
      'Fully transparent grading',
      'Portfolio & CV built as you learn',
      'XP, badges, and leaderboards',
    ],
  },
  {
    icon: Users,
    label: 'For Professors',
    heading: 'Teach without the busywork.',
    points: [
      'AI-assisted grading for docs & code',
      'Real-time class analytics',
      'One place for materials & exams',
      'Built-in messaging with classes',
    ],
  },
  {
    icon: Building2,
    label: 'For Institutions',
    heading: 'Run your campus with confidence.',
    points: [
      'Centralized multi-faculty admin',
      'Automatic ECTS & credit tracking',
      'Full audit trail & role security',
      'Multi-language, out of the box',
    ],
  },
];

export interface Plan {
  name: string;
  desc: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    name: 'Student',
    desc: 'Personal learning, free for every enrolled student.',
    features: ['AI Tutor & study planner', 'Portfolio & certificates', 'Career Hub access'],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    name: 'Institution',
    desc: 'For schools, faculties, and departments.',
    features: ['Full course & attendance suite', 'Professor analytics', 'ECTS & admin tools'],
    highlighted: true,
    cta: 'Book a demo',
  },
  {
    name: 'Enterprise',
    desc: 'Multi-campus universities with custom needs.',
    features: ['Custom integrations & SSO', 'Dedicated support', 'Advanced security & audit'],
    highlighted: false,
    cta: 'Contact sales',
  },
];

export interface FooterColumn {
  title: string;
  links: string[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  { title: 'Product', links: ['Courses', 'AI Tutor', 'Attendance', 'Exams'] },
  { title: 'Institutions', links: ['Universities', 'Schools', 'Security', 'Pricing'] },
  { title: 'Company', links: ['About', 'Contact', 'Demo'] },
];

export interface CycleStage {
  n: string;
  label: string;
}

export const CYCLE: CycleStage[] = [
  { n: '01', label: 'Enroll' },
  { n: '02', label: 'Learn' },
  { n: '03', label: 'Materials' },
  { n: '04', label: 'Assignments' },
  { n: '05', label: 'Evaluation' },
  { n: '06', label: 'Exams' },
  { n: '07', label: 'Results' },
  { n: '08', label: 'Career' },
];

export const CHART_BARS = [38, 52, 46, 60, 55, 70, 64, 80];

export const NAV_LINKS = [
  { label: 'Cycle', href: '#cycle' },
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#audiences' },
  { label: 'Pricing', href: '#pricing' },
];
