import { StyleSheet, Switch, Text, View } from 'react-native';

import { ComingSoonBadge } from '@/components/ComingSoonBadge';
import { Palette } from '@/constants/theme';

type DisabledSwitchRowProps = {
  label: string;
  value: boolean;
};

/** Schalter für eine Einstellung, die noch nicht gespeichert werden kann */
export function DisabledSwitchRow({ label, value }: DisabledSwitchRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <ComingSoonBadge />
      </View>
      <Switch
        value={value}
        disabled
        trackColor={{ false: Palette.line, true: Palette.meadow }}
        accessibilityLabel={`${label}, bald verfügbar`}
        accessibilityState={{ disabled: true, checked: value }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: 0.5 },
  text: { flex: 1, gap: 6, alignItems: 'flex-start' },
  label: { fontSize: 15, color: Palette.teal },
});
