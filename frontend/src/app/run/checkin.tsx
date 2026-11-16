import { router, useLocalSearchParams } from 'expo-router';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardLayout, Palette } from '@/constants/theme';
import { PainPicker } from '@/features/checkin/PainPicker';
import { saveCheckin } from '@/features/checkin/saveCheckin';
import { ScaleSelector } from '@/features/checkin/ScaleSelector';
import {
  createEmptyCheckinForm,
  FIVE_POINT_VALUES,
  NOTE_MAX_LENGTH,
  RPE_LABELS,
  RPE_VALUES,
  toSaveCheckinArgs,
  validateCheckin,
  type CheckinForm,
} from '@/utils/checkin';

/** Check-in nach dem Lauf (FA#0108). Öffnet sich direkt nach „Lauf speichern“. */
export default function CheckinScreen() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const [form, setForm] = useState<CheckinForm>(createEmptyCheckinForm);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fehler erst nach dem ersten Speicherversuch zeigen
  const errors = showErrors ? validateCheckin(form) : {};

  const update = (patch: Partial<CheckinForm>) => setForm((prev) => ({ ...prev, ...patch }));

  async function handleSave() {
    if (isSaving) return;
    if (!activityId) {
      setSaveError('Der Lauf wurde nicht gefunden. Bitte trag den Check-in später noch einmal ein.');
      return;
    }

    const args = toSaveCheckinArgs(activityId, form);
    if (!args) {
      setShowErrors(true);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const result = await saveCheckin(args);

    if (!result.ok) {
      setSaveError(result.message);
      setIsSaving(false);
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Der Lauf ist schon gespeichert, der Check-in ist freiwillig */}
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" style={styles.skip}>
            <Text style={styles.skipText}>Überspringen</Text>
          </Pressable>
          <Text style={styles.title}>Wie war dein Lauf?</Text>
          <Text style={styles.subtitle}>Lauf gespeichert. Nimm dir kurz Zeit, dein Coach nutzt deine Angaben.</Text>

          <Section title="Wie anstrengend war es?" error={errors.rpe}>
            <ScaleSelector
              label="Anstrengung"
              values={RPE_VALUES}
              selected={form.rpe}
              onSelect={(rpe) => update({ rpe })}
              minLabel="0 Ruhe"
              maxLabel="10 Maximal"
            />
            {form.rpe !== null && <Text style={styles.rpeLabel}>{RPE_LABELS[form.rpe]}</Text>}
          </Section>

          <Section title="Wie ist deine Stimmung?" error={errors.mood}>
            <ScaleSelector
              label="Stimmung"
              values={FIVE_POINT_VALUES}
              selected={form.mood}
              onSelect={(mood) => update({ mood })}
              minLabel="1 Schlecht"
              maxLabel="5 Sehr gut"
            />
          </Section>

          <Section title="Wie motiviert bist du?" error={errors.motivation}>
            <ScaleSelector
              label="Motivation"
              values={FIVE_POINT_VALUES}
              selected={form.motivation}
              onSelect={(motivation) => update({ motivation })}
              minLabel="1 Kaum"
              maxLabel="5 Sehr"
            />
          </Section>

          <Section title="Schmerzen oder Zwicken?" error={errors.levels}>
            <PainPicker hasPain={form.hasPain} pains={form.pains} onChange={update} error={errors.pains} />
          </Section>

          <Section title="Notiz an den Coach" optional error={errors.note}>
            <TextInput
              style={styles.note}
              value={form.note}
              onChangeText={(note) => update({ note })}
              placeholder="z. B. Gegenwind auf den letzten 2 km"
              placeholderTextColor={Palette.textSecondary}
              maxLength={NOTE_MAX_LENGTH}
              multiline
            />
          </Section>

          {saveError && <Text style={styles.error}>{saveError}</Text>}

          <Pressable
            style={[styles.button, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving, busy: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color={Palette.meadow} />
            ) : (
              <Text style={styles.buttonText}>Check-in speichern</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type SectionProps = { title: string; optional?: boolean; error?: string; children: ReactNode };

/** Karte mit Überschrift und Fehlermeldung */
function Section({ title, optional, error, children }: SectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {optional && <Text style={styles.optional}>Optional</Text>}
      </View>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.mist },
  flex: { flex: 1 },
  content: { padding: CardLayout.padding, gap: CardLayout.gap, paddingBottom: 32 },
  skip: { alignSelf: 'flex-end' },
  skipText: { fontSize: 15, color: Palette.textSecondary },
  title: { fontSize: 28, fontWeight: '700', color: Palette.teal },
  subtitle: { fontSize: 15, lineHeight: 21, color: Palette.textSecondary, marginTop: -8 },
  card: {
    backgroundColor: Palette.card,
    borderRadius: CardLayout.radius,
    padding: CardLayout.padding,
    borderWidth: 1,
    borderColor: Palette.line,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Palette.teal },
  optional: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textSecondary,
  },
  rpeLabel: { fontSize: 15, fontWeight: '600', color: Palette.teal },
  note: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Palette.teal,
    textAlignVertical: 'top',
  },
  error: { fontSize: 14, color: '#B42318' },
  button: { backgroundColor: Palette.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Palette.meadow },
});
