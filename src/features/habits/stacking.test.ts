import { activeAnchorId, stackDepth, wouldCreateCycle } from './stacking';

// coffee → study → review
const coffee = { id: 'coffee', anchor_habit_id: null, cue_type: 'time' };
const study = { id: 'study', anchor_habit_id: 'coffee', cue_type: 'after_habit' };
const review = { id: 'review', anchor_habit_id: 'study', cue_type: 'after_habit' };
const habits = [coffee, study, review];

describe('habit stacking', () => {
  it('only follows anchors when the cue is after_habit and the anchor is active', () => {
    expect(activeAnchorId(study, habits)).toBe('coffee');
    expect(activeAnchorId({ ...study, cue_type: 'time' }, habits)).toBeNull();
    expect(activeAnchorId(study, [study])).toBeNull(); // anchor archived
  });

  it('detects cycles through the whole chain', () => {
    expect(wouldCreateCycle(habits, 'coffee', 'review')).toBe(true);
    expect(wouldCreateCycle(habits, 'coffee', 'coffee')).toBe(true);
    expect(wouldCreateCycle(habits, 'review', 'coffee')).toBe(false);
    expect(wouldCreateCycle(habits, undefined, 'coffee')).toBe(false); // new habit
  });

  it('computes the depth in the chain', () => {
    expect(habits.map((h) => stackDepth(h, habits))).toEqual([0, 1, 2]);
  });
});
