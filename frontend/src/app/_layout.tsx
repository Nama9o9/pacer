import { Stack } from 'expo-router';
import { RetryScreen } from '@/components/RetryScreen';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';

/**
 * Entscheidet anhand von Session und Zielstatus, welche Screens erreichbar sind:
 * ohne Login → Login/Registrierung, ohne aktives Ziel → Onboarding, sonst → Tabs mit „Heute“.
 * Ändert sich der Status, leitet Stack.Protected automatisch um.
 */
function RootNavigator() {
  const { session, isLoading, goalStatus, refreshGoalStatus } = useAuth();
  const isLoggedIn = !!session;

  // Solange Session oder Zielstatus laden, nichts anzeigen
  if (isLoading || (isLoggedIn && goalStatus === 'loading')) return null;

  if (isLoggedIn && goalStatus === 'error') {
    return <RetryScreen onRetry={refreshGoalStatus} />;
  }

  const hasGoal = goalStatus === 'active';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isLoggedIn && hasGoal}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn && !hasGoal}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
