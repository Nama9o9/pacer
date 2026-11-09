import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { StepHeader } from '@/features/onboarding/StepHeader';
import { ChoiceChip } from '@/features/onboarding/ChoiceChip';
import { colors, onboardingStyles as s } from '@/features/onboarding/styles';
import {
  PAIN_LOCATIONS,
  PAIN_WARNING_THRESHOLD,
  maxPainLevel,
  validatePain,
  type BodyLocation,
  type PainEntry,
  type ValidationErrors,
} from '@/utils/validation';

const PAIN_LEVELS = Array.from({ length: 11 }, (_, i) => i); // 0 bis 10

/** Anzeigename einer Körperstelle */
function labelFor(location: BodyLocation): string {
  return PAIN_LOCATIONS.find((option) => option.value === location)?.label ?? location;
}

export default function PainScreen() {
  const { draft, updateDraft } = useOnboarding();

  const [hasPain, setHasPain] = useState(draft.hasPain);
  const [pains, setPains] = useState<PainEntry[]>(draft.pains);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /** Körperstelle hinzufügen oder entfernen, Reihenfolge wie in der Auswahl */
  function toggleLocation(location: BodyLocation) {
    setPains((current) => {
      if (current.some((pain) => pain.location === location)) {
        return current.filter((pain) => pain.location !== location);
      }
      const order = PAIN_LOCATIONS.map((option) => option.value as BodyLocation);
      return [...current, { location, level: null }].sort(
        (a, b) => order.indexOf(a.location) - order.indexOf(b.location),
      );
    });
  }

  function setLevel(location: BodyLocation, level: number) {
    setPains((current) =>
      current.map((pain) => (pain.location === location ? { ...pain, level } : pain)),
    );
  }

  function handleNext() {
    const newErrors = validatePain({ hasPain, pains });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Ohne Beschwerden keine Einträge speichern
    updateDraft({ hasPain, pains: hasPain ? pains : [] });
    router.push('/onboarding/summary');
  }

  const showWarning = hasPain && maxPainLevel(pains) >= PAIN_WARNING_THRESHOLD;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StepHeader
        step={4}
        title="Beschwerden"
        subtitle="Zwickt gerade etwas? Dann plant Pacer vorsichtiger."
      />

      <Text style={s.label}>Hast du aktuell Beschwerden?</Text>
      <View style={s.chipGrid}>
        <ChoiceChip label="Nein" selected={!hasPain} onPress={() => setHasPain(false)} />
        <ChoiceChip label="Ja" selected={hasPain} onPress={() => setHasPain(true)} />
      </View>

      {hasPain && (
        <>
          <Text style={s.label}>Wo? (mehrere möglich)</Text>
          <View style={s.chipGrid}>
            {PAIN_LOCATIONS.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                selected={pains.some((pain) => pain.location === option.value)}
                onPress={() => toggleLocation(option.value)}
                style={styles.locationChip}
              />
            ))}
          </View>
          {errors.pains && <Text style={s.error}>{errors.pains}</Text>}

          {/* Für jede gewählte Stelle eine eigene Stärke */}
          {pains.map((pain) => (
            <View key={pain.location} style={styles.levelBlock}>
              <Text style={styles.levelTitle}>{labelFor(pain.location)}: Wie stark?</Text>
              <View style={s.chipGrid}>
                {PAIN_LEVELS.map((value) => (
                  <ChoiceChip
                    key={value}
                    label={String(value)}
                    selected={pain.level === value}
                    onPress={() => setLevel(pain.location, value)}
                    style={styles.levelChip}
                  />
                ))}
              </View>
            </View>
          ))}
          {pains.length > 0 && <Text style={styles.note}>0 = kaum spürbar, 10 = sehr stark</Text>}
          {errors.levels && <Text style={s.error}>{errors.levels}</Text>}

          {/* Hinweis nach FA#0114, sobald eine Stelle die Schwelle erreicht */}
          {showWarning && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                Pacer ersetzt keine ärztliche Beratung. Bei stärkeren oder anhaltenden Schmerzen
                lass das bitte ärztlich abklären, bevor du dein Training steigerst.
              </Text>
            </View>
          )}
        </>
      )}

      <Pressable style={s.button} onPress={handleNext}>
        <Text style={s.buttonText}>Weiter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Drei Körperstellen pro Reihe
  locationChip: { flexBasis: '30%' },
  // Sechs Stufen pro Reihe
  levelChip: { flexBasis: '14%', paddingHorizontal: 0 },
  levelBlock: {
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  levelTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  note: { fontSize: 13, color: colors.subtle },
  warning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  warningText: { fontSize: 14, color: '#92400E', lineHeight: 20 },
});
