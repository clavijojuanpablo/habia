import { useCircleHabits, useCircles } from './api';

/**
 * "🤝 Familia" per shared circle habit id, computed once per screen. The circle queries only run
 * when some habit is linked, so people without circles pay nothing.
 */
export function useCircleLabels(linked: boolean): Record<string, string> {
  const { data: circleHabits } = useCircleHabits(linked);
  const { data: circles } = useCircles(linked);
  const nameById = Object.fromEntries((circles?.circles ?? []).map((c) => [c.id, c.name]));
  return Object.fromEntries(
    (circleHabits ?? []).flatMap((h) => (nameById[h.circle_id] ? [[h.id, '🤝 ' + nameById[h.circle_id]]] : [])),
  );
}
