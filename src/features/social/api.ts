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
  | 'cheer_too_soon'
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
  'cheer_too_soon',
];

function toSocialError(error: { code?: string; message?: string }): SocialError {
  if (error.code === '23505') return new SocialError('taken');
  return new SocialError(KNOWN.find((code) => error.message?.includes(code)) ?? 'generic');
}

/** Social writes need the server's answer (is the name free? does the code exist?): offline they
 * fail at once instead of being queued, because a queued call could not be replayed after a restart. */
const ONLINE_ONLY = { networkMode: 'always' } as const;

/**
 * Tells the server a social moment happened so it can push it (supabase/functions/notify). Fire and
 * forget: the server checks the event itself, and a lost push never undoes the action.
 */
export function notify(
  body:
    | { type: 'cheer'; cheerId: string }
    | { type: 'friend_request' | 'friend_accepted'; userId?: string; username?: string }
    | { type: 'circle_checkin'; circleHabitId: string }
    | { type: 'photo_doubted'; photoId: string },
) {
  supabase.functions.invoke('notify', { body }).catch(() => {});
}

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
    onSuccess: (result, username) => {
      track(result === 'accepted' ? 'friend_added' : 'friend_request_sent');
      if (result === 'requested') notify({ type: 'friend_request', username });
      if (result === 'accepted') notify({ type: 'friend_accepted', username });
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
    onSuccess: (_, userId) => {
      track('friend_added');
      notify({ type: 'friend_accepted', userId });
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

export type ReportReason = 'offensive_name' | 'harassment' | 'spam' | 'other' | 'inappropriate_photo';

export function useReportUser() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { reported: string; reason: ReportReason; photo_id?: string }) => {
      const { error } = await supabase.from('reports').insert(input);
      // Already reported (this person for this reason, or this photo): it is on file, which is
      // what the user wanted.
      if (error && error.code !== '23505') throw toSocialError(error);
    },
    onSuccess: (_, input) => {
      track('user_reported');
      // A reported photo is gone for its reporter at once.
      if (input.photo_id) return invalidate();
    },
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

/** One cheer per friend every 3 hours, whatever the kind (enforced by the server too). */
export const CHEER_GAP_MS = 3 * 60 * 60 * 1000;

/** The cheer sent to this person within the last gap, if any: until it passes, no other. */
export function useRecentCheerTo(toUser: string) {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'cheer-recent', toUser),
    enabled: !!session,
    queryFn: async (): Promise<{ kind: CheerKind; created_at: string } | null> => {
      const { data, error } = await supabase
        .from('cheers')
        .select('kind, created_at')
        .eq('from_user', session!.user.id)
        .eq('to_user', toUser)
        .gte('created_at', new Date(Date.now() - CHEER_GAP_MS).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? { kind: data.kind as CheerKind, created_at: data.created_at } : null;
    },
  });
}

export function useSendCheer() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { to_user: string; kind: CheerKind }) => {
      const { data, error } = await supabase.from('cheers').insert(input).select('id').single();
      if (error) throw toSocialError(error);
      notify({ type: 'cheer', cheerId: data.id });
    },
    onSuccess: (_, input) => {
      track('cheer_sent', { kind: input.kind });
      return invalidate();
    },
    // Sent from another device, or the local view was stale: fetch it so the wait shows.
    onError: (error) => {
      if (error instanceof SocialError && error.code === 'cheer_too_soon') return invalidate();
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
  const queryClient = useQueryClient();
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
    // The server unlinks your copy of the shared habit when you leave or are removed.
    onSuccess: () => Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['habits'] })]),
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
  /** The circle asks for a camera photo with each check-in. */
  photo_required: boolean;
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
        .select('id, circle_id, name, icon, rrule, two_minute_version, photo_required')
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

type CircleHabitStart = { name: string; rrule: string; minimum: string; withPhoto: boolean };

const startCircleHabit = async (circleId: string, habit: CircleHabitStart) => {
  const { data, error } = await supabase.rpc('start_circle_habit', {
    p_circle: circleId,
    p_name: habit.name,
    p_rrule: habit.rrule,
    p_two_minute: habit.minimum,
    p_photo: habit.withPhoto,
    // The creator's own copy starts on their local date (the database's current_date is UTC).
    p_today: formatLocalDate(new Date()),
  });
  // A circle already has its habit (one per circle): not a username clash.
  if (error) throw error.code === '23505' ? new SocialError('generic') : toSocialError(error);
  return data;
};

/** The owner sets the circle's habit (when it has none) and is in it right away. */
export function useStartCircleHabit() {
  const queryClient = useQueryClient();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: ({ circleId, ...habit }: CircleHabitStart & { circleId: string }) => startCircleHabit(circleId, habit),
    onSuccess: () => {
      track('circle_habit_created');
      return Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['habits'] })]);
    },
  });
}

/**
 * A new circle is born with its habit, and its creator in it. If the habit step fails, the circle
 * still exists: the screen opens it, where the owner can set the habit again.
 */
