interface LogomarkProps {
  className?: string;
}

export function Logomark({ className = 'h-9 w-9' }: LogomarkProps) {
  return (
    <div className={`${className} flex items-center justify-center rounded-xl bg-gray-900`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <line x1="7" y1="17" x2="17" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        <line x1="7" y1="17" x2="17" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        <circle cx="7" cy="17" r="2.4" fill="white" />
        <circle cx="17" cy="7" r="2.4" fill="#60A5FA" />
        <circle cx="17" cy="17" r="2.4" fill="white" />
      </svg>
    </div>
  );
}
