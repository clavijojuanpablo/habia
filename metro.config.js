// Expo's default Metro config, plus debug IDs so Sentry can map crash reports
// from the minified bundle back to our TypeScript sources.
const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// The marketing site (web/, Astro) has its own dependencies: keep Metro out of it.
// Anchored to this folder so a `web` directory inside node_modules is untouched.
const webDir = path.resolve(__dirname, 'web').replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&');
config.resolver.blockList = [config.resolver.blockList, new RegExp(`^${webDir}[\\\\/]`)].flat().filter(Boolean);

module.exports = config;
