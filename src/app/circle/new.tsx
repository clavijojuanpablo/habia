import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SocialError, useCreateCircle } from '@/features/social/api';
import { useTheme } from '@/hooks/use-theme';

const EMOJIS = ['🌱', '🏃', '📚', '🧘', '💪', '🏡', '❤️', '🎨', '💼', '🍎'];

export default function NewCircleScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const create = useCreateCircle();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const errorCode = create.error instanceof SocialError ? create.error.code : create.error ? 'generic' : null;

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.circle.newHint')}
        </ThemedText>
        <TextField
          label={t('social.circle.name')}
          placeholder={t('social.circle.namePlaceholder')}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />
        <ThemedText type="smallBold">{t('social.circle.emoji')}</ThemedText>
        <View style={styles.emojis}>
          {EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              accessibilityRole="radio"
              accessibilityState={{ selected: emoji === e }}
              style={[
                styles.emojiTile,
                {
                  backgroundColor: emoji === e ? theme.primarySoft : theme.backgroundElement,
                  borderColor: emoji === e ? theme.primary : 'transparent',
                },
              ]}>
              <ThemedText style={styles.emoji}>{e}</ThemedText>
            </Pressable>
          ))}
        </View>
        {errorCode && (
          <ThemedText type="small" themeColor="danger">
            {t(`social.errors.${errorCode}`)}
          </ThemedText>
        )}
        <Button
          label={t('social.circle.create')}
          disabled={name.trim().length === 0}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { name: name.trim(), emoji },
              { onSuccess: (id) => router.replace({ pathname: '/circle/[id]', params: { id } }) },
            )
          }
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiTile: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26, lineHeight: 32 },
});
