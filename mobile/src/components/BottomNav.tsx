import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemePalette, useAppTheme, useThemeMode } from '../theme';
import { TabKey } from '../types';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: TabKey[] = ['Feed', 'Map', 'Explore', 'Messages', 'Upload', 'Profile'];

const tabIcons: Record<TabKey, string> = {
  Feed: '🏠',
  Map: '🗺️',
  Explore: '🧭',
  Messages: '💬',
  Upload: '➕',
  Profile: '👤',
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const theme = useAppTheme();
  const mode = useThemeMode();
  const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityLabel={tab}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tabIcons[tab]}</Text>
            <View style={[styles.tabDot, active && styles.tabDotActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: ThemePalette, mode: 'dark' | 'light') =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: mode === 'dark' ? '#0a1218f0' : '#f7fbff',
      borderTopWidth: 1,
      borderColor: mode === 'dark' ? '#ffffff22' : '#c6d5e2',
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 999,
      alignItems: 'center',
      marginHorizontal: 2,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    tabActive: {
      backgroundColor: mode === 'dark' ? '#ffffff12' : '#0f223012',
      borderColor: mode === 'dark' ? '#ffffff35' : '#0f22303f',
    },
    tabIcon: {
      fontSize: 20,
      opacity: 0.78,
    },
    tabIconActive: {
      opacity: 1,
    },
    tabDot: {
      width: 4,
      height: 4,
      borderRadius: 999,
      marginTop: 2,
      backgroundColor: mode === 'dark' ? '#6f8796' : '#7a8f9b',
    },
    tabDotActive: {
      backgroundColor: theme.primary,
    },
  });
