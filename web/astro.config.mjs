// @ts-check
import { defineConfig } from 'astro/config';

// Static marketing site for habia.app. It imports the app's legal texts from
// ../src so the website and the app can never disagree about privacy.
export default defineConfig({
  site: 'https://habia.app',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    server: { fs: { allow: ['..'] } },
  },
});
