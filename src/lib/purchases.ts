import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// RevenueCat's public SDK key ("appl_…"): safe in the app, it only identifies the project.
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
let configured = false;

/**
 * Ties purchases to the signed-in account, so Pro follows the person across devices. Without a
 * key (development, Android for now) it does nothing; the paywall comes later.
 */
export function usePurchasesIdentity(userId: string | undefined) {
  useEffect(() => {
    if (!IOS_KEY || Platform.OS !== 'ios') return;
    if (!configured) {
      Purchases.configure({ apiKey: IOS_KEY, appUserID: userId ?? null });
      configured = true;
      return;
    }
    if (userId) Purchases.logIn(userId).catch(() => {});
  }, [userId]);
}
