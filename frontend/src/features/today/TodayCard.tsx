import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

import { todayStyles } from './styles';

type TodayCardProps = {
  isTrainingDay: boolean;
};

/**
 * Was heute ansteht. Vorläufig nur Trainings- oder Ruhetag;
 * wird durch die geplante Einheit ersetzt, sobald es den Trainingsplan gibt.
 */
export function TodayCard({ isTrainingDay }: TodayCardProps) {
  return (
    <View style={todayStyles.card}>
      <Text style={todayStyles.label}>Heute</Text>
      <View style={styles.row}>
        <View style={[styles.dot, isTrainingDay ? styles.dotTraining : styles.dotRest]} />
        <Text style={todayStyles.title}>{isTrainingDay ? 'Trainingstag' : 'Ruhetag'}</Text>
      </View>
      <Text style={todayStyles.body}>
        {isTrainingDay
          ? 'Dein detaillierter Plan folgt.'
          : 'Erholung gehört zum Training. Dein detaillierter Plan folgt.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotTraining: { backgroundColor: Palette.meadow, borderWidth: 1, borderColor: Palette.teal },
  dotRest: { backgroundColor: Palette.line },
});
