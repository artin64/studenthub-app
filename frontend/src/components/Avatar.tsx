import { resolveUploadUrl } from '../lib/api';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ firstName, lastName, imageUrl, size = 32, className = '' }: AvatarProps) {
  const src = resolveUploadUrl(imageUrl);
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName ?? ''} ${lastName ?? ''}`.trim()}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`flex items-center justify-center rounded-full bg-blue-100 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 ${className}`}
    >
      {initials}
    </div>
  );
}
