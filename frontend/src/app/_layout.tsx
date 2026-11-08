import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';

/**
 * Entscheidet anhand der Session, welche Screens erreichbar sind:
 * eingeloggt → Tabs, sonst → Login/Registrierung.
 */
function RootNavigator() {
  const { session, isLoading } = useAuth();

  // Solange die gespeicherte Session geladen wird, nichts anzeigen
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
     <Stack.Protected guard={!!session}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
     <Stack.Screen name="onboarding" />
    </Stack.Protected>
      <Stack.Protected guard={!session}>
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
