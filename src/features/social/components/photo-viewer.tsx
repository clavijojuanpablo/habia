import { useTranslation } from 'react-i18next';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';

import { useDeleteMyPhoto, useHideCirclePhoto, useReportUser, type CirclePhoto } from '../api';

/**
 * A circle photo, full screen. Your own: take another or delete it. Someone else's: report it,
 * and hide it when you own the circle (moderation stays inside the circle).
 */
export function PhotoViewer({
  photo,
  name,
  mine,
  isOwner,
  onRetake,
  onClose,
}: {
  photo: CirclePhoto | null;
  name: string;
  mine: boolean;
  isOwner: boolean;
  onRetake: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const remove = useDeleteMyPhoto();
  const hide = useHideCirclePhoto();
  const report = useReportUser();

  return (
    <Modal visible={!!photo} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.photoBackdrop }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <ThemedText
              type="heading"
              style={[styles.name, { backgroundColor: theme.backgroundElement }]}
              numberOfLines={1}>
              📸 {name}
            </ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={8}
              style={[styles.close, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="heading">✕</ThemedText>
            </Pressable>
          </View>

          {photo && (
            <Image
              source={{ uri: photo.url }}
              resizeMode="contain"
              style={styles.image}
              accessibilityLabel={t('photos.of', { name })}
            />
          )}

          <View style={[styles.actions, { backgroundColor: theme.backgroundElement }]}>
            {photo?.hidden && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t('photos.hiddenByOwner')}
              </ThemedText>
            )}
            {mine ? (
              <>
                <Button label={t('photos.retake')} onPress={onRetake} />
                <Button
                  variant="danger"
                  label={t('photos.delete')}
                  loading={remove.isPending}
                  onPress={() =>
                    photo &&
                    confirmAction(
                      t('photos.deleteConfirm'),
                      () => remove.mutate({ id: photo.id, path: photo.path }, { onSuccess: onClose }),
                      { ok: t('photos.delete'), cancel: t('common.cancel') },
                    )
                  }
                />
              </>
            ) : report.isSuccess ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t('social.report.thanks')}
              </ThemedText>
            ) : (
              <>
                {isOwner && (
                  <Button
                    variant="secondary"
                    label={t('photos.hide')}
                    loading={hide.isPending}
                    onPress={() => photo && hide.mutate(photo.id, { onSuccess: onClose })}
                  />
                )}
                <Button
                  variant="danger"
                  label={t('photos.report')}
                  loading={report.isPending}
                  onPress={() =>
                    photo &&
                    report.mutate({ reported: photo.user_id, reason: 'inappropriate_photo', photo_id: photo.id })
                  }
                />
              </>
            )}
            {(remove.isError || hide.isError || report.isError) && (
              <ThemedText type="small" themeColor="danger" style={styles.center}>
                {t('social.errors.generic')}
              </ThemedText>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  image: { flex: 1, borderRadius: Radius.lg },
  actions: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg },
  name: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  center: { textAlign: 'center' },
});
