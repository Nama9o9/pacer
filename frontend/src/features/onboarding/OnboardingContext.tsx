import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Entwurf des Fragebogens. Liegt nur im Speicher der App,
 * bis am Ende complete_onboarding alles gemeinsam speichert.
 */
export type OnboardingDraft = {
  // Schritt 1: Ziel
  distanceM: number | null;
  targetTimeS: number;
  raceDate: Date | null;
  // Schritt 2: Basis
  runsPerWeek: number;
  kmPerWeek: number;
  longestRunKm: number;
  recent5kTimeS: number;
  runningSinceMonths: number | null;
  // Schritt 3: Trainingstage (1 = Montag … 7 = Sonntag)
  availableDays: number[];
  // Schritt 4: Beschwerden
  hasPain: boolean;
  painLocation: string | null;
  painLevel: number | null;
};

const initialDraft: OnboardingDraft = {
  distanceM: null,
  targetTimeS: 0,
  raceDate: null,
  runsPerWeek: 0,
  kmPerWeek: 0,
  longestRunKm: 0,
  recent5kTimeS: 0,
  runningSinceMonths: null,
  availableDays: [],
  hasPain: false,
  painLocation: null,
  painLevel: null,
};

type OnboardingContextValue = {
  draft: OnboardingDraft;
  updateDraft: (changes: Partial<OnboardingDraft>) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);

  function updateDraft(changes: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  return (
    <OnboardingContext.Provider value={{ draft, updateDraft }}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding muss innerhalb von OnboardingProvider verwendet werden');
  }
  return context;
}
