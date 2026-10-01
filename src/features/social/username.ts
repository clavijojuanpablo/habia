/** Mirrors the database check on social_profiles.username. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** What people type ("@Ana.Gómez ") → what is stored and searched ("anagomez"). */
export function normalizeUsername(input: string): string {
  return input
    .trim()
    .replace(/^@/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

export const isValidUsername = (username: string) => USERNAME_PATTERN.test(username);

/** A first suggestion from the display name, padded when the name is too short. */
export function suggestUsername(displayName: string): string {
  const base = normalizeUsername(displayName.replace(/\s+/g, '_'));
  return base.length >= 3 ? base : `${base}_habia`;
}
