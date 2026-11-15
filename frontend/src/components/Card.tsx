import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CardLayout, Palette } from '@/constants/theme';

type CardProps = {
  /** Kleine Überschrift in Großbuchstaben, z. B. „Mein Ziel“ */
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Weiße Karte im Pacer-Stil: Radius 20, Padding 16, feine Linie */
export function Card({ title, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: CardLayout.radius,
    padding: CardLayout.padding,
    borderWidth: 1,
    borderColor: Palette.line,
    gap: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textSecondary,
  },
});
