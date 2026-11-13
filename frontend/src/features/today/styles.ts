import { StyleSheet } from 'react-native';

import { CardLayout, Palette } from '@/constants/theme';

/** Gemeinsame Styles der Karten auf „Heute“ */
export const todayStyles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: CardLayout.radius,
    padding: CardLayout.padding,
    borderWidth: 1,
    borderColor: Palette.line,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textSecondary,
  },
  title: { fontSize: 20, fontWeight: '700', color: Palette.teal },
  body: { fontSize: 15, lineHeight: 22, color: Palette.textSecondary },
});
