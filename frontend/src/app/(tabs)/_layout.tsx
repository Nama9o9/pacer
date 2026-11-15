import { Tabs } from 'expo-router/js-tabs';

import { PacerTabBar } from '@/components/navigation/PacerTabBar';

/** Hauptbereich nach dem Onboarding: drei Tabs mit eigener Tab-Leiste */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PacerTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Heute' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
