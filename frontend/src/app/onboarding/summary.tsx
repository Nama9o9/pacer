import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { colors, onboardingStyles as s } from '@/features/onboarding/styles';
import { useAuth } from '@/providers/AuthProvider';
import { assessFeasibility, FEASIBILITY_LABELS, type Feasibility } from '@/utils/feasibility';
import {
  PAIN_LOCATIONS,
  RUNNING_SINCE_OPTIONS,
  WEEKDAYS,
  calculatePace,
  distanceLabel,
  formatDuration,
  formatPace,
  toIsoDate,
  weeksUntil,
} from '@/utils/validation';

/** Darstellung der Ampel */
const FEASIBILITY_STYLES: Record<Feasibility, { label: string; color: string; background: string }> = {
  realistic: { label: FEASIBILITY_LABELS.realistic, color: '#166534', background: '#DCFCE7' },
  ambitious: { label: FEASIBILITY_LABELS.ambitious, color: '#92400E', background: '#FEF3C7' },
  unrealistic: { label: FEASIBILITY_LABELS.unrealistic, color: '#991B1B', background: '#FEE2E2' },
};

export default function SummaryScreen() {
  const { draft } = useOnboarding();
  const { refreshGoalStatus } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Die vorherigen Schritte stellen sicher, dass diese Werte gesetzt sind
  if (draft.distanceM === null || draft.raceDate === null) {
    return (
      <View style={[s.container, styles.center]}>
        <Text style={s.error}>Es fehlen Angaben. Bitte starte das Onboarding neu.</Text>
      </View>
    );
  }

  const distanceM = draft.distanceM;
  const raceDate = draft.raceDate;
  const weeks = weeksUntil(raceDate);
  const feasibility = assessFeasibility({
    distanceM,
    targetTimeS: draft.targetTimeS,
    weeksUntilRace: weeks,
    recent5kTimeS: draft.recent5kTimeS,
    runningSinceMonths: draft.runningSinceMonths ?? 0,
  });
  const ampel = FEASIBILITY_STYLES[feasibility.level];

  // Anzeigetexte
  const runningSinceLabel =
    RUNNING_SINCE_OPTIONS.find((o) => o.months === draft.runningSinceMonths)?.label ?? '–';
  const daysLabel = WEEKDAYS.filter((d) => draft.availableDays.includes(d.value))
    .map((d) => d.label)
    .join(', ');
  const painsLabel = draft.hasPain
    ? draft.pains
        .map((p) => `${PAIN_LOCATIONS.find((o) => o.value === p.location)?.label} (${p.level}/10)`)
        .join(', ')
    : 'Keine';

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    // Ziel, Basis und Beschwerden gemeinsam speichern (alles oder nichts)
    const { data: goalId, error } = await supabase.rpc('complete_onboarding', {
      p_distance_m: distanceM,
      p_target_time_s: draft.targetTimeS,
      p_race_date: toIsoDate(raceDate),
      p_runs_per_week: draft.runsPerWeek,
      p_km_per_week: draft.kmPerWeek,
      p_longest_run_km: draft.longestRunKm,
      p_recent_5k_time_s: draft.recent5kTimeS,
      p_running_since_months: draft.runningSinceMonths ?? 0,
      p_available_days: draft.availableDays,
      p_pains: draft.pains.map((p) => ({ location: p.location, level: p.level })),
    });

    if (error || !goalId) {
      setSaveError('Speichern hat nicht geklappt. Bitte versuch es noch einmal.');
      setIsSaving(false);
      return;
    }

    // Ampel am Ziel vermerken. Schlägt das fehl, bleibt das Ziel trotzdem
    // gültig, nur ohne Einstufung; die Ampel lässt sich jederzeit neu berechnen.
    await supabase.from('goals').update({ feasibility: feasibility.level }).eq('goal_id', goalId);

    // Mit aktivem Ziel leitet das Root-Layout automatisch auf „Heute“ weiter
    await refreshGoalStatus();
    setIsSaving(false);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Zurück</Text>
      </Pressable>
      <Text style={styles.title}>Alles im Blick</Text>
      <Text style={styles.subtitle}>Prüf deine Angaben, dann erstellen wir deinen Plan.</Text>

      {/* Ziel */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Ziel</Text>
        <Text style={styles.goalTitle}>
          {distanceLabel(distanceM)} in {formatDuration(draft.targetTimeS)}
        </Text>
        <Text style={styles.row}>
          Zielpace {formatPace(calculatePace(distanceM, draft.targetTimeS))} /km
        </Text>
        <Text style={styles.row}>
          {raceDate.toLocaleDateString('de-DE')} · noch {weeks} Wochen
        </Text>
      </View>

      {/* Machbarkeitsampel (FA#0107) */}
      <View style={[styles.card, { backgroundColor: ampel.background, borderColor: ampel.background }]}>
        <Text style={styles.cardLabel}>Machbarkeit</Text>
        <Text style={[styles.ampelLabel, { color: ampel.color }]}>{ampel.label}</Text>
        <Text style={styles.row}>
          Deine Prognose aus der 5-km-Zeit: {formatDuration(feasibility.predictedTimeS)}
        </Text>
        {feasibility.reasons.map((reason) => (
          <Text key={reason} style={styles.row}>
            • {reason}
          </Text>
        ))}
        {feasibility.suggestedTargetTimeS !== null && (
          <Text style={[styles.row, styles.suggestion]}>
            Vorschlag: Zielzeit {formatDuration(feasibility.suggestedTargetTimeS)}
          </Text>
        )}
        {feasibility.level !== 'realistic' && (
          <Text style={styles.note}>
            Du kannst dein Ziel über „Zurück“ anpassen oder es trotzdem so übernehmen.
          </Text>
        )}
      </View>

      {/* Basis */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Deine Basis</Text>
        <Text style={styles.row}>{draft.runsPerWeek} Läufe pro Woche</Text>
        <Text style={styles.row}>{draft.kmPerWeek} km pro Woche</Text>
        <Text style={styles.row}>Längster Lauf: {draft.longestRunKm} km</Text>
        <Text style={styles.row}>5 km in {formatDuration(draft.recent5kTimeS)}</Text>
        <Text style={styles.row}>Läufst seit: {runningSinceLabel}</Text>
      </View>

      {/* Woche und Beschwerden */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Trainingstage</Text>
        <Text style={styles.row}>{daysLabel}</Text>
        <Text style={[styles.cardLabel, styles.spaced]}>Beschwerden</Text>
        <Text style={styles.row}>{painsLabel}</Text>
      </View>

      {saveError && <Text style={s.error}>{saveError}</Text>}

      <Pressable style={s.button} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.buttonText}>Plan erstellen</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', padding: 24 },
  back: { fontSize: 15, color: colors.primary },
  title: { fontSize: 28, fontWeight: '700', color: colors.primaryDark, marginTop: 12 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.track,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' },
  spaced: { marginTop: 12 },
  goalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  ampelLabel: { fontSize: 20, fontWeight: '700' },
  row: { fontSize: 15, color: colors.text, lineHeight: 22 },
  suggestion: { fontWeight: '600' },
  note: { fontSize: 13, color: colors.subtle, marginTop: 4 },
});
