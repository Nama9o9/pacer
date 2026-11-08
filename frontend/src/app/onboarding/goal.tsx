import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import {
  GOAL_DISTANCES,
  calculatePace,
  formatPace,
  parseGermanDate,
  toSeconds,
  validateGoal,
  weeksUntil,
  type ValidationErrors,
} from '@/utils/validation';

/** Leere oder ungültige Eingaben zählen als 0 */
function toInt(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isNaN(value) ? 0 : value;
}

export default function GoalScreen() {
  const { draft, updateDraft } = useOnboarding();

  const [distanceM, setDistanceM] = useState<number | null>(draft.distanceM);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [dateText, setDateText] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  const targetTimeS = toSeconds(toInt(hours), toInt(minutes), toInt(seconds));
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>Schritt 1 von 4</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '25%' }]} />
        </View>

        <Text style={styles.title}>Dein Ziel</Text>
        <Text style={styles.subtitle}>Damit dein Plan optimal zu dir passt.</Text>

        {/* Distanz */}
        <Text style={styles.label}>Zieldistanz</Text>
        <View style={styles.chipGrid}>
          {GOAL_DISTANCES.map((option) => {
            const isSelected = distanceM === option.meters;
            return (
              <Pressable
                key={option.meters}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setDistanceM(option.meters)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.distanceM && <Text style={styles.error}>{errors.distanceM}</Text>}

        {/* Zielzeit */}
        <Text style={styles.label}>Wunsch-Zielzeit</Text>
        <View style={styles.timeRow}>
          <TimeField label="Std" value={hours} onChange={setHours} />
          <TimeField label="Min" value={minutes} onChange={setMinutes} />
          <TimeField label="Sek" value={seconds} onChange={setSeconds} />
        </View>
        {paceText && <Text style={styles.hint}>{paceText}</Text>}
        {errors.targetTimeS && <Text style={styles.error}>{errors.targetTimeS}</Text>}

        {/* Wettkampfdatum */}
        <Text style={styles.label}>Wettkampfdatum</Text>
        <TextInput
          style={styles.input}
          placeholder="TT.MM.JJJJ"
          keyboardType="numbers-and-punctuation"
          value={dateText}
          onChangeText={setDateText}
        />
        {weeksText && <Text style={styles.hint}>{weeksText}</Text>}
        {errors.raceDate && <Text style={styles.error}>{errors.raceDate}</Text>}

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Weiter</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Eingabefeld für Stunden, Minuten oder Sekunden */
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <View style={styles.timeField}>
      <TextInput
        style={[styles.input, styles.timeInput]}
        placeholder="00"
        keyboardType="number-pad"
        maxLength={2}
        value={value}
        onChangeText={onChange}
      />
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
}

// Farben vorerst hier, später aus der zentralen Theme-Datei
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, gap: 12 },
  step: { fontSize: 14, color: '#475569' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#2563EB' },
  title: { fontSize: 28, fontWeight: '700', color: '#1E3A8A', marginTop: 12 },
  subtitle: { fontSize: 16, color: '#475569', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginTop: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 15, color: '#1E293B' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeField: { flex: 1, alignItems: 'center', gap: 4 },
  timeInput: { alignSelf: 'stretch', textAlign: 'center', fontSize: 22 },
  timeLabel: { fontSize: 12, color: '#64748B' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  hint: { fontSize: 14, color: '#2563EB' },
  error: { color: '#B91C1C', fontSize: 14 },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
