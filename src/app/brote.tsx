import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBroteChat, useClearChat } from '@/features/coach/chat-api';
import { BroteChat } from '@/features/coach/components/brote-chat';
import { confirmAction } from '@/lib/confirm';

/** Chat with Brote (opened from the Garden). The header offers to delete the conversation. */
export default function BroteScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const chat = useBroteChat();
  const clear = useClearChat();
  const hasMessages = (chat.data ?? []).length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: hasMessages
        ? () => (
            <Pressable
              onPress={() =>
                confirmAction(t('chat.clearConfirm'), () => clear.mutate(), { ok: t('chat.clear'), cancel: t('common.cancel') })
              }
              accessibilityRole="button"
              hitSlop={8}>
              <ThemedText type="link">{t('chat.clear')}</ThemedText>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, hasMessages, clear, t]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <BroteChat />
    </ThemedView>
  );
}
