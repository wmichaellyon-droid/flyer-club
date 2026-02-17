import { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { EventItem, InteractionMap, IntentFilter, UserSetup } from '../types';

interface ProfileScreenProps {
  user: UserSetup;
  events: EventItem[];
  interactions: InteractionMap;
  onOpenEvent: (eventId: string) => void;
  onSetIntent: (eventId: string, intent: 'interested' | 'going' | 'saved' | undefined) => void;
}

const tabs: IntentFilter[] = ['Interested', 'Going', 'Saved'];

export function ProfileScreen({ user, events, interactions, onOpenEvent, onSetIntent }: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<IntentFilter>('Interested');

  const filteredEvents = useMemo(() => {
    const expectedState = activeTab.toLowerCase();
    return events.filter((event) => interactions[event.id] === expectedState);
  }, [activeTab, events, interactions]);

  const interestedCount = Object.values(interactions).filter((state) => state === 'interested').length;
  const goingCount = Object.values(interactions).filter((state) => state === 'going').length;
  const savedCount = Object.values(interactions).filter((state) => state === 'saved').length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.handle}>@austin.scenes</Text>
        <Text style={styles.city}>{user.city}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{interestedCount}</Text>
            <Text style={styles.statLabel}>Interested</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{goingCount}</Text>
            <Text style={styles.statLabel}>Going</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No events in {activeTab.toLowerCase()} yet.</Text>
              <Text style={styles.emptySub}>Use Feed or Explore to add events.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.eventRow} onPress={() => onOpenEvent(item.id)}>
              <View style={styles.eventMain}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>
                  {item.dateLabel} - {item.venue}
                </Text>
              </View>

              <View style={styles.eventActions}>
                <Pressable onPress={() => onSetIntent(item.id, 'going')} style={styles.pill}>
                  <Text style={styles.pillLabel}>Going</Text>
                </Pressable>
                <Pressable onPress={() => onSetIntent(item.id, 'saved')} style={styles.pill}>
                  <Text style={styles.pillLabel}>Save</Text>
                </Pressable>
                <Pressable onPress={() => onSetIntent(item.id, undefined)} style={styles.pillMuted}>
                  <Text style={styles.pillLabel}>Clear</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  handle: {
    color: theme.text,
    fontWeight: '700',
  },
  city: {
    color: theme.textMuted,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 16,
  },
  statLabel: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 999,
  },
  tabBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: theme.text,
  },
  listContent: {
    paddingBottom: 18,
    gap: 8,
    paddingTop: 2,
  },
  eventRow: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  eventMain: {
    gap: 3,
  },
  eventTitle: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  eventMeta: {
    color: theme.textMuted,
    fontSize: 12,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillMuted: {
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: theme.textMuted,
    fontSize: 12,
  },
});
