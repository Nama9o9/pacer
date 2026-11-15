import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import type { WeekDay } from '@/utils/today';

import { todayStyles } from './styles';

type WeekStripProps = {
  week: WeekDay[];
  /** Öffnet den ganzen Trainingsplan */
  onOpenPlan: () => void;
};

/** Beschreibung eines Tages für Screenreader */
function describeDay(day: WeekDay): string {
  const parts = [`${day.label} ${day.dayOfMonth}.`];
  if (day.hasRun) parts.push('gelaufen');
  else if (day.isTrainingDay) parts.push('Trainingstag');
  if (day.isToday) parts.push('heute');
  return parts.join(', ');
}

/**
 * Wochenleiste Mo–So.
 * Gelaufen: Meadow mit Häkchen. Trainingstag: heller Hintergrund, fette Zahl. Heute: Rahmen.
 */
export function WeekStrip({ week, onOpenPlan }: WeekStripProps) {
  return (
    <View style={todayStyles.card}>
      <Text style={todayStyles.label}>Diese Woche</Text>
      <View style={styles.row}>
        {week.map((day) => (
          <View key={day.isoDay} style={styles.day} accessibilityLabel={describeDay(day)}>
            <Text style={[styles.weekday, day.isToday && styles.today]}>{day.label}</Text>
            <View
              style={[
                styles.circle,
                day.isTrainingDay && styles.circleTraining,
                day.hasRun && styles.circleDone,
                day.isToday && styles.circleToday,
              ]}
            >
              {day.hasRun ? (
                <Ionicons name="checkmark" size={18} color={Palette.teal} />
              ) : (
                <Text style={[styles.date, day.isTrainingDay && styles.dateTraining]}>{day.dayOfMonth}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <Pressable style={styles.planLink} onPress={onOpenPlan} accessibilityRole="button">
        <Text style={styles.planLinkText}>Ganzen Plan ansehen</Text>
        <Ionicons name="chevron-forward" size={18} color={Palette.teal} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  day: { alignItems: 'center', gap: 6, flex: 1 },
  weekday: { fontSize: 12, color: Palette.textSecondary },
  today: { fontWeight: '700', color: Palette.teal },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleTraining: { backgroundColor: Palette.mist, borderColor: Palette.line },
  circleDone: { backgroundColor: Palette.meadow, borderColor: Palette.meadow },
  circleToday: { borderColor: Palette.teal },
  date: { fontSize: 14, color: Palette.textSecondary },
  dateTraining: { fontWeight: '700', color: Palette.teal },
  planLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  planLinkText: { fontSize: 15, fontWeight: '700', color: Palette.teal },
});
