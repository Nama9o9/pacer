import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardLayout, Palette } from '@/constants/theme';

type PlaceholderScreenProps = {
  title: string;
};

/** Platzhalter für Tabs, die erst in Meilenstein 2 Inhalt bekommen */
export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    // Unten kein Abstand nötig, den Rand übernimmt die Tab-Leiste
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.card}>
          <Text style={styles.text}>Kommt in Meilenstein 2.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.mist },
  content: { padding: CardLayout.padding, gap: CardLayout.gap },
  title: { fontSize: 28, fontWeight: '700', color: Palette.teal, marginTop: 8 },
  card: {
    backgroundColor: Palette.card,
    borderRadius: CardLayout.radius,
    padding: CardLayout.padding,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  text: { fontSize: 15, lineHeight: 22, color: Palette.textSecondary },
});
