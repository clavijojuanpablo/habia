import { inviteRoute } from './invite-route';

describe('inviteRoute', () => {
  it('recognizes friend and circle invites from both link shapes', () => {
    expect(inviteRoute('habia://add/ana_g')).toBe('/add/ana_g');
    expect(inviteRoute('https://habia.app/join/AB12CD34')).toBe('/join/AB12CD34');
  });

  it('ignores every other link', () => {
    expect(inviteRoute('https://habia.app/auth-callback?token_hash=x')).toBeNull();
    expect(inviteRoute('habia://join/short')).toBeNull();
    expect(inviteRoute('habia://profile')).toBeNull();
  });
});
