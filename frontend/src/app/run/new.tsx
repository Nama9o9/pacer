import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardLayout, Palette } from '@/constants/theme';
import { saveManualActivity } from '@/features/activities/saveManualActivity';
import { TimeField } from '@/features/onboarding/TimeField';
import { useAuth } from '@/providers/AuthProvider';
import { createEmptyRunForm, filledFields, parseRunForm, type RunField, type RunForm } from '@/utils/runEntry';
import { formatPace } from '@/utils/validation';

/** Manuelle Laufeingabe (FA#0103) */
export default function NewRunScreen() {
  const { session } = useAuth();
  const [form, setForm] = useState<RunForm>(() => createEmptyRunForm(new Date()));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Bei jeder Eingabe neu prüfen; „jetzt“ aktuell halten, damit die Zukunftsprüfung stimmt
  const { activity, errors, paceSPerKm } = parseRunForm(form, new Date());
  const filled = filledFields(form);

  /** Fehler nur für Felder zeigen, in denen schon etwas steht */
  const errorFor = (field: RunField) => (filled[field] ? errors[field] : undefined);

  const update = (field: keyof RunForm) => (text: string) => setForm((prev) => ({ ...prev, [field]: text }));

  async function handleSave() {
    // Schutz gegen Doppeltippen und ungültige Daten
    if (!activity || isSaving) return;

    const userId = session?.user.id;
    if (!userId) {
      setSaveError('Du bist nicht mehr angemeldet. Bitte melde dich neu an.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const result = await saveManualActivity(userId, activity);

    if (!result.ok) {
      setSaveError(result.message);
      setIsSaving(false);
      return;
    }

    // „Heute“ lädt beim Zurückkehren automatisch neu
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" style={styles.cancel}>
            <Text style={styles.cancelText}>Abbrechen</Text>
          </Pressable>
          <Text style={styles.title}>Lauf eintragen</Text>

          <View style={styles.card}>
            <Field label="Datum" error={errorFor('date')}>
              <Input value={form.date} onChange={update('date')} placeholder="TT.MM.JJJJ" keyboardType="numbers-and-punctuation" />
            </Field>
            <Field label="Startzeit" error={errorFor('startTime')}>
              <View style={styles.timeRow}>
                <TimeField label="Std" value={form.startHour} onChange={update('startHour')} />
                <TimeField label="Min" value={form.startMinute} onChange={update('startMinute')} />
              </View>
            </Field>
          </View>

          <View style={styles.card}>
            <Field label="Distanz" error={errorFor('distance')}>
              <Input value={form.distanceKm} onChange={update('distanceKm')} placeholder="z. B. 8,5" keyboardType="decimal-pad" unit="km" />
            </Field>
            <Field label="Dauer" error={errorFor('duration')}>
              <View style={styles.timeRow}>
                <TimeField label="Std" value={form.durationHours} onChange={update('durationHours')} />
                <TimeField label="Min" value={form.durationMinutes} onChange={update('durationMinutes')} />
                <TimeField label="Sek" value={form.durationSeconds} onChange={update('durationSeconds')} />
              </View>
            </Field>
            {paceSPerKm !== null && (
              <Text style={styles.pace}>Pace: {formatPace(Math.round(paceSPerKm))} /km</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.optional}>Optional</Text>
            <Field label="Ø Herzfrequenz" error={errorFor('avgHeartRate')}>
              <Input value={form.avgHeartRate} onChange={update('avgHeartRate')} placeholder="z. B. 150" keyboardType="number-pad" unit="bpm" />
            </Field>
            <Field label="Höhenmeter" error={errorFor('elevationGain')}>
              <Input value={form.elevationGainM} onChange={update('elevationGainM')} placeholder="z. B. 80" keyboardType="number-pad" unit="m" />
            </Field>
          </View>

          {saveError && <Text style={styles.error}>{saveError}</Text>}

          <Pressable
            style={[styles.button, (!activity || isSaving) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!activity || isSaving}
            accessibilityRole="button"
            accessibilityState={{ disabled: !activity || isSaving, busy: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color={Palette.meadow} />
            ) : (
              <Text style={styles.buttonText}>Lauf speichern</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Beschriftung, Eingabe und Fehlermeldung eines Felds */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

type InputProps = {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  /** Einheit rechts im Feld, z. B. „km“ */
  unit?: string;
};

/** Einzeiliges Textfeld im Pacer-Stil */
function Input({ value, onChange, placeholder, keyboardType, unit }: InputProps) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Palette.textSecondary}
        keyboardType={keyboardType}
      />
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.mist },
  flex: { flex: 1 },
  content: { padding: CardLayout.padding, gap: CardLayout.gap, paddingBottom: 32 },
  cancel: { alignSelf: 'flex-start' },
  cancelText: { fontSize: 15, color: Palette.textSecondary },
  title: { fontSize: 28, fontWeight: '700', color: Palette.teal },
  card: {
    backgroundColor: Palette.card,
    borderRadius: CardLayout.radius,
    padding: CardLayout.padding,
    borderWidth: 1,
    borderColor: Palette.line,
    gap: 14,
  },
  optional: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textSecondary,
  },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Palette.teal },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Palette.teal,
  },
  unit: { fontSize: 15, color: Palette.textSecondary, minWidth: 32 },
  timeRow: { flexDirection: 'row', gap: 8 },
  pace: { fontSize: 15, fontWeight: '600', color: Palette.teal },
  error: { fontSize: 14, color: '#B42318' },
  button: {
    backgroundColor: Palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Palette.meadow },
});
