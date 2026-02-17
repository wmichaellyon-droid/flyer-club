import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
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
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
}: {
  event: EventItem;
  intent: IntentState;
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

  return (
    <Pressable onPress={onCardTap} style={[styles.card, { backgroundColor: event.heroColor }]}>
      <View style={styles.cardOverlay}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{event.category}</Text>
          <Text style={styles.badgeMuted}>{event.ageRating}</Text>
        </View>

        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardMeta}>{event.promoter}</Text>

        <View style={styles.localRow}>
          <Text style={styles.localBadge}>{event.tags[0] ?? 'Soon'}</Text>
          <Text style={styles.localBadge}>{event.distanceMiles.toFixed(1)} mi</Text>
          <Text style={styles.localBadge}>{event.neighborhood}</Text>
        </View>

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
        </View>

        <Text style={styles.intentText}>Current: {intentLabel(intent)}</Text>
      </View>
    </Pressable>
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
  const feedRows = useMemo(() => {
    const rows: FeedRow[] = [];
    for (let chunk = 0; chunk < chunkCount; chunk += 1) {
      rows.push(...buildFeedChunk(events, chunk));
    }
    return rows;
  }, [events, chunkCount]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <Text style={styles.headerSub}>Trending in {user.city}</Text>
      </View>

      <FlatList
        data={feedRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={350}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (events.length > 0) {
            setChunkCount((prev) => prev + 1);
          }
        }}
        ListFooterComponent={<Text style={styles.footerText}>Loading more flyers...</Text>}
        renderItem={({ item }) => (
          <FeedCard
            event={item.event}
            intent={interactions[item.event.id]}
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
    paddingHorizontal: 12,
    gap: 14,
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  },
  card: {
    height: 330,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: '#00000050',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: theme.primary,
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
    backgroundColor: '#ffffff20',
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 27,
  },
  cardMeta: {
    color: '#f2e9ffcc',
    fontSize: 13,
    fontWeight: '600',
  },
  localRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  localBadge: {
    backgroundColor: '#ffffff15',
    borderColor: '#ffffff25',
    borderWidth: 1,
    borderRadius: 999,
    color: theme.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    overflow: 'hidden',
  },
  socialProof: {
    color: '#f8efffcc',
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#ffffff17',
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff30',
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
});
