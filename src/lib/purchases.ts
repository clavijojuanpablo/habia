import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// RevenueCat's public SDK key ("appl_…"): safe in the app, it only identifies the project.
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
let configured = false;

/**
 * Ties purchases to the signed-in account, so Pro follows the person across devices. Waits for the
 * session to resolve (configuring early would create an anonymous RevenueCat user for nothing),
 * logs in on account changes and out on sign out. Without a key (development, Android for now) it
 * does nothing; the paywall comes later.
 */
export function usePurchasesIdentity(userId: string | undefined, sessionLoading: boolean) {
  useEffect(() => {
    if (!IOS_KEY || Platform.OS !== 'ios' || sessionLoading) return;
    if (!configured) {
      Purchases.configure({ apiKey: IOS_KEY, appUserID: userId ?? null });
      configured = true;
      return;
    }
    if (userId) {
      Purchases.logIn(userId).catch(() => {});
    } else {
      // Fails when the current user is already anonymous; nothing to undo then.
      Purchases.logOut().catch(() => {});
    }
  }, [userId, sessionLoading]);
}
