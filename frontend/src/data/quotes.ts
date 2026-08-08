export interface Quote {
  sq: string;
  en: string;
  de: string;
}

// Rotates once per day (same quote for everyone on a given day) — a small
// "motif" moment on the dashboard, per the request for something that
// changes daily to set a positive tone when a student logs in.
export const DAILY_QUOTES: Quote[] = [
  {
    sq: 'Dituria është drita që s\u2019shuhet kurrë.',
    en: 'Knowledge is the light that never goes out.',
    de: 'Wissen ist das Licht, das nie erlischt.',
  },
  {
    sq: 'Çdo ditë është një mundësi për të mësuar diçka të re.',
    en: 'Every day is a chance to learn something new.',
    de: 'Jeder Tag ist eine Chance, etwas Neues zu lernen.',
  },
  {
    sq: 'Suksesi është shuma e përpjekjeve të vogla, të përsëritura çdo ditë.',
    en: 'Success is the sum of small efforts, repeated day in and day out.',
    de: 'Erfolg ist die Summe kleiner Anstrengungen, die täglich wiederholt werden.',
  },
  {
    sq: 'Nuk ka rrugë të shkurtër drejt vendeve që ia vlejnë.',
    en: "There's no shortcut to any place worth going.",
    de: 'Es gibt keine Abkürzung zu Orten, die es wert sind.',
  },
  {
    sq: 'Mëso sikur do të jetosh përgjithmonë.',
    en: 'Learn as if you will live forever.',
    de: 'Lerne, als würdest du ewig leben.',
  },
  {
    sq: 'Një libër i hapur është një mendje e hapur.',
    en: 'An open book is an open mind.',
    de: 'Ein offenes Buch ist ein offener Geist.',
  },
  {
    sq: 'Guximi fillon me një hap të vogël përpara.',
    en: 'Courage starts with one small step forward.',
    de: 'Mut beginnt mit einem kleinen Schritt nach vorne.',
  },
  {
    sq: 'Çdo mjeshtër dikur ishte fillestar.',
    en: 'Every master was once a beginner.',
    de: 'Jeder Meister war einmal ein Anfänger.',
  },
  {
    sq: 'Puna e sotme është dituria e nesërme.',
    en: "Today's effort is tomorrow's knowledge.",
    de: 'Die heutige Arbeit ist das Wissen von morgen.',
  },
  {
    sq: 'Mos ki frikë të bësh gabime — ki frikë të mos mësosh prej tyre.',
    en: "Don't be afraid to make mistakes — be afraid of not learning from them.",
    de: 'Hab keine Angst vor Fehlern — hab Angst davor, nichts aus ihnen zu lernen.',
  },
  {
    sq: 'Këmbëngulja e kthen të vështirën në të mundshme.',
    en: 'Persistence turns the difficult into the possible.',
    de: 'Beharrlichkeit macht das Schwierige möglich.',
  },
  {
    sq: 'Një pyetje e mirë vlen sa dhjetë përgjigje.',
    en: 'A good question is worth ten answers.',
    de: 'Eine gute Frage ist zehn Antworten wert.',
  },
  {
    sq: 'Rruga e mijëra hapave fillon me një hap të vetëm.',
    en: 'A journey of a thousand steps begins with a single step.',
    de: 'Eine Reise von tausend Schritten beginnt mit einem einzigen Schritt.',
  },
  {
    sq: 'Çdo ditë të mësosh diçka, edhe pak, është fitore.',
    en: 'Learning something new every day, even a little, is a victory.',
    de: 'Jeden Tag etwas Neues zu lernen, auch wenn es wenig ist, ist ein Sieg.',
  },
];

export function quoteOfTheDay(): Quote {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}
