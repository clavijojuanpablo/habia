import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { showNotice } from '@/lib/confirm';
import {
  getProPlans,
  manageSubscription,
  purchasePlan,
  purchasesAvailable,
  restorePurchases,
  type ProPlan,
} from '@/lib/purchases';

import { PRO_LIMITS_ENABLED } from '../limits';
import { usePro } from '../use-pro';

const BENEFITS = ['habits', 'stats', 'review', 'more'] as const;
const BENEFIT_ICONS: Record<(typeof BENEFITS)[number], string> = { habits: '♾️', stats: '📊', review: '✨', more: '🌱' };

/** How much the annual plan saves against twelve months, as a whole percent (null if it doesn't). */
function annualSaving(plans: ProPlan[]) {
  const annual = plans.find((p) => p.kind === 'annual')?.pkg.product.price;
  const monthly = plans.find((p) => p.kind === 'monthly')?.pkg.product.price;
  if (!annual || !monthly) return null;
  const saving = Math.round((1 - annual / (monthly * 12)) * 100);
  return saving > 0 ? saving : null;
}

/**
 * habia Pro: what it brings, the two plans as the store prices them, and Apple's required terms
 * (price and period, trial, auto-renewal, how to cancel, legal links, restore purchases).
 */
export function Paywall({ source }: { source: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { isPro } = usePro();
  const plans = useQuery({
    queryKey: ['pro-plans'],
    enabled: purchasesAvailable && !isPro,
    // Store objects with live prices: fetched fresh, never written to disk.
    meta: { persist: false },
    staleTime: 5 * 60 * 1000,
    queryFn: getProPlans,
  });
  const [selected, setSelected] = useState<ProPlan['kind']>('annual');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => track('paywall_viewed', { source }), [source]);

  const plan = plans.data?.find((p) => p.kind === selected) ?? plans.data?.[0];
  const saving = plans.data ? annualSaving(plans.data) : null;
  const refreshEntitlement = () => queryClient.invalidateQueries({ queryKey: ['entitlement'] });

  const buy = async () => {
    if (!plan) return;
    setBusy('buy');
    try {
      const result = await purchasePlan(plan);
      if (result === 'pro') track('pro_purchased', { plan: plan.kind, trial: plan.trialDays !== null });
      if (result === 'pending') showNotice(t('paywall.pending'));
      refreshEntitlement();
    } catch {
      showNotice(t('paywall.failed'));
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const restored = await restorePurchases();
      if (restored) track('pro_restored');
      else showNotice(t('paywall.nothingToRestore'));
      refreshEntitlement();
    } catch {
      showNotice(t('paywall.failed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: theme.lavenderSoft }]}>
        <Brote mood={isPro ? 'celebrate' : 'happy'} size={96} />
        <ThemedText type="title" style={styles.center}>
          {isPro ? t('paywall.proTitle') : t('paywall.title')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {isPro ? t('paywall.proThanks') : t('paywall.subtitle')}
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="heading">{t('paywall.benefitsTitle')}</ThemedText>
        {BENEFITS.map((key) => (
          <View key={key} style={styles.benefit}>
            <ThemedText style={styles.benefitIcon}>{BENEFIT_ICONS[key]}</ThemedText>
            <ThemedText style={styles.flex}>{t(`paywall.benefits.${key}`)}</ThemedText>
          </View>
        ))}
        {/* Honest while everything is free: paying today is support, not unlocking. */}
        {!PRO_LIMITS_ENABLED && (
          <ThemedText type="small" style={[styles.note, { backgroundColor: theme.lavenderSoft }]}>
            {t('paywall.earlyNote')}
          </ThemedText>
        )}
      </View>

      {isPro ? (
        purchasesAvailable && (
          <Button
            label={t('paywall.manage')}
            variant="secondary"
            onPress={() => manageSubscription().catch(() => showNotice(t('paywall.manageFailed')))}
          />
        )
      ) : !purchasesAvailable ? (
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {t('paywall.unavailable')}
        </ThemedText>
      ) : plans.isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : !plan ? (
        <View style={styles.gap}>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {t('paywall.loadFailed')}
          </ThemedText>
          <Button label={t('common.retry')} variant="secondary" onPress={() => plans.refetch()} />
        </View>
      ) : (
        <>
          <View accessibilityRole="radiogroup" style={styles.gap}>
            {plans.data!.map((p) => (
              <PlanOption
                key={p.kind}
                plan={p}
                selected={p.kind === plan.kind}
                saving={p.kind === 'annual' ? saving : null}
                onPress={() => setSelected(p.kind)}
              />
            ))}
          </View>

          <Button
            label={plan.trialDays ? t('paywall.startTrial', { count: plan.trialDays }) : t('paywall.subscribe')}
            loading={busy === 'buy'}
            disabled={busy !== null}
            onPress={buy}
          />
          <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
            {plan.trialDays
              ? t(`paywall.terms.trial.${plan.kind}`, { count: plan.trialDays, price: plan.price })
              : t(`paywall.terms.${plan.kind}`, { price: plan.price })}{' '}
            {t('paywall.terms.renewal')}
          </ThemedText>
        </>
      )}

      {purchasesAvailable && !isPro && (
        <Button
          label={t('paywall.restore')}
          variant="secondary"
          loading={busy === 'restore'}
          disabled={busy !== null}
          onPress={restore}
        />
      )}
      <View style={styles.links}>
        <ThemedText type="link" onPress={() => router.push('/legal/terms')}>
          {t('legal.terms')}
        </ThemedText>
        <ThemedText type="link" onPress={() => router.push('/legal/privacy')}>
          {t('legal.privacy')}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

function PlanOption({
  plan,
  selected,
  saving,
  onPress,
}: {
  plan: ProPlan;
  selected: boolean;
  saving: number | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const detail =
    plan.kind === 'annual' && plan.pricePerMonth
      ? t('paywall.perMonth', { price: plan.pricePerMonth }) +
        (saving ? ' · ' + t('paywall.save', { percent: saving }) : '')
      : t('paywall.cancelAnytime');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.plan,
        {
          backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      <View style={styles.flex}>
        <ThemedText type="heading">{t(`paywall.plans.${plan.kind}`)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </View>
      <View style={styles.planRight}>
        <ThemedText type="heading">{t(`paywall.price.${plan.kind}`, { price: plan.price })}</ThemedText>
        {plan.trialDays && (
          <ThemedText type="caption" style={[styles.badge, { backgroundColor: theme.goldSoft }]}>
            {t('paywall.trialBadge', { count: plan.trialDays })}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.two },
  center: { textAlign: 'center' },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four, borderRadius: Radius.xl },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three, boxShadow: Shadow.card },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  benefitIcon: { fontSize: 24, lineHeight: 30 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  planRight: { alignItems: 'flex-end', gap: Spacing.one },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.pill, overflow: 'hidden' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.four },
  note: { padding: Spacing.three, borderRadius: Radius.md, overflow: 'hidden' },
});
