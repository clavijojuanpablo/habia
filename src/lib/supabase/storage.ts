import 'expo-sqlite/localStorage/install';

/** Persists the auth session across launches (SQLite-backed localStorage). */
export const authStorage = localStorage;
