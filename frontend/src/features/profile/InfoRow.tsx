import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

type InfoRowProps = {
  label: string;
  value: string;
};

/** Zeile mit Bezeichnung links und Wert rechts */
export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  label: { fontSize: 15, color: Palette.textSecondary, flexShrink: 1 },
  value: { fontSize: 15, fontWeight: '600', color: Palette.teal, textAlign: 'right' },
});
