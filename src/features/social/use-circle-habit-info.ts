import { useCircleHabits, useCircles } from './api';

export type CircleHabitInfo = { label: string; circleId: string; photoRequired: boolean };

/**
 * Per shared circle habit id: its label ("🤝 Familia"), circle and whether it asks for a photo,
 * computed once per screen. The circle queries only run when some habit is linked, so people
 * without circles pay nothing.
 */
export function useCircleHabitInfo(linked: boolean): Record<string, CircleHabitInfo> {
  const { data: circleHabits } = useCircleHabits(linked);
  const { data: circles } = useCircles(linked);
  const nameById = Object.fromEntries((circles?.circles ?? []).map((c) => [c.id, c.name]));
  return Object.fromEntries(
    (circleHabits ?? []).flatMap((h) =>
      nameById[h.circle_id]
        ? [[h.id, { label: '🤝 ' + nameById[h.circle_id], circleId: h.circle_id, photoRequired: h.photo_required }]]
        : [],
    ),
  );
}
