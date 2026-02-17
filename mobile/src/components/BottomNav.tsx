import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TabKey } from '../types';
import { theme } from '../theme';

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

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0a1218f0',
    borderTopWidth: 1,
    borderColor: '#ffffff22',
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
    backgroundColor: '#ffffff12',
    borderColor: '#ffffff35',
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
    backgroundColor: '#6f8796',
  },
  tabDotActive: {
    backgroundColor: theme.primary,
  },
});
