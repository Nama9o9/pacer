import { Pressable, StyleSheet, Text } from 'react-native';

import { ComingSoonBadge } from '@/components/ComingSoonBadge';
import { Palette } from '@/constants/theme';

type DisabledActionProps = {
  label: string;
  /** „danger“ für Warnaktionen wie Daten löschen */
  variant?: 'default' | 'danger';
};

/**
 * Geplante Aktion, die noch nicht angebunden ist: sichtbar, aber deaktiviert.
 * Bekommt später ein onPress und verliert dann Badge und disabled.
 */
export function DisabledAction({ label, variant = 'default' }: DisabledActionProps) {
  const isDanger = variant === 'danger';

  return (
    <Pressable
      style={[styles.button, isDanger && styles.danger]}
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`${label}, bald verfügbar`}
    >
      <Text style={styles.label}>{label}</Text>
      <ComingSoonBadge />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.teal,
    paddingVertical: 12,
    paddingHorizontal: 14,
    opacity: 0.5,
  },
  danger: { borderColor: Palette.coral, backgroundColor: Palette.coral },
  label: { fontSize: 15, fontWeight: '600', color: Palette.teal, flexShrink: 1 },
});
