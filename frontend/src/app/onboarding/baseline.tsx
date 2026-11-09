import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { StepHeader } from '@/features/onboarding/StepHeader';
import { ChoiceChip } from '@/features/onboarding/ChoiceChip';
import { TimeField } from '@/features/onboarding/TimeField';
import { colors, onboardingStyles as s } from '@/features/onboarding/styles';
import {
  RUNNING_SINCE_OPTIONS,
  parseDecimal,
  parseInteger,
  toSeconds,
  validateBaseline,
  type ValidationErrors,
} from '@/utils/validation';

const MAX_RUNS_PER_WEEK = 14;

export default function BaselineScreen() {
  const { draft, updateDraft } = useOnboarding();

  const [runsPerWeek, setRunsPerWeek] = useState(draft.runsPerWeek);
  const [kmText, setKmText] = useState('');
  const [longestRunText, setLongestRunText] = useState('');
  const [fiveKMinutes, setFiveKMinutes] = useState('');
  const [fiveKSeconds, setFiveKSeconds] = useState('');
  const [runningSinceMonths, setRunningSinceMonths] = useState<number | null>(draft.runningSinceMonths);
  const [errors, setErrors] = useState<ValidationErrors>({});

  function handleNext() {
    const input = {
      runsPerWeek,
      kmPerWeek: parseDecimal(kmText),
      longestRunKm: parseDecimal(longestRunText),
      recent5kTimeS: toSeconds(0, parseInteger(fiveKMinutes), parseInteger(fiveKSeconds)),
      runningSinceMonths,
    };

    const newErrors = validateBaseline(input);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    updateDraft(input);
    router.push('/onboarding/days');
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <StepHeader
          step={2}
          title="Deine Basis"
          subtitle="Wie sah dein Training in den letzten 4 Wochen aus?"
        />

        {/* Läufe pro Woche als Zähler */}
        <Text style={s.label}>Läufe pro Woche</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setRunsPerWeek((n) => Math.max(0, n - 1))}
            accessibilityLabel="Einen Lauf weniger"
          >
            <Text style={styles.stepperSymbol}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{runsPerWeek}</Text>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setRunsPerWeek((n) => Math.min(MAX_RUNS_PER_WEEK, n + 1))}
            accessibilityLabel="Einen Lauf mehr"
          >
            <Text style={styles.stepperSymbol}>+</Text>
          </Pressable>
        </View>
        {errors.runsPerWeek && <Text style={s.error}>{errors.runsPerWeek}</Text>}

        <Text style={s.label}>Kilometer pro Woche (Durchschnitt)</Text>
        <TextInput
          style={s.input}
          placeholder="z. B. 24"
          keyboardType="decimal-pad"
          value={kmText}
          onChangeText={setKmText}
        />
        {errors.kmPerWeek && <Text style={s.error}>{errors.kmPerWeek}</Text>}

        <Text style={s.label}>Längster Lauf in km</Text>
        <TextInput
          style={s.input}
          placeholder="z. B. 12"
          keyboardType="decimal-pad"
          value={longestRunText}
          onChangeText={setLongestRunText}
        />
        {errors.longestRunKm && <Text style={s.error}>{errors.longestRunKm}</Text>}

        <Text style={s.label}>Letzte 5-km-Zeit</Text>
        <View style={styles.timeRow}>
          <TimeField label="Min" value={fiveKMinutes} onChange={setFiveKMinutes} />
          <TimeField label="Sek" value={fiveKSeconds} onChange={setFiveKSeconds} />
        </View>
        <Text style={styles.note}>Eine Schätzung reicht.</Text>
        {errors.recent5kTimeS && <Text style={s.error}>{errors.recent5kTimeS}</Text>}

        <Text style={s.label}>Ich laufe seit</Text>
        <View style={s.chipGrid}>
          {RUNNING_SINCE_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.months}
              label={option.label}
              selected={runningSinceMonths === option.months}
              onPress={() => setRunningSinceMonths(option.months)}
            />
          ))}
        </View>
        {errors.runningSinceMonths && <Text style={s.error}>{errors.runningSinceMonths}</Text>}

        <Pressable style={s.button} onPress={handleNext}>
          <Text style={s.buttonText}>Weiter</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: { fontSize: 24, color: colors.primary },
  stepperValue: { fontSize: 24, fontWeight: '600', color: colors.text, minWidth: 32, textAlign: 'center' },
  timeRow: { flexDirection: 'row', gap: 8 },
  note: { fontSize: 13, color: colors.subtle },
});
