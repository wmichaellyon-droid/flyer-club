import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { ThemePalette, useAppTheme } from '../theme';
import { EventItem, FollowRequest, InteractionMap, IntentFilter, UserRole, UserSetup } from '../types';

interface ProfileScreenProps {
  user: UserSetup;
  events: EventItem[];
  interactions: InteractionMap;
  followRequests: FollowRequest[];
  onOpenEvent: (eventId: string) => void;
  onSetIntent: (eventId: string, intent: 'interested' | 'going' | 'saved' | undefined) => void;
  onUpdateProfilePrivacy: (patch: {
    profileVisibility?: 'public' | 'private';
    showInterestedOnProfile?: boolean;
  }) => void;
  onUpdateThemeMode: (mode: 'light' | 'dark') => void;
  onSetInterestedVisibility: (eventId: string, visible: boolean) => void;
  onRespondFollowRequest: (requestId: string, action: 'approve' | 'decline') => void;
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

function dedupeEvents(source: EventItem[]) {
  const map = new Map<string, EventItem>();
  for (const item of source) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export function ProfileScreen({
  user,
  events,
  interactions,
  followRequests,
  onOpenEvent,
  onSetIntent,
  onUpdateProfilePrivacy,
  onUpdateThemeMode,
  onSetInterestedVisibility,
  onRespondFollowRequest,
}: ProfileScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<IntentFilter>('Interested');
  const isPromoter = user.role === 'promoter';

  const interestedEvents = useMemo(
    () => events.filter((event) => interactions[event.id] === 'interested'),
    [events, interactions],
  );
  const goingEvents = useMemo(
    () => events.filter((event) => interactions[event.id] === 'going'),
    [events, interactions],
  );
  const savedEvents = useMemo(
    () => events.filter((event) => interactions[event.id] === 'saved'),
    [events, interactions],
  );

  const filteredEvents = useMemo(() => {
    if (activeTab === 'Interested') {
      return interestedEvents;
    }
    if (activeTab === 'Going') {
      return goingEvents;
    }
    return savedEvents;
  }, [activeTab, interestedEvents, goingEvents, savedEvents]);

  const publicInterestedSet = useMemo(() => new Set(user.publicInterestedEventIds), [user.publicInterestedEventIds]);
  const publicInterestedEvents = useMemo(
    () =>
      user.showInterestedOnProfile
        ? interestedEvents.filter((event) => publicInterestedSet.has(event.id))
        : [],
    [interestedEvents, publicInterestedSet, user.showInterestedOnProfile],
  );
  const publicProfileEvents = useMemo(
    () => dedupeEvents([...goingEvents, ...publicInterestedEvents]),
    [goingEvents, publicInterestedEvents],
  );

  const interestedCount = interestedEvents.length;
  const goingCount = goingEvents.length;
  const savedCount = savedEvents.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.identityRow}>
          {user.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{(user.profileName.trim()[0] ?? 'U').toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.handle}>{handleFromName(user.profileName)}</Text>
            <Text style={styles.city}>{user.city}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
        <Text style={styles.roleBadge}>{roleLabel(user.role)}</Text>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Profile Privacy</Text>
          <Text style={styles.privacyHint}>
            Going events always show on profile. Interested events are optional and controllable.
          </Text>
          <View style={styles.privacyRow}>
            <Pressable
              onPress={() => onUpdateThemeMode('dark')}
              style={[styles.privacyToggle, user.themeMode === 'dark' && styles.privacyToggleActive]}
            >
              <Text
                style={[
                  styles.privacyToggleLabel,
                  user.themeMode === 'dark' && styles.privacyToggleLabelActive,
                ]}
              >
                Dark Mode
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onUpdateThemeMode('light')}
              style={[styles.privacyToggle, user.themeMode === 'light' && styles.privacyToggleActive]}
            >
              <Text
                style={[
                  styles.privacyToggleLabel,
                  user.themeMode === 'light' && styles.privacyToggleLabelActive,
                ]}
              >
                Light Mode
              </Text>
            </Pressable>
          </View>
          <View style={styles.privacyRow}>
            <Pressable
              onPress={() => onUpdateProfilePrivacy({ profileVisibility: 'public' })}
              style={[styles.privacyToggle, user.profileVisibility === 'public' && styles.privacyToggleActive]}
            >
              <Text
                style={[
                  styles.privacyToggleLabel,
                  user.profileVisibility === 'public' && styles.privacyToggleLabelActive,
                ]}
              >
                Public Profile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onUpdateProfilePrivacy({ profileVisibility: 'private' })}
              style={[styles.privacyToggle, user.profileVisibility === 'private' && styles.privacyToggleActive]}
            >
              <Text
                style={[
                  styles.privacyToggleLabel,
                  user.profileVisibility === 'private' && styles.privacyToggleLabelActive,
                ]}
              >
                Private Profile
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() =>
              onUpdateProfilePrivacy({
                showInterestedOnProfile: !user.showInterestedOnProfile,
              })
            }
            style={[styles.interestedToggle, user.showInterestedOnProfile && styles.interestedToggleActive]}
          >
            <Text style={[styles.interestedToggleLabel, user.showInterestedOnProfile && styles.interestedToggleLabelActive]}>
              {user.showInterestedOnProfile
                ? 'Interested events visible on profile'
                : 'Interested events hidden on profile'}
            </Text>
          </Pressable>
        </View>

        {user.profileVisibility === 'private' && (
          <View style={styles.followCard}>
            <Text style={styles.privacyTitle}>Follow Requests</Text>
            {followRequests.length === 0 && <Text style={styles.emptySub}>No pending requests.</Text>}
            {followRequests.map((request) => (
              <View key={request.id} style={styles.followRow}>
                <View style={styles.followMain}>
                  <Text style={styles.followName}>{request.requesterName}</Text>
                  <Text style={styles.followHandle}>{request.requesterHandle}</Text>
                </View>
                <View style={styles.followActions}>
                  <Pressable
                    style={[styles.followBtn, styles.followApprove]}
                    onPress={() => onRespondFollowRequest(request.id, 'approve')}
                  >
                    <Text style={styles.followBtnLabel}>Allow</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.followBtn, styles.followDecline]}
                    onPress={() => onRespondFollowRequest(request.id, 'decline')}
                  >
                    <Text style={styles.followBtnLabel}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

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
            <Text style={styles.statValue}>{publicProfileEvents.length}</Text>
            <Text style={styles.statLabel}>Public Flyers</Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Public Profile Preview</Text>
          <Text style={styles.previewSub}>
            {user.profileVisibility === 'private' ? 'Visible to approved followers only.' : 'Visible to everyone.'}
          </Text>
          <Text style={styles.previewCount}>Flyers visible: {publicProfileEvents.length}</Text>
        </View>

        {isPromoter && (
          <View style={styles.promoterToolGrid}>
            {promoterTools.map((tool) => (
              <Pressable key={tool} style={styles.promoterToolPill}>
                <Text style={styles.promoterToolLabel}>{tool}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabBtn, active && styles.tabBtnActive]}>
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
          renderItem={({ item }) => {
            const interestedPublic = user.publicInterestedEventIds.includes(item.id);
            const interestedLocked = !user.showInterestedOnProfile;

            return (
              <Pressable style={styles.eventRow} onPress={() => onOpenEvent(item.id)}>
                <View style={styles.eventMain}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventMeta}>
                    {item.dateLabel} - {item.venue}
                  </Text>
                </View>

                {activeTab === 'Interested' && (
                  <Pressable
                    onPress={() => {
                      if (!interestedLocked) {
                        onSetInterestedVisibility(item.id, !interestedPublic);
                      }
                    }}
                    style={[
                      styles.visibilityPill,
                      interestedPublic && !interestedLocked && styles.visibilityPillActive,
                      interestedLocked && styles.visibilityPillLocked,
                    ]}
                  >
                    <Text style={styles.visibilityPillLabel}>
                      {interestedLocked ? 'Hidden (global)' : interestedPublic ? 'Public' : 'Hidden'}
                    </Text>
                  </Pressable>
                )}

                {activeTab === 'Going' && (
                  <View style={[styles.visibilityPill, styles.visibilityPillGoing]}>
                    <Text style={styles.visibilityPillLabel}>Always Public</Text>
                  </View>
                )}

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
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
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
  privacyCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
    padding: 10,
    gap: 8,
    marginTop: 6,
  },
  privacyTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  privacyHint: {
    color: theme.textMuted,
    fontSize: 11,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  privacyToggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyToggleActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  privacyToggleLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  privacyToggleLabelActive: {
    color: theme.text,
  },
  interestedToggle: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    alignItems: 'center',
    paddingVertical: 8,
  },
  interestedToggleActive: {
    borderColor: theme.primary,
    backgroundColor: '#ffffff12',
  },
  interestedToggleLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  interestedToggleLabelActive: {
    color: theme.text,
  },
  followCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
    padding: 10,
    gap: 8,
    marginTop: 2,
  },
  followRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  followMain: {
    flex: 1,
  },
  followName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  followHandle: {
    color: theme.textMuted,
    fontSize: 11,
  },
  followActions: {
    flexDirection: 'row',
    gap: 6,
  },
  followBtn: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  followApprove: {
    backgroundColor: '#2f8f64',
  },
  followDecline: {
    backgroundColor: '#81434a',
  },
  followBtnLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
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
  previewCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
    padding: 10,
    gap: 3,
  },
  previewTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  previewSub: {
    color: theme.textMuted,
    fontSize: 11,
  },
  previewCount: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  promoterToolGrid: {
    marginTop: 4,
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
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
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
  visibilityPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  visibilityPillActive: {
    borderColor: theme.primary,
    backgroundColor: '#ffffff10',
  },
  visibilityPillLocked: {
    opacity: 0.7,
  },
  visibilityPillGoing: {
    borderColor: '#ffffff45',
    backgroundColor: '#ffffff0f',
  },
  visibilityPillLabel: {
    color: theme.text,
    fontSize: 10,
    fontWeight: '700',
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
