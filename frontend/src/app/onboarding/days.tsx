import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { StepHeader } from '@/features/onboarding/StepHeader';
import { ChoiceChip } from '@/features/onboarding/ChoiceChip';
import { colors, onboardingStyles as s } from '@/features/onboarding/styles';
import { WEEKDAYS, validateAvailableDays, type ValidationErrors } from '@/utils/validation';

export default function DaysScreen() {
  const { draft, updateDraft } = useOnboarding();

  const [availableDays, setAvailableDays] = useState<number[]>(draft.availableDays);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /** Tag hinzufügen oder entfernen, Liste bleibt nach Wochentag sortiert */
  function toggleDay(day: number) {
    setAvailableDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleNext() {
    const newErrors = validateAvailableDays(availableDays);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    updateDraft({ availableDays });
    router.push('/onboarding/pain');
  }

  const count = availableDays.length;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StepHeader
        step={3}
        title="Deine Woche"
        subtitle="An welchen Tagen kannst du grundsätzlich laufen?"
      />

      <Text style={s.label}>Trainingstage</Text>
      <View style={s.chipGrid}>
        {WEEKDAYS.map((day) => (
          <ChoiceChip
            key={day.value}
            label={day.label}
            selected={availableDays.includes(day.value)}
            onPress={() => toggleDay(day.value)}
            style={styles.dayChip}
          />
        ))}
      </View>

      {count > 0 && (
        <Text style={s.hint}>
          {count} {count === 1 ? 'Tag' : 'Tage'} pro Woche
        </Text>
      )}
      {/* Nur ein Hinweis, kein Fehler: weniger Tage als bisher ist erlaubt */}
      {count > 0 && count < draft.runsPerWeek && (
        <Text style={styles.note}>
          Bisher läufst du {draft.runsPerWeek}-mal pro Woche. Dein Plan richtet sich nach den
          gewählten Tagen.
        </Text>
      )}
      {errors.availableDays && <Text style={s.error}>{errors.availableDays}</Text>}

      <Pressable style={s.button} onPress={handleNext}>
        <Text style={s.buttonText}>Weiter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Vier Tage pro Reihe statt zwei
  dayChip: { flexBasis: '22%' },
  note: { fontSize: 13, color: colors.subtle },
});
