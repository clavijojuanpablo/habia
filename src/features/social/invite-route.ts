/** "/add/ana" or "/join/AB12CD34" from habia://… or https://habia.app/…; null for anything else. */
export function inviteRoute(url: string): string | null {
  const path = url
    .replace(/^https?:\/\/[^/]+/i, '') // https://habia.app/join/X → /join/X
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '') // habia://add/ana → add/ana
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '');
  return /^(add\/[a-z0-9_]{3,20}|join\/[A-Za-z0-9]{8})$/.test(path) ? `/${path}` : null;
}
