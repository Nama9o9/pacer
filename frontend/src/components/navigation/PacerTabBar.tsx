import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';

const NAV_HEIGHT = 64;

type IconName = keyof typeof Ionicons.glyphMap;

type TabConfig = {
  /** Routenname in app/(tabs)/ */
  key: string;
  label: string;
  icon: IconName;
  iconActive: IconName;
};

/** Reihenfolge und Darstellung der Tabs; die Reihenfolge der Routen kommt aus (tabs)/_layout.tsx */
const TABS: TabConfig[] = [
  { key: 'index', label: 'Heute', icon: 'sunny-outline', iconActive: 'sunny' },
  { key: 'plan', label: 'Plan', icon: 'calendar-outline', iconActive: 'calendar' },
  { key: 'coach', label: 'Coach', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
  { key: 'history', label: 'Verlauf', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
];

/**
 * Eigene Tab-Leiste für das Tabs-Layout von Expo Router.
 * Der aktive Tab ergibt sich aus der Route (state.index), nicht aus eigenem State.
 * In Expo Router 58 heißen die Helfer emitter/navigateToTab statt navigation.emit/navigate.
 */
export function PacerTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { height: NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.key === route.name);
        if (!tab) return null;

        const isFocused = state.index === index;
        const color = isFocused ? Palette.teal : Palette.textSecondary;

        // Wie in der React-Navigation-Doku: erst das Event senden, damit Screens reagieren können
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        const onLongPress = () => {
          emitter.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.pill, isFocused && styles.pillActive]}>
              <Ionicons name={isFocused ? tab.iconActive : tab.icon} size={22} color={color} />
            </View>
            <Text style={[styles.label, { color }, isFocused && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { width: 44, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Palette.meadow },
  label: { fontSize: 12 },
  labelActive: { fontWeight: '700' },
});
