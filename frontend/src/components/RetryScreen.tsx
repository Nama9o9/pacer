import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

type RetryScreenProps = {
  /** Kurze Erklärung, was nicht geklappt hat */
  message?: string;
  onRetry: () => void;
};

/** Vollbild-Fehlerzustand mit „Erneut versuchen“, z. B. wenn Daten nicht geladen werden konnten */
export function RetryScreen({
  message = 'Deine Daten konnten nicht geladen werden. Prüfe deine Internetverbindung.',
  onRetry,
}: RetryScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Da hat etwas nicht geklappt</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>Erneut versuchen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: Palette.mist,
  },
  title: { fontSize: 20, fontWeight: '700', color: Palette.teal, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, color: Palette.textSecondary, textAlign: 'center' },
  button: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: Palette.teal,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: Palette.meadow },
});
