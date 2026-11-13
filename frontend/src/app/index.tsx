import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/utils/supabase';

/**
 * Vorläufiger Startscreen für M1.
 * Wird durch den Screen „Heute“ ersetzt (geplante Einheit, Wochenübersicht, Coach).
 */
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedText type="title">Pacer</ThemedText>
          <ThemedText style={styles.subtitle}>
            Dein KI-Lauf-Coach. Hier entsteht der Screen „Heute“.
          </ThemedText>
        </ThemedView>

        {/* Vorläufig, bis die automatische Weiterleitung ins Onboarding steht */}
        <Link href="/onboarding/goal" asChild>
          <Pressable style={styles.button}>
            <ThemedText>Onboarding starten</ThemedText>
          </Pressable>
        </Link>

        {/* Vorläufiger Logout, zieht später in Profil/Einstellungen um.
            Nach signOut() leitet das Root-Layout automatisch zum Login. */}
        <Pressable onPress={() => supabase.auth.signOut()} style={styles.button}>
          <ThemedText>Abmelden</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});