import { StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';

// Platzhalter: wird im nächsten Schritt durch den echten Screen ersetzt
export default function DaysScreen() {
  const { draft } = useOnboarding();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schritt 3 folgt</Text>
      {/* Zum Testen: zeigt, dass Schritt 1 und 2 gespeichert wurden */}
      <Text>{JSON.stringify(draft, null, 2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
