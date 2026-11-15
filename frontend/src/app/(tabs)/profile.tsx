import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { CardLayout, MaxContentWidth, Palette } from '@/constants/theme';
import { DisabledAction } from '@/features/profile/DisabledAction';
import { DisabledSwitchRow } from '@/features/profile/DisabledSwitchRow';
import { InfoRow } from '@/features/profile/InfoRow';
import { useProfile } from '@/features/profile/useProfile';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { daysUntil, formatCountdown, parseIsoDate } from '@/utils/today';
import { calculatePace, distanceLabel, formatDuration, formatGermanDate, formatPace } from '@/utils/validation';

/**
 * Profil: Konto, Ziel, Verknüpfungen, Datenschutz.
 * E-Mail und Abmelden sind echt, der Rest kommt vorerst aus useProfile (Mock).
 */
export default function ProfileScreen() {
  const { session } = useAuth();
  const { goal, settings } = useProfile();
  const raceDate = parseIsoDate(goal.race_date);

  return (
    // Unten kein Safe-Area-Abstand: Die Tab-Leiste liegt darunter und übernimmt den Rand
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <Card title="Konto">
          <InfoRow label="E-Mail" value={session?.user.email ?? '–'} />
          {/* Nach signOut() leitet das Root-Layout automatisch zum Login */}
          <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()} accessibilityRole="button">
            <Text style={styles.signOutText}>Abmelden</Text>
          </Pressable>
        </Card>

        <Card title="Mein Ziel">
          <InfoRow label="Distanz" value={distanceLabel(goal.distance_m)} />
          <InfoRow label="Zielzeit" value={formatDuration(goal.target_time_s)} />
          <InfoRow label="Wettkampf" value={formatGermanDate(raceDate)} />
          <InfoRow
            label="Zielpace"
            value={`${formatPace(calculatePace(goal.distance_m, goal.target_time_s))} min/km`}
          />
          <Text style={styles.countdown}>{formatCountdown(daysUntil(raceDate, new Date()))}</Text>
          <DisabledAction label="Ziel bearbeiten" />
        </Card>

        <Card title="Verknüpfungen">
          <InfoRow label="Strava" value={settings.strava_connected ? 'Verbunden' : 'Nicht verbunden'} />
          <DisabledAction label="Mit Strava verbinden" />
        </Card>

        <Card title="Daten & Datenschutz">
          <DisabledSwitchRow
            label="Coach darf sich an frühere Gespräche erinnern"
            value={settings.coach_memory_consent}
          />
          <View style={styles.divider} />
          <DisabledAction label="Meine gespeicherten Daten ansehen" />
          <DisabledAction label="Alle Daten löschen" variant="danger" />
        </Card>

        <Text style={styles.disclaimer}>
          Pacer ersetzt keine medizinische Beratung. Bei Schmerzen oder Beschwerden wende dich an eine
          Ärztin oder einen Arzt.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.mist },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: CardLayout.padding,
    gap: CardLayout.gap,
  },
  title: { fontSize: 28, fontWeight: '700', color: Palette.teal, marginTop: 8 },
  signOut: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.teal,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: Palette.teal },
  countdown: { fontSize: 15, fontWeight: '600', color: Palette.teal },
  divider: { height: 1, backgroundColor: Palette.line },
  disclaimer: { fontSize: 12, lineHeight: 18, color: Palette.textSecondary, textAlign: 'center', marginTop: 8 },
});
