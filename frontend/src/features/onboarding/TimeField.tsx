import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, onboardingStyles } from './styles';

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
};

/** Zweistelliges Eingabefeld für Stunden, Minuten oder Sekunden */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  return (
    <View style={styles.field}>
      <TextInput
        style={[onboardingStyles.input, styles.input]}
        placeholder="00"
        keyboardType="number-pad"
        maxLength={2}
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, alignItems: 'center', gap: 4 },
  input: { alignSelf: 'stretch', textAlign: 'center', fontSize: 22 },
  label: { fontSize: 12, color: colors.subtle },
});
