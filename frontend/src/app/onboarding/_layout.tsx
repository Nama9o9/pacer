import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/features/onboarding/OnboardingContext';

// Alle Schritte teilen sich denselben Entwurf
export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
