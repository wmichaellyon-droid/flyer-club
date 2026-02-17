import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { EventItem, InteractionMap, IntentFilter, UserRole, UserSetup } from '../types';

interface ProfileScreenProps {
  user: UserSetup;
  events: EventItem[];
  interactions: InteractionMap;
  onOpenEvent: (eventId: string) => void;
  onSetIntent: (eventId: string, intent: 'interested' | 'going' | 'saved' | undefined) => void;
}

const tabs: IntentFilter[] = ['Interested', 'Going', 'Saved'];
const promoterTools = ['Create Event', 'Manage Flyers', 'Audience Insights', 'Ticket Link Settings'];

function roleLabel(role: UserRole) {
  if (role === 'concert_lover') {
    return 'Concert Lover';
  }
  if (role === 'promoter') {
    return 'Promoter';
  }
  return 'Event Enjoyer';
}

function handleFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
  return slug.length > 0 ? `@${slug}` : '@profile';
}

export function ProfileScreen({ user, events, interactions, onOpenEvent, onSetIntent }: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<IntentFilter>('Interested');
  const isPromoter = user.role === 'promoter';

  const filteredEvents = useMemo(() => {
    const expectedState = activeTab.toLowerCase();
    return events.filter((event) => interactions[event.id] === expectedState);
  }, [activeTab, events, interactions]);

  const interestedCount = Object.values(interactions).filter((state) => state === 'interested').length;
  const goingCount = Object.values(interactions).filter((state) => state === 'going').length;
  const savedCount = Object.values(interactions).filter((state) => state === 'saved').length;
  const promoterEventCount = Math.max(3, Math.floor(events.length / 2));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.identityRow}>
          {user.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {(user.profileName.trim()[0] ?? 'U').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.handle}>{handleFromName(user.profileName)}</Text>
            <Text style={styles.city}>{user.city}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
        <Text style={styles.roleBadge}>{roleLabel(user.role)}</Text>
        <Text style={styles.communityHint}>Community posting is open to everyone in Upload.</Text>

        {isPromoter ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{promoterEventCount}</Text>
                <Text style={styles.statLabel}>Published</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{interestedCount + goingCount}</Text>
                <Text style={styles.statLabel}>Intent Hits</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{Math.max(1, Math.floor(goingCount / 2))}</Text>
                <Text style={styles.statLabel}>Live Drafts</Text>
              </View>
            </View>

            <View style={styles.promoterToolGrid}>
              {promoterTools.map((tool) => (
                <Pressable key={tool} style={styles.promoterToolPill}>
                  <Text style={styles.promoterToolLabel}>{tool}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.promoterPanel}>
              <Text style={styles.promoterPanelTitle}>Promoter Queue</Text>
              <Text style={styles.promoterPanelText}>2 flyers in AI review, 1 draft missing venue details.</Text>
            </View>
            <Text style={styles.promoterBoostText}>Distribution boost active on newly approved flyers.</Text>
          </>
        ) : (
          <>
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
          </>
        )}
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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  identityText: {
    gap: 2,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: theme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
  },
  city: {
    color: theme.textMuted,
    fontSize: 12,
  },
  email: {
    color: theme.textMuted,
    fontSize: 11,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 999,
    color: theme.text,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    backgroundColor: theme.surfaceAlt,
  },
  communityHint: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
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
  promoterToolGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  promoterToolPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  promoterToolLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  promoterPanel: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  promoterPanelTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  promoterPanelText: {
    color: theme.textMuted,
    fontSize: 12,
  },
  promoterBoostText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
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
