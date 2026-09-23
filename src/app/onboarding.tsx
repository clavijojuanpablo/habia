import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { IDENTITY_AREAS, type IdentityArea } from '@/features/identities/api';
import { Brote } from '@/features/mascot/brote';
import { useCompleteOnboarding, useSkipOnboarding } from '@/features/onboarding/api';
import { AREA_HABITS, OBSTACLES, type Obstacle, type SuggestedHabit } from '@/features/onboarding/data';
import { ensureNotificationPermission, REMINDERS_SUPPORTED } from '@/features/reminders/notifications';
import { useTheme } from '@/hooks/use-theme';

const STEPS = 5;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const complete = useCompleteOnboarding();
  const skip = useSkipOnboarding();

  const [step, setStep] = useState(0);
  const [area, setArea] = useState<IdentityArea>('health');
  const [statement, setStatement] = useState('');
  const [habit, setHabit] = useState<SuggestedHabit | null>(null);
  const [customName, setCustomName] = useState('');
  const [obstacle, setObstacle] = useState<Obstacle>('forget');

  const suggestions = AREA_HABITS[area];
  const statementValue = statement || t(`onboarding.identitySuggestion.${area}`);
  const habitName = habit ? t(`onboarding.habits.${habit.id}.name`) : customName.trim();
  const canContinue = step !== 2 || habitName.length > 0;

  const finish = async () => {
    if (obstacle === 'forget' && REMINDERS_SUPPORTED) await ensureNotificationPermission();
    const chosen = habit ?? { id: 'custom', icon: '🌱', color: '#3DBE7A' };
    complete.mutate(
      {
        area,
        statement: statementValue,
        habit: {
          name: habitName,
          icon: chosen.icon,
          color: chosen.color,
          time: chosen.time,
          twoMinute: habit ? t(`onboarding.habits.${habit.id}.min`) : t('onboarding.customMin'),
        },
        obstacle,
      },
      { onSuccess: () => router.replace('/') },
    );
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressPill,
                { backgroundColor: i <= step ? theme.primary : theme.backgroundSelected },
              ]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <Step mood="happy" title={t('onboarding.welcomeTitle')} body={t('onboarding.welcomeBody')} />
          )}

          {step === 1 && (
            <Step mood="cheer" title={t('onboarding.identityTitle')} body={t('onboarding.identityBody')}>
              <View style={styles.wrap}>
                {(Object.keys(IDENTITY_AREAS) as IdentityArea[]).map((a) => (
                  <Chip
                    key={a}
                    label={`${IDENTITY_AREAS[a]} ${t(`identity.areas.${a}`)}`}
                    selected={area === a}
                    onPress={() => {
                      setArea(a);
                      setStatement('');
                      setHabit(null);
                    }}
                  />
                ))}
              </View>
              <TextField
                label={t('identity.statement')}
                value={statementValue}
                onChangeText={setStatement}
                maxLength={80}
              />
            </Step>
          )}

          {step === 2 && (
            <Step mood="happy" title={t('onboarding.habitTitle')} body={t('onboarding.habitBody')}>
              {suggestions.map((s) => {
                const selected = habit?.id === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setHabit(s);
                      setCustomName('');
                    }}
                    style={[
                      styles.habitCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: selected ? s.color : 'transparent',
                      },
                    ]}>
                    <View style={[styles.habitIcon, { backgroundColor: s.color + '26' }]}>
                      <ThemedText style={styles.habitEmoji}>{s.icon}</ThemedText>
                    </View>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{t(`onboarding.habits.${s.id}.name`)}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {t('onboarding.startWith', { min: t(`onboarding.habits.${s.id}.min`) })}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
              <TextField
                label={t('onboarding.customHabit')}
                placeholder={t('habit.namePlaceholder')}
                value={customName}
                onChangeText={(value) => {
                  setCustomName(value);
                  setHabit(null);
                }}
              />
            </Step>
          )}

          {step === 3 && (
            <Step mood="cheer" title={t('onboarding.obstacleTitle')} body={t('onboarding.obstacleBody')}>
              {OBSTACLES.map((o) => (
                <Pressable
                  key={o}
                  onPress={() => setObstacle(o)}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: obstacle === o ? theme.primary : 'transparent',
                    },
                  ]}>
                  <View style={styles.flex}>
                    <ThemedText type="smallBold">{t(`onboarding.obstacles.${o}.label`)}</ThemedText>
                    {obstacle === o && (
                      <ThemedText type="caption" themeColor="textSecondary">
                        {t(`onboarding.obstacles.${o}.tip`)}
                      </ThemedText>
                    )}
                  </View>
                </Pressable>
              ))}
            </Step>
          )}

          {step === 4 && (
            <Step mood="celebrate" title={t('onboarding.readyTitle')} body={t('onboarding.readyBody')}>
              <View style={[styles.summary, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="smallBold">{statementValue}</ThemedText>
                <ThemedText type="small">
                  {habit?.icon ?? '🌱'} {habitName}
                  {habit?.time ? ` · ${habit.time}` : ''}
                </ThemedText>
              </View>
              {obstacle === 'forget' && REMINDERS_SUPPORTED && (
                <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
                  {t('onboarding.permissionHint')}
                </ThemedText>
              )}
            </Step>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={step === STEPS - 1 ? t('onboarding.start') : t('onboarding.next')}
            loading={complete.isPending}
            disabled={!canContinue}
            onPress={() => (step === STEPS - 1 ? finish() : setStep(step + 1))}
          />
          <Pressable onPress={() => (step === 0 ? skip.mutate() : setStep(step - 1))} hitSlop={8}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {step === 0 ? t('onboarding.skip') : t('onboarding.back')}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function Step({
  mood,
  title,
  body,
  children,
}: {
  mood: 'happy' | 'cheer' | 'celebrate';
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <View style={styles.mascot}>
        <Brote mood={mood} size={140} />
      </View>
      <ThemedText type="subtitle" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        {body}
      </ThemedText>
      {children}
    </>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? theme.primary : theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  progressRow: { flexDirection: 'row', gap: Spacing.one, padding: Spacing.three },
  progressPill: { flex: 1, height: 6, borderRadius: 3 },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  mascot: { alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center' },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.pill },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 2,
    boxShadow: Shadow.card,
  },
  habitIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 24, lineHeight: 30 },
  summary: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.one, alignItems: 'center' },
  footer: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
