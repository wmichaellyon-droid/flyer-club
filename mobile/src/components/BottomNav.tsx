import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TabKey } from '../types';
import { theme } from '../theme';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: TabKey[] = ['Feed', 'Explore', 'Upload', 'Profile'];

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
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: theme.primary,
  },
  tabLabel: {
    color: theme.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  tabLabelActive: {
    color: theme.text,
  },
});
