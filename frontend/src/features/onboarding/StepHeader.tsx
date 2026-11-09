import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from './styles';

const TOTAL_STEPS = 4;

type StepHeaderProps = {
  step: number;
  title: string;
  subtitle: string;
};

/** Fortschritt, Zurück-Button und Überschrift für jeden Onboarding-Schritt */
export function StepHeader({ step, title, subtitle }: StepHeaderProps) {
  const progress = `${(step / TOTAL_STEPS) * 100}%` as const;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Ab Schritt 2 kann man zurück, Schritt 1 ist der Anfang */}
        {step > 1 ? (
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Zurück</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={styles.step}>
          Schritt {step} von {TOTAL_STEPS}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: progress }]} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontSize: 15, color: colors.primary },
  step: { fontSize: 14, color: colors.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.track },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  title: { fontSize: 28, fontWeight: '700', color: colors.primaryDark, marginTop: 12 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 8 },
});
