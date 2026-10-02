import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase/client';

const BUCKET = 'circle-photos';
const MAX_WIDTH = 1080;
const PENDING_KEY = 'habia.pendingPhotos';

/** What an upload needs; kept on the phone until it reaches the server. */
export type PendingPhoto = {
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

export const photoPath = (p: Pick<PendingPhoto, 'circleId' | 'circleHabitId' | 'userId' | 'day'>) =>
  `${p.circleId}/${p.circleHabitId}/${p.userId}/${p.day}.jpg`;

function toBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Uploads the file, then records it (replacing that day's photo if there was one). */
export async function uploadHabitPhoto(photo: PendingPhoto): Promise<void> {
  const path = photoPath(photo);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, toBytes(photo.base64), { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;
  const { error } = await supabase.from('circle_habit_photos').upsert(
    {
      circle_habit_id: photo.circleHabitId,
      user_id: photo.userId,
      day: photo.day,
      path,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'circle_habit_id,user_id,day' },
  );
  if (error) throw error;
}

// ---- the queue: a photo taken offline (or whose upload failed) waits on the phone ----

function readQueue(): PendingPhoto[] {
  try {
    return JSON.parse(storage.getItem(PENDING_KEY) ?? '[]') as PendingPhoto[];
  } catch {
    return [];
  }
}

const writeQueue = (queue: PendingPhoto[]) => storage.setItem(PENDING_KEY, JSON.stringify(queue));
const sameSlot = (a: PendingPhoto, b: PendingPhoto) =>
  a.circleHabitId === b.circleHabitId && a.userId === b.userId && a.day === b.day;

/** Queues the photo (a newer one for the same day replaces it) and tries to send everything. */
export async function enqueueHabitPhoto(photo: PendingPhoto): Promise<boolean> {
  writeQueue([...readQueue().filter((p) => !sameSlot(p, photo)), photo]);
  return flushHabitPhotos();
}

let flushing: Promise<boolean> | null = null;

/** Sends queued photos one by one; whatever fails stays for the next try. True when all went. */
export function flushHabitPhotos(): Promise<boolean> {
  flushing ??= (async () => {
    try {
      for (const photo of readQueue()) {
        try {
          await uploadHabitPhoto(photo);
          writeQueue(readQueue().filter((p) => !sameSlot(p, photo)));
        } catch {
          // Offline or a server hiccup: keep it.
        }
      }
      return readQueue().length === 0;
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

export const hasPendingPhotos = () => readQueue().length > 0;
