/**
 * The focus timer as plain data, so it survives the app going to the background: a running timer
 * stores when it ends (not how much is left), and "now" says the rest.
 */
export type FocusTimer =
  | { phase: 'setup'; minutes: number }
  | { phase: 'running'; minutes: number; endsAt: number }
  | { phase: 'paused'; minutes: number; leftMs: number }
  | { phase: 'finished'; minutes: number };

/** Below this, stopping early is just leaving: two minutes is the habit's minimum (2-minute rule). */
export const MINIMUM_FOCUS_MS = 2 * 60 * 1000;

export const startTimer = (minutes: number, now: number): FocusTimer => ({
  phase: 'running',
  minutes,
  endsAt: now + minutes * 60_000,
});

export function leftMs(timer: FocusTimer, now: number): number {
  if (timer.phase === 'running') return Math.max(0, timer.endsAt - now);
  if (timer.phase === 'paused') return timer.leftMs;
  if (timer.phase === 'finished') return 0;
  return timer.minutes * 60_000;
}

export const elapsedMs = (timer: FocusTimer, now: number) => timer.minutes * 60_000 - leftMs(timer, now);

export function pauseTimer(timer: FocusTimer, now: number): FocusTimer {
  return timer.phase === 'running' ? { phase: 'paused', minutes: timer.minutes, leftMs: leftMs(timer, now) } : timer;
}

export function resumeTimer(timer: FocusTimer, now: number): FocusTimer {
  return timer.phase === 'paused' ? { phase: 'running', minutes: timer.minutes, endsAt: now + timer.leftMs } : timer;
}

/** "24:05", or "1:02:00" past an hour. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
