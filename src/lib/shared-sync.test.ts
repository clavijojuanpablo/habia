// eslint-disable-next-line @typescript-eslint/no-require-imports
const { stale } = require('../../scripts/sync-shared.js') as { stale: () => string[] };

describe('supabase/functions/_shared', () => {
  it('matches the app sources (run `node scripts/sync-shared.js` after editing them)', () => {
    expect(stale()).toEqual([]);
  });
});
