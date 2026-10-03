/**
 * The version people see. Patch (1.0.x) = an OTA update; minor or major = a new
 * store binary, and then `version` in app.json moves to the same number.
 * Kept in JS so an OTA update can carry it: app.json is part of the native fingerprint.
 */
export const APP_RELEASE = '1.6.3';
