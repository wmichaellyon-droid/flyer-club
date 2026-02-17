import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Linking,
  PanResponder,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { EVENT_KIND_FILTERS, EVENT_SUBCATEGORIES_BY_KIND, EXPLORE_FILTERS } from '../mockData';
import { theme } from '../theme';
import { EventItem, EventKind, InteractionMap, IntentState, UserSetup } from '../types';

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

interface MapCenter {
  lat: number;
  lng: number;
}

const AUSTIN_CENTER: MapCenter = { lat: 30.2672, lng: -97.7431 };

const KIND_CONFIG: Record<EventKind, { color: string; label: string; glyph: string }> = {
  concert: { color: '#35A7FF', label: 'Concert', glyph: 'M' },
  film: { color: '#F6AE2D', label: 'Film', glyph: 'F' },
  meetup: { color: '#3AC47D', label: 'Meetup', glyph: 'G' },
  comedy: { color: '#FF6B6B', label: 'Comedy', glyph: 'C' },
  arts: { color: '#D66BFF', label: 'Arts', glyph: 'A' },
};

function eventRankScore(event: EventItem) {
  const promoterWeight = event.postedByRole === 'promoter' ? 0.25 : 0;
  const socialWeight = event.friendInterested * 0.02 + event.friendGoing * 0.03;
  const distanceWeight = Math.max(0, 0.4 - event.distanceMiles * 0.03);
  return promoterWeight + socialWeight + distanceWeight;
}

function milesBetween(a: MapCenter, b: MapCenter) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthMiles * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
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

