import type { IdentityArea } from '@/features/identities/api';

export type SuggestedHabit = {
  /** i18n id: `onboarding.habits.<id>.name` and `.min` */
  id: string;
  icon: string;
  color: string;
  /** Local time `HH:MM`; habits without one are "any time". */
  time?: string;
};

/** Starter habits per identity area: small, concrete and easy to keep. */
export const AREA_HABITS: Record<IdentityArea, SuggestedHabit[]> = {
  health: [
    { id: 'water', icon: '💧', color: '#4CB4F0', time: '09:00' },
    { id: 'walk', icon: '🚶', color: '#3DBE7A', time: '18:00' },
    { id: 'move', icon: '💪', color: '#FF9F43', time: '07:00' },
    { id: 'sleep', icon: '🛏️', color: '#7B6CF6', time: '22:30' },
  ],
  mind: [
    { id: 'read', icon: '📚', color: '#7B6CF6', time: '21:00' },
    { id: 'meditate', icon: '🧘', color: '#2FBFB0', time: '07:00' },
    { id: 'journal', icon: '📝', color: '#F5B92E', time: '21:30' },
    { id: 'noPhone', icon: '📵', color: '#F2667A', time: '22:00' },
  ],
  relationships: [
    { id: 'call', icon: '📞', color: '#EF7BC0', time: '19:00' },
    { id: 'gratitude', icon: '❤️', color: '#F2667A', time: '21:00' },
    { id: 'present', icon: '👫', color: '#FF9F43' },
    { id: 'message', icon: '💬', color: '#4CB4F0', time: '12:00' },
  ],
  work: [
    { id: 'deepWork', icon: '💻', color: '#4CB4F0', time: '09:00' },
    { id: 'planDay', icon: '🎯', color: '#F5B92E', time: '08:30' },
    { id: 'inbox', icon: '📥', color: '#7B6CF6', time: '17:30' },
    { id: 'tidy', icon: '🧹', color: '#3DBE7A', time: '18:00' },
  ],
  growth: [
    { id: 'study', icon: '🎓', color: '#7B6CF6', time: '20:00' },
    { id: 'language', icon: '🗣️', color: '#FF9F43', time: '19:00' },
    { id: 'practice', icon: '🎸', color: '#EF7BC0', time: '19:30' },
    { id: 'save', icon: '💰', color: '#3DBE7A', time: '10:00' },
  ],
};

/** What makes it hard → which mechanism from the book answers it. */
export const OBSTACLES = ['forget', 'noTime', 'motivation'] as const;
export type Obstacle = (typeof OBSTACLES)[number];
