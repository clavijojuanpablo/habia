import type { ProPlan } from './purchases';

// In-app purchases are an App Store / Play Store matter; the web will use Stripe (later).
export const purchasesAvailable = false;

export function usePurchasesIdentity(_userId: string | undefined, _sessionLoading: boolean) {}

export const onProChange = (_callback: (pro: boolean) => void) => () => {};

export type { ProPlan } from './purchases';

export const getProPlans = async (): Promise<ProPlan[]> => [];
export const purchasePlan = async (_plan: ProPlan): Promise<'pro' | 'cancelled' | 'pending'> => 'cancelled';
export const restorePurchases = async () => false;
export const manageSubscription = async () => {};
