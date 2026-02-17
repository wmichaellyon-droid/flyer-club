import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { milesFromUserToEvent } from '../geo';
import { theme } from '../theme';
import { EventItem, InteractionMap, IntentState, RadiusFilter, UserLocation, UserSetup } from '../types';

interface FeedScreenProps {
  events: EventItem[];
  interactions: InteractionMap;
  user: UserSetup;
  userLocation: UserLocation;
  radiusFilter: RadiusFilter;
  onChangeRadius: (radius: RadiusFilter) => void;
  onOpenEvent: (eventId: string) => void;
  onToggleInterested: (eventId: string) => void;
  onSetGoing: (eventId: string) => void;
  onShareEvent: (event: EventItem, destination: 'native' | 'sms') => Promise<void>;
  onGetTickets: (event: EventItem) => Promise<void>;
  onFlyerImpression: (eventId: string) => void;
}

interface RankedEvent {
  event: EventItem;
  distanceMiles: number;
  rankScore: number;
}

interface FeedRow {
  id: string;
  rankedEvent: RankedEvent;
}

const radiusOptions: RadiusFilter[] = [2, 5, 10, 'city'];

function eventRankScore(event: EventItem, distanceMiles: number) {
  const promoterWeight = event.postedByRole === 'promoter' ? 0.25 : 0;
  const socialWeight = event.friendInterested * 0.02 + event.friendGoing * 0.03;
  const distanceWeight = Math.max(0, 0.45 - distanceMiles * 0.035);
  return promoterWeight + socialWeight + distanceWeight;
}

function buildFeedChunk(events: RankedEvent[], chunkIndex: number): FeedRow[] {
  if (events.length === 0) {
    return [];
  }

  const start = chunkIndex % events.length;
  return Array.from({ length: events.length }, (_, idx) => {
    const rankedEvent = events[(start + idx) % events.length];
    return {
      id: `${rankedEvent.event.id}__${chunkIndex}__${idx}`,
      rankedEvent,
    };
  });
}

function intentLabel(intent: IntentState) {
  if (intent === 'going') {
    return 'Going';
  }
  if (intent === 'interested') {
    return 'Interested';
  }
  if (intent === 'saved') {
    return 'Saved';
  }
  return 'Not set';
}

