import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

import { todayStyles } from './styles';

type TodayCardProps = {
  isTrainingDay: boolean;
  /** Zusammenfassung der heutigen Läufe, z. B. „8,5 km in 52:10 (6:08 /km)“; null ohne Lauf */
  todayRunSummary: string | null;
  onAddRun: () => void;
};

/**
 * Was heute ansteht. Vorläufig nur Trainings- oder Ruhetag;
 * wird durch die geplante Einheit ersetzt, sobald es den Trainingsplan gibt.
 */
export function TodayCard({ isTrainingDay, todayRunSummary, onAddRun }: TodayCardProps) {
  return (
    <View style={todayStyles.card}>
      <Text style={todayStyles.label}>Heute</Text>
      <View style={styles.row}>
        <View style={[styles.dot, isTrainingDay ? styles.dotTraining : styles.dotRest]} />
        <Text style={todayStyles.title}>{isTrainingDay ? 'Trainingstag' : 'Ruhetag'}</Text>
      </View>

      {todayRunSummary ? (
        <Text style={styles.done}>Heute gelaufen: {todayRunSummary}</Text>
      ) : (
        <Text style={todayStyles.body}>
          {isTrainingDay
            ? 'Dein detaillierter Plan folgt.'
            : 'Erholung gehört zum Training. Dein detaillierter Plan folgt.'}
        </Text>
      )}

      <Pressable style={styles.button} onPress={onAddRun} accessibilityRole="button">
        <Text style={styles.buttonText}>Lauf eintragen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotTraining: { backgroundColor: Palette.meadow, borderWidth: 1, borderColor: Palette.teal },
  dotRest: { backgroundColor: Palette.line },
  done: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: Palette.teal },
  button: {
    marginTop: 10,
    backgroundColor: Palette.teal,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: Palette.meadow },
});
