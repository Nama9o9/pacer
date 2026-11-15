import { router } from 'expo-router';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** Trainingsplan, wird aus „Heute“ geöffnet. Später inkl. Soll-Ist-Vergleich. */
export default function PlanScreen() {
  return <PlaceholderScreen title="Trainingsplan" onBack={() => router.back()} />;
}
