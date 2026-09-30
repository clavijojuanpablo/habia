// @ts-check
import { defineConfig } from 'astro/config';

// Static marketing site for habia.app. It imports the app's legal texts from
// ../src so the website and the app can never disagree about privacy.
export default defineConfig({
  site: 'https://habia.app',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    // Pin this tsconfig: otherwise Vite walks up to the app's, which extends Expo's
    // config — and Vercel installs only web/'s dependencies, so the build breaks.
    tsconfig: './tsconfig.json',
    server: { fs: { allow: ['..'] } },
  },
});
