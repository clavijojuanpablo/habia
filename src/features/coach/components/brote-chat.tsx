import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';

import { useBroteChat, useSendToBrote, type ChatError } from '../chat-api';

const SUGGESTIONS = ['why', 'start', 'stack'] as const;
/** Below this many messages left today, the count shows (above it, it is just noise). */
const SHOW_REMAINING_AT = 5;

/**
 * Chat with Brote: bubbles, three suggestions to start, and a single input. Brote answers with
 * the person's own data (computed on the server). First use asks for the AI consent in one tap.
 */
export function BroteChat() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const chat = useBroteChat();
  const send = useSendToBrote();
  const [draft, setDraft] = useState('');
  const scroll = useRef<ScrollView>(null);
  const messages = chat.data ?? [];
  const remaining = send.data?.remaining ?? null;
  const errorCode = send.error ? (send.error.message as ChatError) : null;

  const ask = (text: string) => {
    const message = text.trim();
    if (!message || send.isPending) return;
    setDraft('');
    send.mutate(message, { onError: () => setDraft(message) });
  };

  if (profile && !profile.ai_coach_enabled) {
    return (
      <View style={styles.consent}>
        <Brote mood="cheer" size={120} />
        <ThemedText type="subtitle" style={styles.center}>
          {t('chat.consentTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {t('chat.consentBody')}
        </ThemedText>
        <Button
          label={t('chat.consentOk')}
          loading={updateProfile.isPending}
          onPress={() => {
            track('ai_review_enabled', { from: 'chat' });
            updateProfile.mutate({ ai_coach_enabled: true });
          }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled">
        {chat.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <Brote mood="happy" size={110} />
            <ThemedText type="heading" style={styles.center}>
              {t('chat.hello')}
            </ThemedText>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => ask(t(`chat.suggestions.${key}`))}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.suggestion,
                    { backgroundColor: theme.lavenderSoft, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <ThemedText type="smallBold">{t(`chat.suggestions.${key}`)}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) =>
            m.role === 'user' ? (
              <View key={m.id} style={[styles.bubble, styles.mine, { backgroundColor: theme.primarySoft }]}>
                <ThemedText>{m.content}</ThemedText>
              </View>
            ) : (
              <View key={m.id} style={styles.broteRow}>
                <Brote mood="happy" size={32} animated={false} />
                <View style={[styles.bubble, styles.theirs, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText>{m.content}</ThemedText>
                </View>
              </View>
            ),
          )
        )}
        {send.isPending && (
          <View style={styles.broteRow}>
            <Brote mood="happy" size={32} />
            <View style={[styles.bubble, styles.theirs, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText themeColor="textSecondary">{t('chat.thinking')}</ThemedText>
            </View>
          </View>
        )}
        {errorCode && (
          <ThemedText type="small" themeColor="danger" style={styles.center}>
            {t(`chat.errors.${errorCode}`)}
          </ThemedText>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.inputBar, { borderTopColor: theme.border }]}>
        {remaining !== null && remaining <= SHOW_REMAINING_AT && (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
            {t('chat.remaining', { count: remaining })}
          </ThemedText>
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={theme.textSecondary}
            maxLength={500}
            multiline
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          />
          <Pressable
            onPress={() => ask(draft)}
            disabled={!draft.trim() || send.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('chat.send')}
            style={[styles.send, { backgroundColor: theme.primary, opacity: !draft.trim() || send.isPending ? 0.4 : 1 }]}>
            <ThemedText style={[styles.sendIcon, { color: theme.onPrimary }]}>↑</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  consent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  suggestions: { gap: Spacing.two, alignSelf: 'stretch' },
  suggestion: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, borderRadius: Radius.lg },
  broteRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, maxWidth: '88%' },
  bubble: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Radius.lg, boxShadow: Shadow.card },
  mine: { alignSelf: 'flex-end', maxWidth: '82%', borderBottomRightRadius: Radius.sm / 2 },
  theirs: { flexShrink: 1, borderBottomLeftRadius: Radius.sm / 2 },
  inputBar: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 22, lineHeight: 26, fontFamily: FontFamily.black },
});
