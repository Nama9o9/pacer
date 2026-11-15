import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardLayout, Palette } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';

/** Profil: Konto und Abmelden. Weitere Einstellungen folgen in Meilenstein 2. */
export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    // Unten kein Safe-Area-Abstand: Die Tab-Leiste liegt darunter und übernimmt den Rand
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Angemeldet als</Text>
          <Text style={styles.email}>{session?.user.email ?? '–'}</Text>
        </View>

        {/* Nach signOut() leitet das Root-Layout automatisch zum Login */}
        <Pressable style={styles.button} onPress={() => supabase.auth.signOut()} accessibilityRole="button">
          <Text style={styles.buttonText}>Abmelden</Text>
        </Pressable>

        <Text style={styles.hint}>
          Ziel bearbeiten, Strava-Verknüpfung und Datenverwaltung folgen in Meilenstein 2.
        </Text>
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
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textSecondary,
  },
  email: { fontSize: 16, fontWeight: '600', color: Palette.teal },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.teal,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: Palette.teal },
  hint: { fontSize: 14, lineHeight: 20, color: Palette.textSecondary },
});
