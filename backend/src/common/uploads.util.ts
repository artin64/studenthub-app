import { join } from 'path';
import { mkdirSync } from 'fs';

// process.cwd() is the directory `npm run start` / `node dist/main.js` was
// launched from — the backend project root in every normal setup. Using
// this instead of __dirname math means main.ts (compiled to dist/main.js)
// and users.controller.ts (compiled to dist/users/users.controller.js)
// always agree on the same absolute folder, regardless of how deep a file
// sits in dist/.
export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
export const AVATARS_DIR = join(UPLOADS_ROOT, 'avatars');

export function ensureUploadDirs() {
  mkdirSync(AVATARS_DIR, { recursive: true });
}
