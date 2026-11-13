import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

import { todayStyles } from './styles';

/** Platzhalter für den KI-Coach, ohne Funktion bis Meilenstein 2 */
export function CoachCard() {
  return (
    <View style={[todayStyles.card, styles.card]}>
      <Text style={[todayStyles.label, styles.text]}>Coach</Text>
      <Text style={[todayStyles.body, styles.text]}>Dein Coach kommt in Meilenstein 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Palette.sky, borderColor: Palette.sky },
  text: { color: Palette.teal },
});
