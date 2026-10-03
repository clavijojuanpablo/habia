import { elapsedMs, formatClock, leftMs, pauseTimer, resumeTimer, startTimer } from './focus-timer';

const MIN = 60_000;

describe('focus timer', () => {
  it('counts down from the end time, never below zero', () => {
    const timer = startTimer(25, 0);
    expect(leftMs(timer, 0)).toBe(25 * MIN);
    expect(leftMs(timer, 10 * MIN)).toBe(15 * MIN);
    expect(leftMs(timer, 30 * MIN)).toBe(0);
  });

  it('keeps going in the background: only the end time matters', () => {
    const timer = startTimer(10, 1_000);
    // The app slept for 7 minutes: nothing ticked, the math still holds.
    expect(leftMs(timer, 1_000 + 7 * MIN)).toBe(3 * MIN);
  });

  it('freezes while paused and resumes where it was', () => {
    const paused = pauseTimer(startTimer(10, 0), 4 * MIN);
    expect(leftMs(paused, 50 * MIN)).toBe(6 * MIN);
    const resumed = resumeTimer(paused, 50 * MIN);
    expect(leftMs(resumed, 51 * MIN)).toBe(5 * MIN);
    expect(elapsedMs(resumed, 51 * MIN)).toBe(5 * MIN);
  });

  it('formats the clock', () => {
    expect(formatClock(25 * MIN)).toBe('25:00');
    expect(formatClock(61_500)).toBe('01:02');
    expect(formatClock(62 * MIN)).toBe('1:02:00');
    expect(formatClock(0)).toBe('00:00');
  });
});
