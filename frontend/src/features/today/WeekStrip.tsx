import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import type { WeekDay } from '@/utils/today';

import { todayStyles } from './styles';

type WeekStripProps = {
  week: WeekDay[];
};

/** Wochenleiste Mo–So: Trainingstage gefüllt, heute mit Rahmen */
export function WeekStrip({ week }: WeekStripProps) {
  return (
    <View style={todayStyles.card}>
      <Text style={todayStyles.label}>Diese Woche</Text>
      <View style={styles.row}>
        {week.map((day) => (
          <View
            key={day.isoDay}
            style={styles.day}
            accessibilityLabel={`${day.label} ${day.dayOfMonth}.${day.isTrainingDay ? ', Trainingstag' : ''}${day.isToday ? ', heute' : ''}`}
          >
            <Text style={[styles.weekday, day.isToday && styles.today]}>{day.label}</Text>
            <View
              style={[
                styles.circle,
                day.isTrainingDay && styles.circleTraining,
                day.isToday && styles.circleToday,
              ]}
            >
              <Text style={[styles.date, day.isTrainingDay && styles.dateTraining]}>{day.dayOfMonth}</Text>
            </View>
          </View>
        ))}
      </View>
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
  circleTraining: { backgroundColor: Palette.meadow },
  circleToday: { borderColor: Palette.teal },
  date: { fontSize: 14, color: Palette.textSecondary },
  dateTraining: { fontWeight: '700', color: Palette.teal },
});
