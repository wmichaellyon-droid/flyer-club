import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { EVENT_KIND_FILTERS, EVENT_SUBCATEGORIES_BY_KIND, EXPLORE_FILTERS } from '../mockData';
import { milesBetweenPoints, milesFromUserToEvent } from '../geo';
import { theme } from '../theme';
import {
  EventItem,
  EventKind,
  InteractionMap,
  IntentState,
  RadiusFilter,
  UserLocation,
  UserSetup,
} from '../types';

interface MapScreenProps {
  events: EventItem[];
  interactions: InteractionMap;
  user: UserSetup;
  userLocation: UserLocation;
  radiusFilter: RadiusFilter;
  onChangeRadius: (radius: RadiusFilter) => void;
  onOpenEvent: (eventId: string) => void;
  onToggleInterested: (eventId: string) => void;
  onSetGoing: (eventId: string) => void;
  onUpdateUserLocation: (coords: UserLocation) => void;
  onShareEvent: (event: EventItem, destination: 'native' | 'sms') => Promise<void>;
  onGetTickets: (event: EventItem) => Promise<void>;
}

interface EventWithDistance {
  event: EventItem;
  distanceMiles: number;
}

const DEFAULT_DELTA = 0.085;
const radiusOptions: RadiusFilter[] = [2, 5, 10, 'city'];

const KIND_CONFIG: Record<EventKind, { color: string; label: string }> = {
  concert: { color: '#35A7FF', label: 'Concert' },
  film: { color: '#F6AE2D', label: 'Film' },
  meetup: { color: '#3AC47D', label: 'Meetup' },
  comedy: { color: '#FF6B6B', label: 'Comedy' },
  arts: { color: '#D66BFF', label: 'Arts' },
};

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
  if (intent === 'saved') {
    return 'Saved';
  }
  return 'Not set';
}

