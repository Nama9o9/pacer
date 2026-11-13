import { Tabs } from 'expo-router/js-tabs';

import { PacerTabBar } from '@/components/navigation/PacerTabBar';

/** Hauptbereich nach dem Onboarding: vier Tabs mit eigener Tab-Leiste */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PacerTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Heute' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
      <Tabs.Screen name="history" options={{ title: 'Verlauf' }} />
    </Tabs>
  );
}
