// Expo's default Metro config, plus debug IDs so Sentry can map crash reports
// from the minified bundle back to our TypeScript sources.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
