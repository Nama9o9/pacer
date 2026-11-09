import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { StepHeader } from '@/features/onboarding/StepHeader';
import { ChoiceChip } from '@/features/onboarding/ChoiceChip';
import { TimeField } from '@/features/onboarding/TimeField';
import { onboardingStyles as s } from '@/features/onboarding/styles';
import {
  GOAL_DISTANCES,
  calculatePace,
  formatPace,
  parseGermanDate,
  parseInteger,
  toSeconds,
  validateGoal,
  weeksUntil,
  type ValidationErrors,
} from '@/utils/validation';

export default function GoalScreen() {
  const { draft, updateDraft } = useOnboarding();

  const [distanceM, setDistanceM] = useState<number | null>(draft.distanceM);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [dateText, setDateText] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  const targetTimeS = toSeconds(parseInteger(hours), parseInteger(minutes), parseInteger(seconds));
  const raceDate = parseGermanDate(dateText);

  // Live-Anzeigen unter den Feldern
  const paceText =
    distanceM !== null && targetTimeS > 0
      ? `Zielpace: ${formatPace(calculatePace(distanceM, targetTimeS))} /km`
      : null;
  const weeks = raceDate ? weeksUntil(raceDate) : null;
  const weeksText = weeks !== null && weeks >= 0 ? `Noch ${weeks} Wochen Vorbereitung` : null;

  function handleNext() {
    const newErrors = validateGoal({ distanceM, targetTimeS, raceDate });

    // Text eingegeben, aber kein gültiges Datum erkannt
    if (dateText.trim() !== '' && raceDate === null) {
      newErrors.raceDate = 'Bitte im Format TT.MM.JJJJ eingeben.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    updateDraft({ distanceM, targetTimeS, raceDate });
    router.push('/onboarding/baseline');
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <StepHeader step={1} title="Dein Ziel" subtitle="Damit dein Plan optimal zu dir passt." />

        <Text style={s.label}>Zieldistanz</Text>
        <View style={s.chipGrid}>
          {GOAL_DISTANCES.map((option) => (
            <ChoiceChip
              key={option.meters}
              label={option.label}
              selected={distanceM === option.meters}
              onPress={() => setDistanceM(option.meters)}
            />
          ))}
        </View>
        {errors.distanceM && <Text style={s.error}>{errors.distanceM}</Text>}

        <Text style={s.label}>Wunsch-Zielzeit</Text>
        <View style={styles.timeRow}>
          <TimeField label="Std" value={hours} onChange={setHours} />
          <TimeField label="Min" value={minutes} onChange={setMinutes} />
          <TimeField label="Sek" value={seconds} onChange={setSeconds} />
        </View>
        {paceText && <Text style={s.hint}>{paceText}</Text>}
        {errors.targetTimeS && <Text style={s.error}>{errors.targetTimeS}</Text>}

        <Text style={s.label}>Wettkampfdatum</Text>
        <TextInput
          style={s.input}
          placeholder="TT.MM.JJJJ"
          keyboardType="numbers-and-punctuation"
          value={dateText}
          onChangeText={setDateText}
        />
        {weeksText && <Text style={s.hint}>{weeksText}</Text>}
        {errors.raceDate && <Text style={s.error}>{errors.raceDate}</Text>}

        <Pressable style={s.button} onPress={handleNext}>
          <Text style={s.buttonText}>Weiter</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', gap: 8 },
});
