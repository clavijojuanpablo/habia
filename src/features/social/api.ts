import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session-provider';
import { track } from '@/lib/analytics';
import { addDays, formatLocalDate } from '@/lib/recurrence';
import { supabase } from '@/lib/supabase/client';

import { CIRCLE_HABIT_WINDOW_DAYS, type CircleHabitDay, type CircleHabitMember } from './circle-habit-streak';
import { SHARED_WINDOW_DAYS, type DayMark } from './shared-days';

/** The numbers a friend sees on your card: the same ones you see in Progress. */
export type SocialStats = {
  streak: number;
  record: number;
  /** Last 30 days, 0–100; null when nothing was due. */
  consistency: number | null;
  seeds: number;
  stage: number;
};

export type SocialProfile = {
  user_id: string;
  username: string;
  display_name: string;
  color: string;
  stats: Partial<SocialStats>;
  stats_updated_at: string | null;
};

export type Friendship = {
  user_id: string;
  username: string;
  display_name: string;
  color: string;
  status: 'pending' | 'accepted';
  incoming: boolean;
  created_at: string;
};

export const CHEER_KINDS = ['clap', 'water', 'fire', 'you_can', 'plant_with_me'] as const;
export type CheerKind = (typeof CHEER_KINDS)[number];
export const CHEER_EMOJI: Record<CheerKind, string> = {
  clap: '👏',
  water: '💧',
  fire: '🔥',
  you_can: '🤝',
  plant_with_me: '🌱',
};

export type Cheer = {
  id: string;
  from_user: string;
  kind: CheerKind;
  created_at: string;
  seen_at: string | null;
  from: Pick<SocialProfile, 'username' | 'display_name' | 'color'> | null;
};

export type Circle = { id: string; name: string; emoji: string; invite_code: string };
export type CircleMember = { circle_id: string; user_id: string; role: 'owner' | 'member' };

/**
 * Errors the server raises on purpose (see the `social` migration), turned into i18n keys.
 * Anything else (offline, timeout) is the generic one.
 */
export type SocialErrorCode =
  | 'not_found'
  | 'no_username'
  | 'too_many_requests'
  | 'too_many_circles'
  | 'circle_full'
  | 'not_a_member'
  | 'taken'
  | 'generic';

export class SocialError extends Error {
  constructor(public code: SocialErrorCode) {
    super(code);
  }
}

const KNOWN: SocialErrorCode[] = [
  'not_found',
  'no_username',
  'too_many_requests',
  'too_many_circles',
  'circle_full',
  'not_a_member',
];

function toSocialError(error: { code?: string; message?: string }): SocialError {
  if (error.code === '23505') return new SocialError('taken');
  return new SocialError(KNOWN.find((code) => error.message?.includes(code)) ?? 'generic');
}

/** Social writes need the server's answer (is the name free? does the code exist?): offline they
 * fail at once instead of being queued, because a queued call could not be replayed after a restart. */
const ONLINE_ONLY = { networkMode: 'always' } as const;

const socialKey = (userId: string | undefined, ...rest: unknown[]) => ['social', userId, ...rest];

function useSocialInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['social'] });
}

// ============ my social profile ============

export function useMySocialProfile() {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'me'),
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_profiles')
        .select('user_id, username, display_name, color, stats, stats_updated_at')
        .eq('user_id', session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as SocialProfile | null) ?? null;
    },
  });
}

export function useCreateSocialProfile() {
  const { session } = useSession();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { username: string; display_name: string; color: string }) => {
      const { error } = await supabase.from('social_profiles').insert({ user_id: session!.user.id, ...input });
      if (error) throw toSocialError(error);
    },
    onSuccess: () => {
      track('social_profile_created');
      return invalidate();
    },
  });
}

/** Publishes the stats snapshot friends see. Silent: a failure just waits for the next change. */
export function usePublishStats() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    ...ONLINE_ONLY,
    retry: 0,
    mutationFn: async (stats: SocialStats) => {
      const { error } = await supabase
        .from('social_profiles')
        .update({ stats, stats_updated_at: new Date().toISOString() })
        .eq('user_id', session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: socialKey(session?.user.id, 'me') }),
  });
}

// ============ friends ============

export function useFriendships() {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'friendships'),
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_friendships');
      if (error) throw error;
      return data as Friendship[];
    },
  });
}

/** Public profiles (with stats) of people the server lets the caller see; the rest are left out. */
export function useSocialProfiles(userIds: string[]) {
  const { session } = useSession();
  const ids = [...userIds].sort();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'profiles', ids),
    enabled: !!session && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_profiles')
        .select('user_id, username, display_name, color, stats, stats_updated_at')
        .in('user_id', ids);
      if (error) throw error;
      return data as SocialProfile[];
    },
  });
}

