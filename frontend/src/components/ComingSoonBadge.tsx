import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

/** Kleines Abzeichen für Funktionen, die noch nicht angebunden sind */
export function ComingSoonBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Bald verfügbar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Palette.sky,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: { fontSize: 11, fontWeight: '600', color: Palette.teal },
});
