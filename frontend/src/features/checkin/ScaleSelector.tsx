import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

type ScaleSelectorProps = {
  /** Wird auch für die Bedienungshilfe genutzt, z. B. „Anstrengung“ */
  label: string;
  values: number[];
  selected: number | null;
  onSelect: (value: number) => void;
  /** Beschriftung unter dem kleinsten und größten Wert */
  minLabel: string;
  maxLabel: string;
};

/** Einzeilige Auswahl auf einer Zahlenskala, z. B. RPE 0–10 oder Stimmung 1–5 */
export function ScaleSelector({ label, values, selected, onSelect, minLabel, maxLabel }: ScaleSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {values.map((value) => {
          const isSelected = value === selected;
          return (
            <Pressable
              key={value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onSelect(value)}
              accessibilityRole="radio"
              accessibilityLabel={`${label} ${value}`}
              accessibilityState={{ selected: isSelected }}
              hitSlop={4}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{minLabel}</Text>
        <Text style={styles.legendText}>{maxLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: 'row', gap: 4 },
  option: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: Palette.teal, borderColor: Palette.teal },
  optionText: { fontSize: 15, fontWeight: '600', color: Palette.teal },
  optionTextSelected: { color: Palette.meadow },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendText: { fontSize: 12, color: Palette.textSecondary },
});
