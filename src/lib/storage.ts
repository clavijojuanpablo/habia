import 'expo-sqlite/localStorage/install';

/**
 * Key-value storage that survives app launches. On native it is SQLite-backed
 * (installed as a `localStorage` global by expo-sqlite); see `storage.web.ts`
 * for the browser version.
 */
export const storage = localStorage;
