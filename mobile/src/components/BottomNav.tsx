import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TabKey } from '../types';
import { theme } from '../theme';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: TabKey[] = ['Feed', 'Map', 'Explore', 'Upload', 'Profile'];

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
          >
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
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
    backgroundColor: '#0f0c14',
    borderTopWidth: 1,
    borderColor: '#ffffff1c',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#ffffff0f',
    borderColor: '#ffffff2a',
  },
  tabLabel: {
    color: theme.textMuted,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: theme.text,
  },
});