function filterByChip(event: EventItem, chip: string) {
  if (chip === 'This Weekend') {
    return event.tags.includes('This Weekend');
  }
  if (chip === 'Tonight') {
    return event.tags.includes('Tonight');
  }
  if (chip === 'Free') {
    return event.priceLabel.toLowerCase().includes('free') || event.tags.includes('Free');
  }
  if (chip === 'All Ages') {
    return event.ageRating.toLowerCase().includes('all ages') || event.tags.includes('All Ages');
  }
  if (chip === 'DIY') {
    return event.tags.includes('DIY');
  }
  return true;
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
      <Pressable onPress={onCardTap} style={[styles.flyerStage, { backgroundColor: event.heroColor, height: flyerHeight }]}>
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
                <Text style={styles.localBadge}>{event.distanceMiles.toFixed(1)} mi</Text>
                <Text style={styles.localBadge}>{event.neighborhood}</Text>
              </View>
              <Text style={styles.flyerHint}>Double tap flyer for Interested</Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>{event.title}</Text>
        <Text style={styles.infoRole}>{event.postedByRole === 'promoter' ? 'Promoter post' : 'Community post'}</Text>
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

function MapHome({
  events,
  user,
  interactions,
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
}: {
  events: EventItem[];
  user: UserSetup;
  interactions: InteractionMap;
  onOpenEvent: (eventId: string) => void;
  onToggleInterested: (eventId: string) => void;
  onSetGoing: (eventId: string) => void;
}) {
  const { height } = useWindowDimensions();
  const mapHeight = Math.max(height * 0.56, 390);
  const [activeChip, setActiveChip] = useState('Tonight');
  const [selectedKind, setSelectedKind] = useState<'all' | EventKind>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [queryCenter, setQueryCenter] = useState<MapCenter>(AUSTIN_CENTER);
  const [viewCenter, setViewCenter] = useState<MapCenter>(AUSTIN_CENTER);
  const [needsSearch, setNeedsSearch] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [layout, setLayout] = useState({ width: 1, height: 1 });

  const pixelsPerDegreeLng = 2500;
  const pixelsPerDegreeLat = 3000;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
        onPanResponderGrant: () => {
          setDrag({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, gesture) => {
          setDrag({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          const moved = Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6;
          if (moved) {
            const deltaLng = -gesture.dx / pixelsPerDegreeLng;
            const deltaLat = gesture.dy / pixelsPerDegreeLat;
            setViewCenter((prev) => ({ lat: prev.lat + deltaLat, lng: prev.lng + deltaLng }));
            setNeedsSearch(true);
          }
          setDrag({ x: 0, y: 0 });
        },
      }),
    [],
  );

  const availableSubcategories = useMemo(
    () => (selectedKind === 'all' ? [] : EVENT_SUBCATEGORIES_BY_KIND[selectedKind]),
    [selectedKind],
  );

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => filterByChip(event, activeChip))
      .filter((event) => (selectedKind === 'all' ? true : event.kind === selectedKind))
      .filter((event) => (selectedSubcategory === 'all' ? true : event.subcategory === selectedSubcategory))
      .filter((event) => milesBetween(queryCenter, { lat: event.latitude, lng: event.longitude }) <= 10)
      .sort(
        (a, b) =>
          milesBetween(queryCenter, { lat: a.latitude, lng: a.longitude }) -
          milesBetween(queryCenter, { lat: b.latitude, lng: b.longitude }),
      );
  }, [events, activeChip, queryCenter, selectedKind, selectedSubcategory]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((event) => event.id === selectedEventId) ?? null,
    [filteredEvents, selectedEventId],
  );

  const onShare = async (event: EventItem) => {
    await Share.share({
      message: `${event.title} at ${event.venue} in ${event.neighborhood}.`,
      url: event.ticketUrl,
    });
  };

  const onGetTickets = async (event: EventItem) => {
    await Linking.openURL(event.ticketUrl);
  };

  return (
    <View style={styles.mapSection}>
      <Text style={styles.mapHeading}>Near You in {user.city}</Text>
      <Text style={styles.mapSub}>Drag around the city map and tap pins by event type.</Text>

      <View style={styles.chipRow}>
        {EXPLORE_FILTERS.map((chip) => {
          const active = chip === activeChip;
          return (
            <Pressable
              key={chip}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setActiveChip(chip);
                setSelectedEventId(null);
              }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{chip}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.filterLabelTitle}>Kind</Text>
      <View style={styles.chipRow}>
        {EVENT_KIND_FILTERS.map((kind) => {
          const active = kind.id === selectedKind;
          return (
            <Pressable
              key={kind.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setSelectedKind(kind.id);
                setSelectedSubcategory('all');
                setSelectedEventId(null);
              }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{kind.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedKind !== 'all' && (
        <>
          <Text style={styles.filterLabelTitle}>Subcategory</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, selectedSubcategory === 'all' && styles.chipActive]}
              onPress={() => {
                setSelectedSubcategory('all');
                setSelectedEventId(null);
              }}
            >
              <Text style={[styles.chipLabel, selectedSubcategory === 'all' && styles.chipLabelActive]}>All</Text>
            </Pressable>
            {availableSubcategories.map((subcategory) => {
              const active = subcategory === selectedSubcategory;
              return (
                <Pressable
                  key={subcategory}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setSelectedSubcategory(subcategory);
                    setSelectedEventId(null);
                  }}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{subcategory}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View
        style={[styles.mapBoard, { height: mapHeight }]}
        onLayout={(event) => {
          setLayout({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          });
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.mapBackdropA} />
        <View style={styles.mapBackdropB} />
        <View style={styles.mapRoadA} />
        <View style={styles.mapRoadB} />
        <View style={styles.mapRoadC} />

        {filteredEvents.map((event) => {
          const x =
            layout.width / 2 +
            (event.longitude - viewCenter.lng) * pixelsPerDegreeLng +
            drag.x;
          const y =
            layout.height / 2 -
            (event.latitude - viewCenter.lat) * pixelsPerDegreeLat +
            drag.y;

          if (x < -24 || x > layout.width + 24 || y < -24 || y > layout.height + 24) {
            return null;
          }

          const pin = KIND_CONFIG[event.kind];
          const active = selectedEventId === event.id;

          return (
            <Pressable
              key={event.id}
              onPress={() => setSelectedEventId(event.id)}
              style={[
                styles.pin,
                { left: x - 15, top: y - 30, backgroundColor: pin.color },
                active && styles.pinActive,
              ]}
            >
              <Text style={styles.pinGlyph}>{pin.glyph}</Text>
              <View style={[styles.pinTail, { backgroundColor: pin.color }]} />
            </Pressable>
          );
        })}

        <View style={styles.crosshair} />

        {needsSearch && (
          <Pressable
            style={styles.searchAreaBtn}
            onPress={() => {
              setQueryCenter(viewCenter);
              setNeedsSearch(false);
              setSelectedEventId(null);
            }}
          >
            <Text style={styles.searchAreaLabel}>Search this area</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.recenterBtn}
          onPress={() => {
            setViewCenter(AUSTIN_CENTER);
            setQueryCenter(AUSTIN_CENTER);
            setNeedsSearch(false);
            setSelectedEventId(null);
          }}
        >
          <Text style={styles.recenterLabel}>Recenter</Text>
        </Pressable>
      </View>

      <View style={styles.legendRow}>
        {(Object.keys(KIND_CONFIG) as EventKind[]).map((kind) => (
          <View key={kind} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: KIND_CONFIG[kind].color }]} />
            <Text style={styles.legendLabel}>{KIND_CONFIG[kind].label}</Text>
          </View>
        ))}
      </View>

      {selectedEvent && (
        <View style={styles.mapEventCard}>
          <Text style={styles.mapEventTitle}>{selectedEvent.title}</Text>
          <Text style={styles.mapEventMeta}>
            {selectedEvent.dateLabel} - {selectedEvent.neighborhood} - {selectedEvent.distanceMiles.toFixed(1)} mi
          </Text>
          <Text style={styles.mapEventMeta}>
            {KIND_CONFIG[selectedEvent.kind].label} - {selectedEvent.subcategory}
          </Text>
          <Text style={styles.mapEventMeta}>{selectedEvent.venue}</Text>
          <Text style={styles.mapEventIntent}>Current: {intentLabel(interactions[selectedEvent.id])}</Text>

          <View style={styles.mapEventActions}>
            <Pressable
              onPress={() => onSetGoing(selectedEvent.id)}
              style={[styles.mapActionBtn, styles.mapActionBtnPrimary]}
            >
              <Text style={styles.mapActionLabelPrimary}>Going</Text>
            </Pressable>
            <Pressable onPress={() => onToggleInterested(selectedEvent.id)} style={styles.mapActionBtn}>
              <Text style={styles.mapActionLabel}>Interested</Text>
            </Pressable>
            <Pressable onPress={() => onShare(selectedEvent)} style={styles.mapActionBtn}>
              <Text style={styles.mapActionLabel}>Share</Text>
            </Pressable>
            <Pressable onPress={() => onGetTickets(selectedEvent)} style={styles.mapActionBtn}>
              <Text style={styles.mapActionLabel}>Get Tickets</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => onOpenEvent(selectedEvent.id)} style={styles.mapOpenEventBtn}>
            <Text style={styles.mapOpenEventLabel}>Open full event page</Text>
          </Pressable>
        </View>
      )}
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
  const [mode, setMode] = useState<'map' | 'feed'>('map');
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
        <Text style={styles.headerTitle}>Home</Text>
        <Text style={styles.headerSub}>Map-first local discovery in {user.city}</Text>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('map')}
            style={[styles.modeBtn, mode === 'map' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeLabel, mode === 'map' && styles.modeLabelActive]}>Map</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('feed')}
            style={[styles.modeBtn, mode === 'feed' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeLabel, mode === 'feed' && styles.modeLabelActive]}>Flyer Feed</Text>
          </Pressable>
        </View>
      </View>

      {mode === 'map' ? (
        <MapHome
          events={events}
          user={user}
          interactions={interactions}
          onOpenEvent={onOpenEvent}
          onToggleInterested={onToggleInterested}
          onSetGoing={onSetGoing}
        />
      ) : (
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
      )}
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  modeBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modeBtnActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  modeLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modeLabelActive: {
    color: theme.text,
  },
  mapSection: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  mapHeading: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '800',
  },
  mapSub: {
    color: theme.textMuted,
    fontSize: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  chipLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipLabelActive: {
    color: theme.text,
  },
  filterLabelTitle: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  mapBoard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff28',
    overflow: 'hidden',
    backgroundColor: '#20122d',
  },
  mapBackdropA: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f1721',
  },
  mapBackdropB: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    backgroundColor: '#2f1a42',
    opacity: 0.45,
    transform: [{ rotate: '-12deg' }],
    left: '-10%',
    top: '-8%',
  },
  mapRoadA: {
    position: 'absolute',
    width: '130%',
    height: 2,
    backgroundColor: '#ffffff22',
    top: '36%',
    left: '-8%',
    transform: [{ rotate: '12deg' }],
  },
  mapRoadB: {
    position: 'absolute',
    width: '130%',
    height: 2,
    backgroundColor: '#ffffff20',
    top: '58%',
    left: '-10%',
    transform: [{ rotate: '-8deg' }],
  },
  mapRoadC: {
    position: 'absolute',
    width: 2,
    height: '120%',
    backgroundColor: '#ffffff1c',
    left: '52%',
    top: '-8%',
    transform: [{ rotate: '6deg' }],
  },
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffffd0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinActive: {
    transform: [{ scale: 1.12 }],
  },
  pinGlyph: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  pinTail: {
    position: 'absolute',
    width: 8,
    height: 8,
    bottom: -5,
    transform: [{ rotate: '45deg' }],
  },
  crosshair: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff90',
    left: '50%',
    top: '50%',
    marginLeft: -7,
    marginTop: -7,
    backgroundColor: '#ffffff20',
  },
  searchAreaBtn: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchAreaLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  recenterBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#160c24e0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff38',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  recenterLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  mapEventCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 12,
    gap: 5,
    marginTop: 4,
  },
  mapEventTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
  },
  mapEventMeta: {
    color: theme.textMuted,
    fontSize: 12,
  },
  mapEventIntent: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mapEventActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },
  mapActionBtn: {
    minWidth: '47%',
    borderWidth: 1,
    borderColor: '#ffffff30',
    backgroundColor: '#ffffff10',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mapActionBtnPrimary: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  mapActionLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  mapActionLabelPrimary: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '800',
  },
  mapOpenEventBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapOpenEventLabel: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
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