export function useCreateCircleWithHabit() {
  const queryClient = useQueryClient();
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (input: { name: string; emoji: string; habit: CircleHabitStart }) => {
      const { data, error } = await supabase.rpc('create_circle', { p_name: input.name, p_emoji: input.emoji });
      if (error) throw toSocialError(error);
      const circleId = data as string;
      track('circle_created');
      try {
        await startCircleHabit(circleId, input.habit);
        track('circle_habit_created');
      } catch {
        // Kept: the circle is there; its screen offers to set the habit.
      }
      return circleId;
    },
    onSuccess: () => Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['habits'] })]),
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

// ============ photos of a shared habit ============

export type CirclePhoto = {
  id: string;
  user_id: string;
  day: string;
  path: string;
  /** Signed URL, valid for an hour (the bucket is private). */
  url: string;
  /** Hidden for everyone but its author after 2+ reports, until reviewed. */
  hidden: boolean;
  /** A majority of the circle doubted it: that day doesn't count for the group. */
  doubted: boolean;
  /** You voted "no cuenta" (votes are private: only your own is known). */
  doubtedByMe: boolean;
};

const PHOTO_URL_SECONDS = 60 * 60;
// Signed URLs by file version (path + time: a retake keeps the path), reused while they have
// 10+ minutes left, so refreshing the list often never re-signs or re-downloads the same photo.
const signedUrls = new Map<string, { url: string; until: number }>();

async function signPhotoUrls(photos: { path: string; created_at: string }[]) {
  const key = (p: { path: string; created_at: string }) => p.path + '@' + p.created_at;
  const now = Date.now();
  const missing = photos.filter((p) => (signedUrls.get(key(p))?.until ?? 0) < now + 10 * 60 * 1000);
  if (missing.length > 0) {
    const { data, error } = await supabase.storage.from('circle-photos').createSignedUrls(
      missing.map((p) => p.path),
      PHOTO_URL_SECONDS,
    );
    if (error) throw error;
    const byPath = Object.fromEntries((data ?? []).map((s) => [s.path, s.signedUrl]));
    for (const p of missing) {
      if (byPath[p.path]) signedUrls.set(key(p), { url: byPath[p.path], until: now + PHOTO_URL_SECONDS * 1000 });
    }
  }
  return (p: { path: string; created_at: string }) => signedUrls.get(key(p))?.url;
}

/** Today's photos of a shared habit, each with a short-lived signed URL. */
export function useCircleHabitPhotos(circleHabitId: string, day: string) {
  const { session } = useSession();
  return useQuery({
    queryKey: socialKey(session?.user.id, 'photos', circleHabitId, day),
    enabled: !!session,
    // URLs expire: kept in memory only (see signPhotoUrls), never written to disk.
    meta: { persist: false },
    queryFn: async (): Promise<CirclePhoto[]> => {
      const { data, error } = await supabase
        .from('circle_habit_photos')
        .select('id, user_id, day, path, created_at, hidden_at')
        .eq('circle_habit_id', circleHabitId)
        .eq('day', day);
      if (error) throw error;
      if (data.length === 0) return [];
      const [urlOf, doubted, mine] = await Promise.all([
        signPhotoUrls(data),
        supabase.from('circle_doubted_days').select('user_id').eq('circle_habit_id', circleHabitId).eq('day', day),
        supabase
          .from('circle_photo_doubts')
          .select('photo_id')
          .in(
            'photo_id',
            data.map((p) => p.id),
          ),
      ]);
      if (doubted.error) throw doubted.error;
      if (mine.error) throw mine.error;
      const doubtedUsers = new Set(doubted.data.map((d) => d.user_id));
      const myDoubts = new Set(mine.data.map((d) => d.photo_id));
      return data.flatMap((p) => {
        const url = urlOf(p);
        if (!url) return [];
        return [
          {
            id: p.id,
            user_id: p.user_id,
            day: p.day,
            path: p.path,
            url,
            hidden: !!p.hidden_at,
            doubted: doubtedUsers.has(p.user_id),
            doubtedByMe: myDoubts.has(p.id),
          },
        ];
      });
    },
  });
}

/** "¿Cuenta?": a private vote that someone else's photo doesn't prove the habit, or taking it back. */
export function useDoubtPhoto() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async ({ photoId, doubt }: { photoId: string; doubt: boolean }) => {
      const { error } = doubt
        ? await supabase.from('circle_photo_doubts').insert({ photo_id: photoId })
        : await supabase.from('circle_photo_doubts').delete().eq('photo_id', photoId);
      // Already voted: the vote is there, which is what the user wanted.
      if (error && error.code !== '23505') throw toSocialError(error);
      // The server tells the author only if this vote made the majority.
      if (doubt) notify({ type: 'photo_doubted', photoId });
    },
    onSuccess: (_, { doubt }) => {
      track(doubt ? 'photo_doubted' : 'photo_doubt_undone');
      return invalidate();
    },
  });
}

/** Removes your own photo of the day (file and row). */
export function useDeleteMyPhoto() {
  const invalidate = useSocialInvalidate();
  return useMutation({
    ...ONLINE_ONLY,
    mutationFn: async (photo: { id: string; path: string }) => {
      await supabase.storage.from('circle-photos').remove([photo.path]);
      const { error } = await supabase.from('circle_habit_photos').delete().eq('id', photo.id);
      if (error) throw toSocialError(error);
    },
    onSuccess: invalidate,
  });
}
