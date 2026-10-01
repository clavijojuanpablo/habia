import { STREAK_MILESTONES } from './compute-streak';
import { milestoneWindow } from './milestone-window';

// [3, 7, 14, 30, 66, 100, 365]
describe('milestoneWindow', () => {
  it('starts at the beginning on the way to the first milestones', () => {
    expect(milestoneWindow(0, STREAK_MILESTONES)).toEqual({ shown: [3, 7, 14, 30], target: 0 });
    expect(milestoneWindow(5, STREAK_MILESTONES)).toEqual({ shown: [3, 7, 14, 30], target: 1 });
  });

  it('keeps the last reached milestone, the target and the next two', () => {
    expect(milestoneWindow(9, STREAK_MILESTONES)).toEqual({ shown: [7, 14, 30, 66], target: 1 });
    expect(milestoneWindow(40, STREAK_MILESTONES)).toEqual({ shown: [30, 66, 100, 365], target: 1 });
  });

  it('counts a milestone as reached on its exact day', () => {
    expect(milestoneWindow(14, STREAK_MILESTONES).shown).toEqual([14, 30, 66, 100]);
  });

  it('clamps at the end', () => {
    expect(milestoneWindow(120, STREAK_MILESTONES)).toEqual({ shown: [30, 66, 100, 365], target: 3 });
    expect(milestoneWindow(400, STREAK_MILESTONES)).toEqual({ shown: [30, 66, 100, 365], target: -1 });
  });
});
