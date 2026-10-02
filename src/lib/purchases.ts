import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

// RevenueCat's public SDK key ("appl_…"): safe in the app, it only identifies the project.
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
/** The entitlement RevenueCat grants with any Pro plan (same id in its dashboard). */
const PRO_ENTITLEMENT = 'pro';

/** Whether this build can sell subscriptions (iOS with a key; Android and the web come later). */
export const purchasesAvailable = !!IOS_KEY && Platform.OS === 'ios';

let configured = false;
let markReady: () => void = () => {};
// Screens may ask before the root layout configured the SDK (child effects run first): they wait.
const ready = new Promise<void>((resolve) => (markReady = resolve));

/**
 * Ties purchases to the signed-in account, so Pro follows the person across devices. Waits for the
 * session to resolve (configuring early would create an anonymous RevenueCat user for nothing),
 * logs in on account changes and out on sign out. Without a key (development, Android for now) it
 * does nothing.
 */
export function usePurchasesIdentity(userId: string | undefined, sessionLoading: boolean) {
  useEffect(() => {
    if (!purchasesAvailable || sessionLoading) return;
    if (!configured) {
      Purchases.configure({ apiKey: IOS_KEY!, appUserID: userId ?? null });
      configured = true;
      markReady();
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

const isPro = (info: CustomerInfo) => info.entitlements.active[PRO_ENTITLEMENT] !== undefined;

/** Calls back with "is Pro" now and on every change (purchase, renewal, expiry). Returns the unsubscribe. */
export function onProChange(callback: (pro: boolean) => void): () => void {
  if (!purchasesAvailable) return () => {};
  let active = true;
  const listener = (info: CustomerInfo) => active && callback(isPro(info));
  ready.then(() => {
    if (!active) return;
    Purchases.getCustomerInfo().then(listener, () => {});
    Purchases.addCustomerInfoUpdateListener(listener);
  });
  return () => {
    active = false;
    if (configured) Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

export type ProPlan = {
  kind: 'annual' | 'monthly';
  pkg: PurchasesPackage;
  /** Localized by the store, in the person's currency: "US$34.99", "COP 149.900". */
  price: string;
  pricePerMonth: string | null;
  /** Free days only when this person can still get them (Apple gives one trial per subscription group). */
  trialDays: number | null;
};

const trialDaysOf = (product: PurchasesStoreProduct) => {
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const perUnit = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }[intro.periodUnit] ?? 0;
  return perUnit * intro.periodNumberOfUnits * intro.cycles || null;
};

/** The current offering's annual and monthly plans, as the store prices them for this person. */
export async function getProPlans(): Promise<ProPlan[]> {
  await ready;
  const offering = (await Purchases.getOfferings()).current;
  const packages = [
    ['annual', offering?.annual],
    ['monthly', offering?.monthly],
  ] as const;
  const ids = packages.flatMap(([, pkg]) => (pkg ? [pkg.product.identifier] : []));
  // Unknown eligibility counts as "no trial": promising a trial Apple then refuses is misleading.
  const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids).catch(() => ({}));
  return packages.flatMap(([kind, pkg]) => {
    if (!pkg) return [];
    const eligible =
      (eligibility as Record<string, { status: number }>)[pkg.product.identifier]?.status ===
      Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
    return [
      {
        kind,
        pkg,
        price: pkg.product.priceString,
        pricePerMonth: pkg.product.pricePerMonthString,
        trialDays: eligible ? trialDaysOf(pkg.product) : null,
      },
    ];
  });
}

/** Opens Apple's purchase sheet. `pending`: waiting on the store (e.g. Ask to Buy). */
export async function purchasePlan(plan: ProPlan): Promise<'pro' | 'cancelled' | 'pending'> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return isPro(customerInfo) ? 'pro' : 'pending';
  } catch (error) {
    const code = (error as PurchasesError).code;
    if (code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    if (code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    throw error;
  }
}

/** "Restore purchases" (Apple requires it): true when a Pro subscription came back. */
export async function restorePurchases(): Promise<boolean> {
  await ready;
  return isPro(await Purchases.restorePurchases());
}

/** Apple's own screen to change plan or cancel. */
export async function manageSubscription() {
  // Pro may come from the server mirror before the SDK is configured.
  await ready;
  await Purchases.showManageSubscriptions();
}
