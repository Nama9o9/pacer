/** Farben, Schriften und Maße der App */

import '@/global.css';

import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Markenfarben von Pacer (vorerst nur heller Modus) */
export const Palette = {
  /** Teal Waters: Text, Primärbuttons, Hero-Karte */
  teal: '#204654',
  /** Spring Meadow: Akzent, aktive Zustände, Text auf Teal, Ampel „realistisch“ */
  meadow: '#CAFFA6',
  /** Glacial Sky: Coach, Hinweise */
  sky: '#A9E0F1',
  /** Morning Mist: Hintergrund */
  mist: '#F7F9E1',
  textSecondary: '#567377',
  line: '#E2E7D3',
  card: '#FFFFFF',
  /** Ampel „ambitioniert“ */
  amber: '#F6D58A',
  /** Ampel „unrealistisch“ */
  coral: '#F5BBA9',
} as const;

/** Einheitliche Maße für Karten */
export const CardLayout = {
  radius: 20,
  padding: 16,
  gap: 16,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