export function MapScreen({
  events,
  interactions,
  user,
  userLocation,
  radiusFilter,
  onChangeRadius,
  onOpenEvent,
  onToggleInterested,
  onSetGoing,
  onUpdateUserLocation,
  onShareEvent,
  onGetTickets,
}: MapScreenProps) {
  const [activeChip, setActiveChip] = useState('Tonight');
  const [selectedKind, setSelectedKind] = useState<'all' | EventKind>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [queryCenter, setQueryCenter] = useState<UserLocation>(userLocation);
  const [region, setRegion] = useState<Region>({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  });
  const [findingLocation, setFindingLocation] = useState(false);

  useEffect(() => {
    setRegion((prev) => ({
      ...prev,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    }));
    setQueryCenter(userLocation);
  }, [userLocation.latitude, userLocation.longitude]);

  const availableSubcategories = useMemo(
    () => (selectedKind === 'all' ? [] : EVENT_SUBCATEGORIES_BY_KIND[selectedKind]),
    [selectedKind],
  );

  const needsSearch = useMemo(() => {
    return (
      milesBetweenPoints(queryCenter, {
        latitude: region.latitude,
        longitude: region.longitude,
      }) > 0.35
    );
  }, [queryCenter, region.latitude, region.longitude]);

  const filteredEvents = useMemo<EventWithDistance[]>(() => {
    const radiusMiles = radiusFilter === 'city' ? Infinity : radiusFilter;
    return events
      .filter((event) => filterByChip(event, activeChip))
      .filter((event) => (selectedKind === 'all' ? true : event.kind === selectedKind))
      .filter((event) => (selectedSubcategory === 'all' ? true : event.subcategory === selectedSubcategory))
      .map((event) => ({
        event,
        distanceMiles: milesFromUserToEvent(queryCenter, event),
      }))
      .filter((item) => item.distanceMiles <= radiusMiles)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
  }, [events, activeChip, selectedKind, selectedSubcategory, queryCenter, radiusFilter]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((item) => item.event.id === selectedEventId) ?? null,
    [filteredEvents, selectedEventId],
  );

  const onRecenter = async () => {
    setFindingLocation(true);
    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      let granted = currentPermission.status === 'granted';

      if (!granted) {
        const request = await Location.requestForegroundPermissionsAsync();
        granted = request.status === 'granted';
      }

      if (!granted) {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextLocation: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      onUpdateUserLocation(nextLocation);
      setQueryCenter(nextLocation);
      setRegion((prev) => ({
        ...prev,
        latitude: nextLocation.latitude,
        longitude: nextLocation.longitude,
      }));
      setSelectedEventId(null);
    } finally {
      setFindingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <Text style={styles.headerSub}>Satellite view near {user.city} with live event pins.</Text>
      </View>

      <View style={styles.filterWrap}>
        <View style={styles.chipRow}>
          {radiusOptions.map((option) => {
            const active = option === radiusFilter;
            const label = option === 'city' ? 'Citywide' : `${option} mi`;
            return (
              <Pressable
                key={String(option)}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  onChangeRadius(option);
                  setSelectedEventId(null);
                }}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

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
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, selectedSubcategory === 'all' && styles.chipActive]}
              onPress={() => {
                setSelectedSubcategory('all');
                setSelectedEventId(null);
              }}
            >
              <Text style={[styles.chipLabel, selectedSubcategory === 'all' && styles.chipLabelActive]}>
                All
              </Text>
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
        )}
      </View>

      <View style={styles.mapStage}>
        <MapView
          style={StyleSheet.absoluteFill}
          mapType="satellite"
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
        >
          {filteredEvents.map((item) => (
            <Marker
              key={item.event.id}
              coordinate={{
                latitude: item.event.latitude,
                longitude: item.event.longitude,
              }}
              pinColor={KIND_CONFIG[item.event.kind].color}
              onPress={() => setSelectedEventId(item.event.id)}
            />
          ))}
        </MapView>

        {needsSearch && (
          <Pressable
            style={styles.searchAreaBtn}
            onPress={() => {
              setQueryCenter({
                latitude: region.latitude,
                longitude: region.longitude,
              });
              setSelectedEventId(null);
            }}
          >
            <Text style={styles.searchAreaLabel}>Search this area</Text>
          </Pressable>
        )}

        <Pressable style={styles.recenterBtn} onPress={onRecenter} disabled={findingLocation}>
          {findingLocation ? (
            <ActivityIndicator color={theme.text} size="small" />
          ) : (
            <Text style={styles.recenterLabel}>My Location</Text>
          )}
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

      {selectedEvent ? (
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{selectedEvent.event.title}</Text>
          <Text style={styles.eventMeta}>
            {selectedEvent.event.dateLabel} | {selectedEvent.event.timeLabel}
          </Text>
          <Text style={styles.eventMeta}>
            {selectedEvent.event.venue} | {selectedEvent.distanceMiles.toFixed(1)} mi away
          </Text>
          <Text style={styles.eventMeta}>
            {KIND_CONFIG[selectedEvent.event.kind].label} | {selectedEvent.event.subcategory}
          </Text>
          <Text style={styles.eventIntent}>Current: {intentLabel(interactions[selectedEvent.event.id])}</Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => onSetGoing(selectedEvent.event.id)}
              style={[styles.actionBtn, styles.actionBtnPrimary]}
            >
              <Text style={styles.actionBtnPrimaryLabel}>Going</Text>
            </Pressable>
            <Pressable onPress={() => onToggleInterested(selectedEvent.event.id)} style={styles.actionBtn}>
              <Text style={styles.actionBtnLabel}>Interested</Text>
            </Pressable>
            <Pressable onPress={() => void onShareEvent(selectedEvent.event, 'native')} style={styles.actionBtn}>
              <Text style={styles.actionBtnLabel}>Share</Text>
            </Pressable>
            <Pressable onPress={() => void onShareEvent(selectedEvent.event, 'sms')} style={styles.actionBtn}>
              <Text style={styles.actionBtnLabel}>Text</Text>
            </Pressable>
            <Pressable onPress={() => void onGetTickets(selectedEvent.event)} style={styles.actionBtn}>
              <Text style={styles.actionBtnLabel}>Get Tickets</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => onOpenEvent(selectedEvent.event.id)} style={styles.openEventBtn}>
            <Text style={styles.openEventLabel}>Open full event page</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateLabel}>Tap a pin to preview an event.</Text>
        </View>
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
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 2,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 26,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.textMuted,
    fontSize: 12,
  },
  filterWrap: {
    paddingHorizontal: 10,
    gap: 6,
    marginTop: 8,
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
  mapStage: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff2f',
    minHeight: 300,
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
    minWidth: 106,
    alignItems: 'center',
    backgroundColor: '#170d22db',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff3b',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 10,
    marginTop: 8,
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
  eventCard: {
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 12,
    gap: 5,
  },
  eventTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
  },
  eventMeta: {
    color: theme.textMuted,
    fontSize: 12,
  },
  eventIntent: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },
  actionBtn: {
    minWidth: '31%',
    borderWidth: 1,
    borderColor: '#ffffff30',
    backgroundColor: '#ffffff10',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  actionBtnLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnPrimaryLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '800',
  },
  openEventBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openEventLabel: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyStateLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
