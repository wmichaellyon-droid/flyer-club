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
          <View style={styles.flyerTint} />
          <View style={styles.flyerOverlay}>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{event.category}</Text>
              <Text style={styles.badgeMuted}>{event.ageRating}</Text>
            </View>

            <View style={styles.flyerContent}>
              <Text style={styles.flyerTitle}>{event.title}</Text>
              <Text style={styles.flyerMeta}>{event.promoter}</Text>
              <View style={styles.localRow}>
                <Text style={styles.localBadge}>{event.tags[0] ?? 'Soon'}</Text>
                <Text style={styles.localBadge}>{distanceMiles.toFixed(1)} mi</Text>
                <Text style={styles.localBadge}>{event.neighborhood}</Text>
              </View>
              <Text style={styles.flyerHint}>Double tap flyer for Interested</Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>{event.title}</Text>
        <Text style={styles.infoRole}>
          {event.postedByRole === 'promoter' ? 'Promoter post' : 'Community post'}
        </Text>
        <Text style={styles.infoSubcategory}>{event.subcategory}</Text>
        <Text style={styles.infoTime}>
          {event.dateLabel} - {event.timeLabel}
        </Text>
        <Text style={styles.infoVenue}>
          {event.venue} - {event.address}
        </Text>
        <Text style={styles.socialProof}>
          {event.friendGoing} friends going, {event.friendInterested} interested
        </Text>

        <View style={styles.actionRow}>
          <Pressable onPress={onSetGoing} style={[styles.actionBtn, styles.actionBtnPrimary]}>
            <Text style={styles.actionBtnPrimaryLabel}>Going</Text>
          </Pressable>
          <Pressable onPress={onToggleInterested} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Interested</Text>
          </Pressable>
          <Pressable onPress={() => void onShareEvent('native')} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Share</Text>
          </Pressable>
          <Pressable onPress={() => void onShareEvent('sms')} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Text</Text>
          </Pressable>
          <Pressable onPress={() => void onGetTickets()} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Get Tickets</Text>
          </Pressable>
        </View>

        <Text style={styles.intentText}>Current: {intentLabel(intent)}</Text>
        <Pressable onPress={onOpenEvent} style={styles.openBtn}>
          <Text style={styles.openBtnLabel}>Open full event page</Text>
        </Pressable>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home Feed</Text>
        <Text style={styles.headerSub}>Endless local flyers around {user.city}</Text>

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
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 6,
    gap: 6,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.textMuted,
    fontSize: 13,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusChip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  radiusChipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  radiusLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  radiusLabelActive: {
    color: theme.text,
  },
  listContent: {
    paddingBottom: 20,
    gap: 14,
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  },
  postWrap: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ffffff1a',
    backgroundColor: theme.surface,
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
  flyerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
  },
  flyerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  flyerContent: {
    gap: 10,
    paddingBottom: 14,
  },
  flyerTitle: {
    color: theme.text,
    fontWeight: '900',
    fontSize: 42,
    lineHeight: 46,
    maxWidth: '94%',
    textShadowColor: '#000000b8',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  flyerMeta: {
    color: '#fff6ffcc',
    fontSize: 13,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  badge: {
    backgroundColor: '#00000055',
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  badgeMuted: {
    backgroundColor: '#0000003d',
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  localRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  localBadge: {
    backgroundColor: '#00000038',
    borderColor: '#ffffff3b',
    borderWidth: 1,
    borderRadius: 999,
    color: theme.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    overflow: 'hidden',
  },
  flyerHint: {
    color: '#f8f0ffc0',
    fontSize: 12,
    fontWeight: '600',
  },
  infoPanel: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 7,
    backgroundColor: theme.surface,
  },
  infoTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
  },
  infoTime: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  infoRole: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  infoSubcategory: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoVenue: {
    color: theme.textMuted,
    fontSize: 12,
  },
  socialProof: {
    color: '#f8efffd4',
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    minWidth: '31%',
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
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnPrimaryLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  intentText: {
    color: '#f8efffb3',
    fontSize: 11,
    marginTop: 2,
  },
  openBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openBtnLabel: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
