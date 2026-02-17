import { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { EVENT_KIND_FILTERS, EVENT_SUBCATEGORIES_BY_KIND, EXPLORE_FILTERS } from '../mockData';
import { milesFromUserToEvent } from '../geo';
import { theme } from '../theme';
import { EventItem, EventKind, RadiusFilter, UserLocation } from '../types';

interface ExploreScreenProps {
  events: EventItem[];
  userLocation: UserLocation;
  radiusFilter: RadiusFilter;
  onChangeRadius: (radius: RadiusFilter) => void;
  onOpenEvent: (eventId: string) => void;
}

const radiusOptions: RadiusFilter[] = [2, 5, 10, 'city'];

export function ExploreScreen({
  events,
  userLocation,
  radiusFilter,
  onChangeRadius,
  onOpenEvent,
}: ExploreScreenProps) {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('Tonight');
  const [selectedKind, setSelectedKind] = useState<'all' | EventKind>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const availableSubcategories = useMemo(
    () => (selectedKind === 'all' ? [] : EVENT_SUBCATEGORIES_BY_KIND[selectedKind]),
    [selectedKind],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const radiusMiles = radiusFilter === 'city' ? Infinity : radiusFilter;
    return events
      .map((event) => ({
        event,
        distanceMiles: milesFromUserToEvent(userLocation, event),
      }))
      .filter((item) => item.distanceMiles <= radiusMiles)
      .filter((item) => {
        const { event } = item;
        const matchesText =
          q.length === 0 ||
          event.title.toLowerCase().includes(q) ||
          event.venue.toLowerCase().includes(q) ||
          event.neighborhood.toLowerCase().includes(q);
        const matchesFilter = selectedFilter ? event.tags.includes(selectedFilter) : true;
        const matchesKind = selectedKind === 'all' ? true : event.kind === selectedKind;
        const matchesSubcategory =
          selectedSubcategory === 'all' ? true : event.subcategory === selectedSubcategory;
        return matchesText && matchesFilter && matchesKind && matchesSubcategory;
      })
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
  }, [events, query, selectedFilter, selectedKind, selectedSubcategory, userLocation, radiusFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <View style={styles.container}>
        <Text style={styles.title}>Explore</Text>
        <TextInput
          placeholder="Search nearby events"
          placeholderTextColor={theme.textMuted}
          style={styles.search}
          value={query}
          onChangeText={setQuery}
        />

        <View style={styles.filterRow}>
          {radiusOptions.map((option) => {
            const active = option === radiusFilter;
            const label = option === 'city' ? 'Citywide' : `${option} mi`;
            return (
              <Pressable
                key={String(option)}
                onPress={() => onChangeRadius(option)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filterRow}>
          {EXPLORE_FILTERS.map((filter) => {
            const active = filter === selectedFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.groupLabel}>Kind</Text>
        <View style={styles.filterRow}>
          {EVENT_KIND_FILTERS.map((kind) => {
            const active = kind.id === selectedKind;
            return (
              <Pressable
                key={kind.id}
                onPress={() => {
                  setSelectedKind(kind.id);
                  setSelectedSubcategory('all');
                }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{kind.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedKind !== 'all' && (
          <>
            <Text style={styles.groupLabel}>Subcategory</Text>
            <View style={styles.filterRow}>
              <Pressable
                onPress={() => setSelectedSubcategory('all')}
                style={[styles.filterChip, selectedSubcategory === 'all' && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, selectedSubcategory === 'all' && styles.filterLabelActive]}>
                  All
                </Text>
              </Pressable>
              {availableSubcategories.map((subcategory) => {
                const active = subcategory === selectedSubcategory;
                return (
                  <Pressable
                    key={subcategory}
                    onPress={() => setSelectedSubcategory(subcategory)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                      {subcategory}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.event.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No events match right now.</Text>
              <Text style={styles.emptySub}>Try another filter, radius, or search term.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.eventRow} onPress={() => onOpenEvent(item.event.id)}>
              <View>
                <Text style={styles.eventTitle}>{item.event.title}</Text>
                <Text style={styles.eventMeta}>
                  {item.event.dateLabel} - {item.event.neighborhood} - {item.distanceMiles.toFixed(1)} mi
                </Text>
                <Text style={styles.eventMeta}>{item.event.category} - {item.event.subcategory}</Text>
              </View>
              <Text style={styles.rowLink}>Open</Text>
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
    gap: 10,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  search: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: theme.text,
  },
  groupLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 22,
    gap: 8,
  },
  eventRow: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  eventMeta: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  rowLink: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyBox: {
    marginTop: 24,
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
