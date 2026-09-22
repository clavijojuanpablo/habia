import { Alert, Platform } from 'react-native';

/**
 * Cross-platform destructive confirmation: a native alert on iOS/Android,
 * `window.confirm` on web (React Native's Alert has no web implementation).
 */
export function confirmAction(message: string, onConfirm: () => void, labels: { ok: string; cancel: string }) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert(message, undefined, [
    { text: labels.cancel, style: 'cancel' },
    { text: labels.ok, style: 'destructive', onPress: onConfirm },
  ]);
}
