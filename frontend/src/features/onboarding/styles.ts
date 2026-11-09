import { StyleSheet } from 'react-native';

// Farben vorerst hier, später aus der zentralen Theme-Datei
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1E3A8A',
  text: '#1E293B',
  muted: '#475569',
  subtle: '#64748B',
  border: '#CBD5E1',
  track: '#E2E8F0',
  error: '#B91C1C',
  background: '#FFFFFF',
};

/** Styles, die alle Onboarding-Schritte gemeinsam nutzen */
export const onboardingStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 12 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 14, color: colors.primary },
  error: { color: colors.error, fontSize: 14 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});