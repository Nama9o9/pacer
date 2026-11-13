import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/features/onboarding/OnboardingContext';

// Die Gruppe hat kein index: Bei automatischer Weiterleitung ins Onboarding mit dem Ziel starten
export const unstable_settings = {
  initialRouteName: 'goal',
};

// Alle Schritte teilen sich denselben Entwurf
export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
