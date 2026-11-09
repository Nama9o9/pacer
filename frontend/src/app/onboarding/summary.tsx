import { ScrollView, StyleSheet, Text } from 'react-native';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';

// Platzhalter: wird im nächsten Schritt durch die Zusammenfassung ersetzt
export default function SummaryScreen() {
  const { draft } = useOnboarding();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Zusammenfassung folgt</Text>
      {/* Zum Testen: zeigt den kompletten Entwurf */}
      <Text>{JSON.stringify(draft, null, 2)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
