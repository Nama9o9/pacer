import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from './styles';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Überschreibt z. B. die Breite, wenn mehr als zwei Knöpfe in eine Reihe sollen */
  style?: StyleProp<ViewStyle>;
};

/** Auswahlknopf für Distanz, Erfahrung, Wochentage und Körperstellen */
export function ChoiceChip({ label, selected, onPress, style }: ChoiceChipProps) {
  return (
    <Pressable
      style={[styles.chip, style, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 15, color: colors.text },
  textSelected: { color: '#FFFFFF', fontWeight: '600' },
});
