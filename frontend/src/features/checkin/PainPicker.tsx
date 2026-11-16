import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { PAIN_LEVELS, painLocationLabel, setPainLevel, togglePainLocation } from '@/utils/pain';
import { PAIN_LOCATIONS, PAIN_WARNING_THRESHOLD, maxPainLevel, type PainEntry } from '@/utils/validation';

type PainPickerProps = {
  hasPain: boolean;
  pains: PainEntry[];
  onChange: (next: { hasPain: boolean; pains: PainEntry[] }) => void;
  error?: string;
};

/** Ja/Nein, betroffene Körperstellen und Stärke 0–10 je Stelle */
export function PainPicker({ hasPain, pains, onChange, error }: PainPickerProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.chipRow}>
        <Chip label="Nein" selected={!hasPain} onPress={() => onChange({ hasPain: false, pains })} wide />
        <Chip label="Ja" selected={hasPain} onPress={() => onChange({ hasPain: true, pains })} wide />
      </View>

      {hasPain && (
        <>
          <Text style={styles.hint}>Wo? (mehrere möglich)</Text>
          <View style={styles.chipRow}>
            {PAIN_LOCATIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={pains.some((pain) => pain.location === option.value)}
                onPress={() => onChange({ hasPain, pains: togglePainLocation(pains, option.value) })}
              />
            ))}
          </View>

          {pains.map((pain) => (
            <View key={pain.location} style={styles.levelBlock}>
              <Text style={styles.levelTitle}>{painLocationLabel(pain.location)}: Wie stark?</Text>
              <View style={styles.chipRow}>
                {PAIN_LEVELS.map((level) => (
                  <Chip
                    key={level}
                    label={String(level)}
                    selected={pain.level === level}
                    onPress={() => onChange({ hasPain, pains: setPainLevel(pains, pain.location, level) })}
                    compact
                  />
                ))}
              </View>
            </View>
          ))}
          {pains.length > 0 && <Text style={styles.hint}>0 = kaum spürbar, 10 = sehr stark</Text>}

          {/* Hinweis nach FA#0114, gleiche Schwelle wie im Onboarding */}
          {maxPainLevel(pains) >= PAIN_WARNING_THRESHOLD && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                Pacer ersetzt keine ärztliche Beratung. Bei stärkeren oder anhaltenden Schmerzen lass das bitte
                ärztlich abklären.
              </Text>
            </View>
          )}
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Zwei Knöpfe pro Reihe */
  wide?: boolean;
  /** Schmale Zahlenknöpfe */
  compact?: boolean;
};

function Chip({ label, selected, onPress, wide, compact }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, wide && styles.chipWide, compact && styles.chipCompact, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  chipWide: { flexBasis: '45%' },
  chipCompact: { flexBasis: '14%', paddingHorizontal: 0 },
  chipSelected: { backgroundColor: Palette.teal, borderColor: Palette.teal },
  chipText: { fontSize: 14, color: Palette.teal },
  chipTextSelected: { color: Palette.meadow, fontWeight: '600' },
  hint: { fontSize: 13, color: Palette.textSecondary },
  levelBlock: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: Palette.mist },
  levelTitle: { fontSize: 14, fontWeight: '600', color: Palette.teal },
  warning: { backgroundColor: Palette.amber, borderRadius: 12, padding: 12 },
  warningText: { fontSize: 14, lineHeight: 20, color: Palette.teal },
  error: { fontSize: 14, color: '#B42318' },
});
