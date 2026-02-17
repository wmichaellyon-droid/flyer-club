import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useThemeMode } from '../theme';
import { TabKey } from '../types';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: TabKey[] = ['Feed', 'Map', 'Explore', 'Messages', 'Upload', 'Profile'];

const tabIcons: Record<TabKey, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  Feed: { active: 'home', idle: 'home-outline' },
  Map: { active: 'map', idle: 'map-outline' },
  Explore: { active: 'compass', idle: 'compass-outline' },
  Messages: { active: 'chatbubble-ellipses', idle: 'chatbubble-ellipses-outline' },
  Upload: { active: 'add-circle', idle: 'add-circle-outline' },
  Profile: { active: 'person-circle', idle: 'person-circle-outline' },
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const mode = useThemeMode();
  const styles = useMemo(() => createStyles(mode), [mode]);

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
            <Ionicons
              name={active ? tabIcons[tab].active : tabIcons[tab].idle}
              size={24}
              color={active ? styles.activeTint.color : styles.idleTint.color}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (mode: 'dark' | 'light') =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: mode === 'dark' ? '#0b0f13f2' : '#ffffff',
      borderTopWidth: 1,
      borderColor: mode === 'dark' ? '#ffffff1f' : '#d8e0e7',
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    tabActive: {
      transform: [{ translateY: -1 }],
    },
    activeTint: {
      color: mode === 'dark' ? '#f3f7fb' : '#0f141a',
    },
    idleTint: {
      color: mode === 'dark' ? '#99acbc' : '#718494',
    },
  });
