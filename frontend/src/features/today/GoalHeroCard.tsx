import { StyleSheet, Text, View } from 'react-native';

import { CardLayout, Palette } from '@/constants/theme';
import { FEASIBILITY_LABELS, type Feasibility, type FeasibilityResult } from '@/utils/feasibility';
import { daysUntil, formatCountdown, formatLongDate, parseIsoDate } from '@/utils/today';
import { distanceLabel, formatDuration } from '@/utils/validation';

import type { TodayGoal } from './useTodayData';

/** Ampelfarben aus der Markenpalette */
const FEASIBILITY_COLORS: Record<Feasibility, string> = {
  realistic: Palette.meadow,
  ambitious: Palette.amber,
  unrealistic: Palette.coral,
};

type GoalHeroCardProps = {
  goal: TodayGoal;
  assessment: FeasibilityResult;
  today: Date;
};

/** Dunkle Hero-Karte mit Ziel, Countdown, Machbarkeit und Prognose */
export function GoalHeroCard({ goal, assessment, today }: GoalHeroCardProps) {
  const raceDate = parseIsoDate(goal.race_date);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Dein Ziel</Text>
      <Text style={styles.title}>
        {distanceLabel(goal.distance_m)} in {formatDuration(goal.target_time_s)}
      </Text>
      <Text style={styles.countdown}>{formatCountdown(daysUntil(raceDate, today))}</Text>
      <Text style={styles.secondary}>{formatLongDate(raceDate)}</Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={[styles.pill, { backgroundColor: FEASIBILITY_COLORS[assessment.level] }]}>
          <Text style={styles.pillText}>{FEASIBILITY_LABELS[assessment.level]}</Text>
        </View>
        <Text style={styles.secondary}>Prognose {formatDuration(assessment.predictedTimeS)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.teal,
    borderRadius: CardLayout.radius,
    padding: CardLayout.padding,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.meadow,
    opacity: 0.8,
  },
  title: { fontSize: 26, fontWeight: '700', color: Palette.meadow, marginTop: 4 },
  countdown: { fontSize: 17, fontWeight: '600', color: Palette.mist, marginTop: 8 },
  secondary: { fontSize: 14, color: Palette.mist, opacity: 0.8 },
  divider: { height: 1, backgroundColor: Palette.mist, opacity: 0.2, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  pillText: { fontSize: 13, fontWeight: '700', color: Palette.teal },
});
