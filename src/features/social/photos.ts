import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase/client';

const BUCKET = 'circle-photos';
const MAX_WIDTH = 1080;
const PENDING_KEY = 'habia.pendingPhotos';

/** What an upload needs; kept on the phone until it reaches the server. */
export type PendingPhoto = {
  /** Unique per photo taken: a newer photo of the same day never gets dropped as the older one. */
  id: string;
  circleId: string;
  circleHabitId: string;
  userId: string;
  /** The user's local day, YYYY-MM-DD: one photo per person, shared habit and day. */
  day: string;
  base64: string;
};

/**
 * Takes the habit's photo with the camera only (no gallery: a photo of today, not an old one),
 * resized to 1080 px wide and compressed to a small JPEG (base64). `denied` when the camera is not
 * allowed, so the screen can explain how to allow it instead of doing nothing.
 */
export async function takeHabitPhoto(): Promise<{ status: 'ok'; base64: string } | { status: 'canceled' | 'denied' }> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return { status: 'canceled' };
  const context = ImageManipulator.manipulate(result.assets[0].uri);
  if ((result.assets[0].width ?? 0) > MAX_WIDTH) context.resize({ width: MAX_WIDTH, height: null });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  return saved.base64 ? { status: 'ok', base64: saved.base64 } : { status: 'canceled' };
}

/** Same shape the server builds in save_circle_photo: <circle>/<circle habit>/<author>/<day>.jpg. */
const photoPath = (p: Pick<PendingPhoto, 'circleId' | 'circleHabitId' | 'userId' | 'day'>) =>
  `${p.circleId}/${p.circleHabitId}/${p.userId}/${p.day}.jpg`;

function toBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** A failure that no retry will fix (left the habit, photo hidden, refused by the rules). */
class PermanentPhotoError extends Error {}

type ApiError = { status?: number; statusCode?: string | number; code?: string };
const isPermanent = (error: ApiError) => {
  const status = Number(error.status ?? error.statusCode);
  // 401 is an expired session about to refresh, 408/429 a slow or busy server: worth retrying.
  return (status >= 400 && status < 500 && ![401, 408, 429].includes(status)) || error.code === 'P0001' || error.code === '42501';
};

/** Uploads the file into the author's folder, then lets the server record it. */
async function uploadHabitPhoto(photo: PendingPhoto): Promise<void> {
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(photoPath(photo), toBytes(photo.base64), { contentType: 'image/jpeg', upsert: true });
  if (uploadError) {
    throw isPermanent(uploadError as ApiError) ? new PermanentPhotoError(uploadError.message) : uploadError;
  }
  const { error } = await supabase.rpc('save_circle_photo', { p_circle_habit: photo.circleHabitId, p_day: photo.day });
  if (error) throw isPermanent(error) ? new PermanentPhotoError(error.message) : error;
}

// ---- the queue: a photo taken offline (or whose upload failed) waits on the phone ----

function readQueue(): PendingPhoto[] {
  try {
    return JSON.parse(storage.getItem(PENDING_KEY) ?? '[]') as PendingPhoto[];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingPhoto[]) {
  try {
    storage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    // Storage full (the web's ~5 MB): the photo is lost, the check-in is not.
  }
}

const removeFromQueue = (id: string) => writeQueue(readQueue().filter((p) => p.id !== id));

/**
 * Queues the photo (replacing an older one of the same day) and tries to send it: `sent`, `queued`
 * (waits for the connection) or `failed` (refused, or the phone had no room to keep it).
 */
export async function enqueueHabitPhoto(photo: Omit<PendingPhoto, 'id'>): Promise<'sent' | 'queued' | 'failed'> {
  const entry = { ...photo, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
  const sameDay = (p: PendingPhoto) =>
    p.circleHabitId === entry.circleHabitId && p.userId === entry.userId && p.day === entry.day;
  writeQueue([...readQueue().filter((p) => !sameDay(p)), entry]);
  await flushHabitPhotos(entry.userId);
  if (uploaded.delete(entry.id)) return 'sent';
  return readQueue().some((p) => p.id === entry.id) ? 'queued' : 'failed';
}

let flushing: Promise<void> | null = null;
/** Ids that reached the server, read (and forgotten) by enqueueHabitPhoto. */
const uploaded = new Set<string>();

/**
 * Sends the account's queued photos one by one. A call while a send is running waits for it and
 * then runs again, so a photo queued meanwhile is never skipped. Another account's leftovers
 * (a shared phone) are dropped: they could never upload under this session.
 */
export function flushHabitPhotos(userId: string): Promise<void> {
  const run = async () => {
    writeQueue(readQueue().filter((p) => p.userId === userId));
    for (const photo of readQueue()) {
      try {
        await uploadHabitPhoto(photo);
        removeFromQueue(photo.id);
        uploaded.add(photo.id);
      } catch (error) {
        if (error instanceof PermanentPhotoError) removeFromQueue(photo.id);
        // Otherwise offline or a server hiccup: keep it for the next try.
      }
    }
  };
  const next = (flushing ?? Promise.resolve()).then(run, run);
  flushing = next;
  next.finally(() => {
    if (flushing === next) flushing = null;
  });
  return next;
}

export const hasPendingPhotos = () => readQueue().length > 0;

/** On sign out: queued photos belong to the account that took them. */
export const clearPhotoQueue = () => writeQueue([]);
