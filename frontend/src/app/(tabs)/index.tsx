import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RetryScreen } from '@/components/RetryScreen';
import { CardLayout, MaxContentWidth, Palette } from '@/constants/theme';
import { CoachCard } from '@/features/today/CoachCard';
import { GoalHeroCard } from '@/features/today/GoalHeroCard';
import { TodayCard } from '@/features/today/TodayCard';
import { useTodayData } from '@/features/today/useTodayData';
import { WeekStrip } from '@/features/today/WeekStrip';
import { supabase } from '@/utils/supabase';
import { assessGoal, buildWeek, formatLongDate, greetingFor, isTrainingDay } from '@/utils/today';

/**
 * Screen „Heute“: Ziel, heutiger Tag und Woche auf einen Blick.
 * Zeigt nur vorhandene Daten; der Trainingsplan folgt später.
 */
export default function TodayScreen() {
  const data = useTodayData();
  // Zeitpunkt einmal beim Öffnen festhalten, damit alle Karten denselben Tag nutzen
  const [now] = useState(() => new Date());

  if (data.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Palette.teal} />
      </View>
    );
  }

  if (data.status === 'error') {
    return <RetryScreen onRetry={data.reload} />;
  }

  if (data.status === 'missing') {
    return (
      <RetryScreen
        message="Dein Ziel oder deine Laufbasis wurde nicht gefunden."
        onRetry={data.reload}
      />
    );
  }

  const { goal, baseline } = data;

  return (
    // Unten kein Safe-Area-Abstand: Die Tab-Leiste liegt darunter und übernimmt den Rand
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{formatLongDate(now)}</Text>
            <Text style={styles.greeting}>{greetingFor(now)}</Text>
          </View>
          {/* Vorläufig hier, zieht später in Profil/Einstellungen um.
              Nach signOut() leitet das Root-Layout automatisch zum Login. */}
          <Pressable onPress={() => supabase.auth.signOut()} hitSlop={12} accessibilityRole="button">
            <Text style={styles.signOut}>Abmelden</Text>
          </Pressable>
        </View>

        <GoalHeroCard goal={goal} assessment={assessGoal(goal, baseline)} today={now} />
        <TodayCard isTrainingDay={isTrainingDay(now, baseline.available_days)} />
        <WeekStrip week={buildWeek(now, baseline.available_days)} />
        <CoachCard />

        <Text style={styles.disclaimer}>Pacer ersetzt keine ärztliche Beratung.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.mist },
  safeArea: { flex: 1, backgroundColor: Palette.mist },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: CardLayout.padding,
    gap: CardLayout.gap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  headerText: { gap: 2 },
  date: { fontSize: 14, color: Palette.textSecondary },
  greeting: { fontSize: 28, fontWeight: '700', color: Palette.teal },
  signOut: { fontSize: 14, color: Palette.textSecondary, paddingTop: 2 },
  disclaimer: { fontSize: 12, color: Palette.textSecondary, textAlign: 'center', marginTop: 8 },
});