/** Which days these people planted or rested on purpose (never what), over the shared window. */
export function useSocialDays(userIds: string[], today: Date) {
  const { session } = useSession();
  const ids = [...userIds].sort();
  const since = formatLocalDate(addDays(today, -SHARED_WINDOW_DAYS));
  return useQuery({
    queryKey: socialKey(session?.user.id, 'days', ids, since),
    enabled: !!session && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('social_days', { p_users: ids, p_since: since });
      if (error) throw error;
      return data as DayMark[];
    },
  });
}

export type FriendRequestResult = 'requested' | 'accepted' | 'pending' | 'friends';

export function useSendFriendRequest() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (username: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', { p_username: username });
      if (error) throw toSocialError(error);
      return data as FriendRequestResult;
    },
    onSuccess: (result) => {
      track(result === 'accepted' ? 'friend_added' : 'friend_request_sent');
      return invalidate();
    },
  });
}

export function useAcceptFriend() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('accept_friend_request', { p_user: userId });
      if (error) throw toSocialError(error);
    },
    onSuccess: () => {
      track('friend_added');
      return invalidate();
    },
  });
}

/** Declines, cancels or unfriends: either side may delete the pair's row. */
export function useRemoveFriendship() {
  const { session } = useSession();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (userId: string) => {
      const me = session!.user.id;
      const [a, b] = me < userId ? [me, userId] : [userId, me];
      const { error } = await supabase.from('friendships').delete().eq('user_a', a).eq('user_b', b);
      if (error) throw toSocialError(error);
    },
    onSuccess: invalidate,
  });
}

// ============ safety ============

export function useBlockUser() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('block_user', { p_user: userId });
      if (error) throw toSocialError(error);
    },
    onSuccess: () => {
      track('user_blocked');
      return invalidate();
    },
  });
}

export type ReportReason = 'offensive_name' | 'harassment' | 'spam' | 'other';

export function useReportUser() {
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { reported: string; reason: ReportReason }) => {
      const { error } = await supabase.from('reports').insert(input);
      // Already reported for this reason: it is on file, which is what the user wanted.
      if (error && error.code !== '23505') throw toSocialError(error);
    },
    onSuccess: () => track('user_reported'),
  });
}

// ============ cheers ============

/** Cheers received in the last two weeks, newest first, with the sender's public name. */
export function useCheersInbox() {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'cheers'),
    enabled: !!session,
    queryFn: async (): Promise<Cheer[]> => {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('cheers')
        .select('id, from_user, kind, created_at, seen_at')
        .eq('to_user', session!.user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const senders = [...new Set(data.map((c) => c.from_user))];
      const { data: profiles, error: profilesError } = senders.length
        ? await supabase.from('social_profiles').select('user_id, username, display_name, color').in('user_id', senders)
        : { data: [], error: null };
      if (profilesError) throw profilesError;
      const byId = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));
      // Senders the caller can no longer see (unfriended, blocked) drop out with their cheers.
      return data
        .filter((c) => byId[c.from_user])
        .map((c) => ({ ...c, kind: c.kind as CheerKind, from: byId[c.from_user] }));
    },
  });
}

/** Today's cheers already sent to one person (the server allows one of each per local day). */
export function useSentCheersToday(toUser: string, today: Date) {
  const { session } = useSession();
  const day = formatLocalDate(today);
  return useQuery({
    queryKey: socialKey(session?.user.id, 'cheers-sent', toUser, day),
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cheers')
        .select('kind')
        .eq('from_user', session!.user.id)
        .eq('to_user', toUser)
        .eq('day', day);
      if (error) throw error;
      return data.map((c) => c.kind as CheerKind);
    },
  });
}

export function useSendCheer() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { to_user: string; kind: CheerKind }) => {
      const { error } = await supabase.from('cheers').insert(input);
      // Already sent this one today: the cheer is there, which is what the user wanted.
      if (error && error.code !== '23505') throw toSocialError(error);
    },
    onSuccess: (_, input) => {
      track('cheer_sent', { kind: input.kind });
      return invalidate();
    },
  });
}

export function useMarkCheersSeen() {
  const { session } = useSession();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    retry: 0,
    mutationFn: async () => {
      const { error } = await supabase
        .from('cheers')
        .update({ seen_at: new Date().toISOString() })
        .eq('to_user', session!.user.id)
        .is('seen_at', null);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

// ============ circles ============

export function useCircles(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'circles'),
    enabled: enabled && !!session,
    queryFn: async () => {
      const [circles, members] = await Promise.all([
        supabase.from('circles').select('id, name, emoji, invite_code').order('created_at'),
        supabase.from('circle_members').select('circle_id, user_id, role'),
      ]);
      if (circles.error) throw circles.error;
      if (members.error) throw members.error;
      return { circles: circles.data as Circle[], members: members.data as CircleMember[] };
    },
  });
}

