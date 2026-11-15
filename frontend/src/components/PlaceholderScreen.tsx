import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardLayout, Palette } from '@/constants/theme';

type PlaceholderScreenProps = {
  title: string;
  /** Zeigt „‹ Zurück“, für Screens außerhalb der Tabs */
  onBack?: () => void;
};

/** Platzhalter für Screens, die erst in Meilenstein 2 Inhalt bekommen */
export function PlaceholderScreen({ title, onBack }: PlaceholderScreenProps) {
  return (
    // In den Tabs übernimmt die Tab-Leiste den unteren Rand, sonst die Safe Area
    <SafeAreaView style={styles.safeArea} edges={onBack ? undefined : ['top', 'left', 'right']}>
      <View style={styles.content}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.back}>
            <Text style={styles.backText}>‹ Zurück</Text>
          </Pressable>
        )}
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
  back: { alignSelf: 'flex-start' },
  backText: { fontSize: 15, color: Palette.textSecondary },
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
