import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { theme } from '../theme';
import { EventItem, InteractionMap, IntentState, UserSetup } from '../types';

interface FeedScreenProps {
  events: EventItem[];
  interactions: InteractionMap;
  user: UserSetup;
  onOpenEvent: (eventId: string) => void;
  onToggleInterested: (eventId: string) => void;
  onSetGoing: (eventId: string) => void;
}

interface FeedRow {
  id: string;
  event: EventItem;
}

function eventRankScore(event: EventItem) {
  const promoterWeight = event.postedByRole === 'promoter' ? 0.25 : 0;
  const socialWeight = event.friendInterested * 0.02 + event.friendGoing * 0.03;
  const distanceWeight = Math.max(0, 0.4 - event.distanceMiles * 0.03);
  return promoterWeight + socialWeight + distanceWeight;
}

function buildFeedChunk(events: EventItem[], chunkIndex: number): FeedRow[] {
  if (events.length === 0) {
    return [];
  }

  const start = chunkIndex % events.length;
  return Array.from({ length: events.length }, (_, idx) => {
    const event = events[(start + idx) % events.length];
    return {
      id: `${event.id}__${chunkIndex}__${idx}`,
      event,
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
  return 'Not set';
}

function FeedCard({
  event,
  intent,
  flyerHeight,
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
}: {
  event: EventItem;
  intent: IntentState;
  flyerHeight: number;
  onOpenEvent: () => void;
  onToggleInterested: () => void;
  onSetGoing: () => void;
}) {
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

  const onShare = async () => {
    await Share.share({
      message: `${event.title} at ${event.venue} in ${event.neighborhood}.`,
      url: event.ticketUrl,
    });
  };

  const onGetTickets = async () => {
    await Linking.openURL(event.ticketUrl);
  };

  return (
    <View style={styles.postWrap}>
      <Pressable
        onPress={onCardTap}
        style={[styles.flyerStage, { backgroundColor: event.heroColor, height: flyerHeight }]}
      >
        <View style={styles.flyerGrainA} />
        <View style={styles.flyerGrainB} />
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
              <Text style={styles.localBadge}>{event.distanceMiles.toFixed(1)} mi</Text>
              <Text style={styles.localBadge}>{event.neighborhood}</Text>
            </View>
            <Text style={styles.flyerHint}>Double tap flyer for Interested</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>{event.title}</Text>
        <Text style={styles.infoRole}>
          {event.postedByRole === 'promoter' ? 'Promoter post' : 'Community post'}
        </Text>
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
          <Pressable onPress={onShare} style={styles.actionBtn}>
            <Text style={styles.actionBtnLabel}>Share</Text>
          </Pressable>
          <Pressable onPress={onGetTickets} style={styles.actionBtn}>
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
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
}: FeedScreenProps) {
  const [chunkCount, setChunkCount] = useState(3);
  const { height } = useWindowDimensions();
  const flyerHeight = Math.max(height - 220, 460);
  const rankedEvents = useMemo(
    () => [...events].sort((a, b) => eventRankScore(b) - eventRankScore(a)),
    [events],
  );
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
        <Text style={styles.headerTitle}>Flyer Stream</Text>
        <Text style={styles.headerSub}>Indie events across {user.city}</Text>
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
        ListFooterComponent={<Text style={styles.footerText}>Loading more flyers...</Text>}
        renderItem={({ item }) => (
          <FeedCard
            event={item.event}
            intent={interactions[item.event.id]}
            flyerHeight={flyerHeight}
            onOpenEvent={() => onOpenEvent(item.event.id)}
            onToggleInterested={() => onToggleInterested(item.event.id)}
            onSetGoing={() => onSetGoing(item.event.id)}
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
  },
  headerTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
    gap: 20,
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  },
  postWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff24',
    backgroundColor: theme.surface,
  },
  flyerStage: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  flyerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  flyerGrainA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -60,
    right: -30,
    backgroundColor: '#ffffff10',
  },
  flyerGrainB: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    bottom: 90,
    left: -80,
    backgroundColor: '#00000030',
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
    paddingHorizontal: 12,
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
    minWidth: '47%',
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