function socialHandleFromEvent(event: EventItem) {
  const base = event.postedByRole === 'promoter' ? event.promoter : `${event.promoter} crew`;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

function truncate(value: string, max: number) {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}...`;
}

function FeedCard({
  rankedEvent,
  intent,
  flyerHeight,
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
  onShareEvent,
  onGetTickets,
}: {
  rankedEvent: RankedEvent;
  intent: IntentState;
  flyerHeight: number;
  onOpenEvent: () => void;
  onToggleInterested: () => void;
  onSetGoing: () => void;
  onShareEvent: (destination: 'native' | 'sms') => Promise<void>;
  onGetTickets: () => Promise<void>;
}) {
  const { event, distanceMiles } = rankedEvent;
  const handle = socialHandleFromEvent(event);
  const lastTap = useRef<number>(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCardTap = () => {
    const now = Date.now();
    const delta = now - lastTap.current;

    if (delta < 250) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
      singleTapTimer.current = null;
      lastTap.current = 0;
      onToggleInterested();
      return;
    }

    lastTap.current = now;
    singleTapTimer.current = setTimeout(() => {
      onOpenEvent();
    }, 250);
  };

  return (
    <View style={styles.postWrap}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{handle.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerHandle}>@{handle}</Text>
          <Text style={styles.postHeaderSub}>
            {event.neighborhood} • {distanceMiles.toFixed(1)} mi away
          </Text>
        </View>
        <Pressable onPress={onOpenEvent} style={styles.openMoreBtn}>
          <Text style={styles.openMoreLabel}>Open</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onCardTap}
        style={[styles.flyerStage, { backgroundColor: event.heroColor, height: flyerHeight }]}
      >
        <ImageBackground
          source={{ uri: event.flyerImageUrl }}
          resizeMode="cover"
          style={styles.flyerImage}
          imageStyle={styles.flyerImageAsset}
        >
          <View style={styles.flyerTintTop} />
          <View style={styles.flyerTintBottom} />
          <View style={styles.flyerOverlay}>
            <Text style={styles.flyerHint}>Double tap to mark Interested</Text>
            <View style={styles.flyerContent}>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{event.category}</Text>
                <Text style={styles.badgeMuted}>{event.subcategory}</Text>
                <Text style={styles.badgeMuted}>{event.ageRating}</Text>
              </View>
              <Text style={styles.flyerTitle}>{event.title}</Text>
              <Text style={styles.flyerMeta}>
                {event.dateLabel} • {event.timeLabel}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      <View style={styles.infoPanel}>
        <View style={styles.actionRow}>
          <Pressable onPress={onToggleInterested} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Interested</Text>
          </Pressable>
          <Pressable onPress={onSetGoing} style={[styles.actionBtn, styles.actionBtnPrimary]}>
            <Text style={styles.actionBtnPrimaryLabel}>Going</Text>
          </Pressable>
          <Pressable onPress={() => void onShareEvent('native')} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Share</Text>
          </Pressable>
          <Pressable onPress={() => void onGetTickets()} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Tickets</Text>
          </Pressable>
        </View>

        <Text style={styles.socialProof}>
          {event.friendGoing} going • {event.friendInterested} interested
        </Text>
        <Text style={styles.captionLine} numberOfLines={2}>
          <Text style={styles.captionHandle}>@{handle} </Text>
          {truncate(event.description, 140)}
        </Text>
        <Text style={styles.infoVenue} numberOfLines={1}>
          {event.venue} • {event.address}
        </Text>
        <View style={styles.postFooterRow}>
          <Text style={styles.intentText}>Status: {intentLabel(intent)}</Text>
          <Pressable onPress={onOpenEvent}>
            <Text style={styles.openBtnLabel}>View details</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function FeedScreen({
  events,
  interactions,
  user,
  userLocation,
  radiusFilter,
  onChangeRadius,
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
  onShareEvent,
  onGetTickets,
  onFlyerImpression,
}: FeedScreenProps) {
  const [chunkCount, setChunkCount] = useState(3);
  const { width } = useWindowDimensions();
  const flyerHeight = Math.round(width * 1.25);
  const seenImpressions = useRef(new Set<string>());

  const rankedEvents = useMemo(() => {
    const withDistance = events.map((event) => {
      const distanceMiles = milesFromUserToEvent(userLocation, event);
      return {
        event,
        distanceMiles,
        rankScore: eventRankScore(event, distanceMiles),
      };
    });

    const radiusMiles = radiusFilter === 'city' ? Infinity : radiusFilter;
    const inRadius = withDistance.filter((item) => item.distanceMiles <= radiusMiles);
    const source = inRadius.length > 0 ? inRadius : withDistance;

    return source.sort((a, b) => {
      if (b.rankScore !== a.rankScore) {
        return b.rankScore - a.rankScore;
      }
      return a.distanceMiles - b.distanceMiles;
    });
  }, [events, userLocation, radiusFilter]);

  const feedRows = useMemo(() => {
    const rows: FeedRow[] = [];
    for (let chunk = 0; chunk < chunkCount; chunk += 1) {
      rows.push(...buildFeedChunk(rankedEvents, chunk));
    }
    return rows;
  }, [rankedEvents, chunkCount]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>For You</Text>
        <Text style={styles.headerSub}>Live flyers in {user.city}</Text>

        <View style={styles.radiusRow}>
          {radiusOptions.map((option) => {
            const active = option === radiusFilter;
            const label = option === 'city' ? 'Citywide' : `${option} mi`;
            return (
              <Pressable
                key={String(option)}
                onPress={() => onChangeRadius(option)}
                style={[styles.radiusChip, active && styles.radiusChipActive]}
              >
                <Text style={[styles.radiusLabel, active && styles.radiusLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={feedRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (rankedEvents.length > 0) {
            setChunkCount((prev) => prev + 1);
          }
        }}
        onViewableItemsChanged={({ viewableItems }) => {
          for (const item of viewableItems) {
            const row = item.item as FeedRow | undefined;
            if (!row) {
              continue;
            }
            const eventId = row.rankedEvent.event.id;
            if (seenImpressions.current.has(eventId)) {
              continue;
            }
            seenImpressions.current.add(eventId);
            onFlyerImpression(eventId);
          }
        }}
        ListFooterComponent={<Text style={styles.footerText}>Loading more flyers...</Text>}
        renderItem={({ item }) => (
          <FeedCard
            rankedEvent={item.rankedEvent}
            intent={interactions[item.rankedEvent.event.id]}
            flyerHeight={flyerHeight}
            onOpenEvent={() => onOpenEvent(item.rankedEvent.event.id)}
            onToggleInterested={() => onToggleInterested(item.rankedEvent.event.id)}
            onSetGoing={() => onSetGoing(item.rankedEvent.event.id)}
            onShareEvent={(destination) => onShareEvent(item.rankedEvent.event, destination)}
            onGetTickets={() => onGetTickets(item.rankedEvent.event)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
    gap: 6,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.textMuted,
    fontSize: 12,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 5,
  },
  radiusChip: {
    borderWidth: 1,
    borderColor: '#ffffff1f',
    backgroundColor: '#ffffff08',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  radiusChipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  radiusLabel: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  radiusLabelActive: {
    color: theme.text,
  },
  listContent: {
    paddingBottom: 20,
    gap: 8,
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  },
  postWrap: {
    overflow: 'visible',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ffffff1a',
    backgroundColor: '#0f0c14',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#2f2640',
    borderWidth: 1,
    borderColor: '#ffffff26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 12,
  },
  headerMeta: {
    flex: 1,
  },
  headerHandle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  postHeaderSub: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  openMoreBtn: {
    borderWidth: 1,
    borderColor: '#ffffff29',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff08',
  },
  openMoreLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  flyerStage: {
    width: '100%',
    justifyContent: 'space-between',
  },
  flyerImage: {
    flex: 1,
    width: '100%',
  },
  flyerImageAsset: {
    width: '100%',
    height: '100%',
  },
  flyerTintTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    backgroundColor: '#00000055',
  },
  flyerTintBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: '#00000077',
  },
  flyerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  flyerContent: {
    gap: 8,
    paddingBottom: 10,
  },
  flyerTitle: {
    color: theme.text,
    fontWeight: '900',
    fontSize: 36,
    lineHeight: 40,
    maxWidth: '94%',
    textShadowColor: '#000000b8',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  flyerMeta: {
    color: '#fff6ffcc',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#11111194',
    color: theme.text,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  badgeMuted: {
    backgroundColor: '#11111176',
    color: theme.text,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  flyerHint: {
    color: '#f8f0ffcd',
    fontSize: 11,
    fontWeight: '600',
    paddingTop: 2,
  },
  infoPanel: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#0f0c14',
  },
  infoVenue: {
    color: theme.textMuted,
    fontSize: 11,
  },
  socialProof: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  captionLine: {
    color: theme.text,
    fontSize: 12,
    lineHeight: 18,
  },
  captionHandle: {
    color: theme.text,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#ffffff0e',
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff24',
  },
  actionBtnPrimary: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  actionBtnLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnPrimaryLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  postFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  intentText: {
    color: '#f8efffb3',
    fontSize: 11,
  },
  openBtnLabel: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
