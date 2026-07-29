// A small, honest chip for the bar's right cluster instead of faked cpu/temp.
// Prefers the git short hash; falls back to the build date. The Docker image
// excludes .git (see .dockerignore), so production renders the date.

import { execFileSync } from 'node:child_process';

export function getBuildStamp(): string {
  try {
    // No shell, fixed argument array — nothing interpolated, nothing to inject.
    const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (hash) return `#${hash}`;
  } catch {
    // no git in the build context — fall through to the date
  }
  return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit' }).format(new Date());
}