export function useCreateCircle() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { name: string; emoji: string }) => {
      const { data, error } = await supabase.rpc('create_circle', { p_name: input.name, p_emoji: input.emoji });
      if (error) throw toSocialError(error);
      return data as string;
    },
    onSuccess: () => {
      track('circle_created');
      return invalidate();
    },
  });
}

export function useJoinCircle() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_circle', { p_code: code });
      if (error) throw toSocialError(error);
      return data as string;
    },
    onSuccess: () => {
      track('circle_joined');
      return invalidate();
    },
  });
}

/** Leave a circle yourself, or (as its owner) remove someone from it. */
export function useRemoveCircleMember() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { circleId: string; userId: string }) => {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', input.circleId)
        .eq('user_id', input.userId);
      if (error) throw toSocialError(error);
    },
    onSuccess: invalidate,
  });
}

export function useRegenerateCircleCode() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (circleId: string) => {
      const { error } = await supabase.rpc('regenerate_circle_code', { p_circle: circleId });
      if (error) throw toSocialError(error);
    },
    onSuccess: invalidate,
  });
}

// ============ shared circle habits ============

export type CircleHabit = {
  id: string;
  circle_id: string;
  name: string;
  icon: string;
  rrule: string;
  two_minute_version: string | null;
};

/** Every active shared habit in the caller's circles (RLS only returns circles they belong to). */
export function useCircleHabits(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'circle-habits'),
    enabled: enabled && !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('circle_habits')
        .select('id, circle_id, name, icon, rrule, two_minute_version')
        .is('archived_at', null)
        .order('created_at');
      if (error) throw error;
      return data as CircleHabit[];
    },
  });
}

/** Who takes part in a shared habit and their days on it (never any other habit). */
export function useCircleHabitProgress(circleHabitId: string, today: Date) {
  const { session } = useSession();
  const since = formatLocalDate(addDays(today, -CIRCLE_HABIT_WINDOW_DAYS));
  return useQuery({
    // No date in the key: a new key every day would keep a year of days per copy in the persisted cache.
    queryKey: socialKey(session?.user.id, 'circle-habit', circleHabitId),
    enabled: !!session,
    queryFn: async () => {
      const members = await supabase.rpc('circle_habit_members', { p_circle_habit: circleHabitId });
      if (members.error) throw members.error;
      // A year × 8 people can pass the API's 1000-row cap: page (the function orders by person, day).
      const days: CircleHabitDay[] = [];
      for (let page = 0; ; page++) {
        const { data, error } = await supabase
          .rpc('circle_habit_days', { p_circle_habit: circleHabitId, p_since: since })
          .range(page * 1000, page * 1000 + 999);
        if (error) throw error;
        days.push(...(data as CircleHabitDay[]));
        if (data.length < 1000) break;
      }
      return { members: members.data as CircleHabitMember[], days };
    },
  });
}

export function useCreateCircleHabit() {
  const { session } = useSession();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: Omit<CircleHabit, 'id'>) => {
      const { data, error } = await supabase
        .from('circle_habits')
        .insert({ ...input, created_by: session!.user.id })
        .select('id')
        .single();
      // A circle already has its habit (one per circle): not a username clash.
      if (error) throw error.code === '23505' ? new SocialError('generic') : toSocialError(error);
      return data.id;
    },
    onSuccess: () => {
      track('circle_habit_created');
      return invalidate();
    },
  });
}

/** Joining adds a normal habit to your Today, linked to the shared one; time and reminder stay yours. */
export function useJoinCircleHabit() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (habit: CircleHabit) => {
      const { error } = await supabase.from('habits').insert({
        user_id: session!.user.id,
        name: habit.name,
        icon: habit.icon,
        rrule: habit.rrule,
        two_minute_version: habit.two_minute_version,
        circle_habit_id: habit.id,
        // Local date: the DB default (current_date) is UTC and can be off by a day.
        starts_on: formatLocalDate(new Date()),
      });
      if (error) throw toSocialError(error);
    },
    onSuccess: () => {
      track('circle_habit_joined');
      return Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['habits'] })]);
    },
  });
}

/** The owner ends the circle's habit: every member keeps theirs, unlinked (a trigger does it). */
export function useEndCircleHabit() {
  const queryClient = useQueryClient();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (circleHabitId: string) => {
      const { error } = await supabase
        .from('circle_habits')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', circleHabitId);
      if (error) throw toSocialError(error);
    },
    onSuccess: () => Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['habits'] })]),
  });
}
