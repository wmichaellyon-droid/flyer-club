import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { EntityPageData } from '../types';

interface EntityProfileScreenProps {
  entityId: string;
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
  onLoadEntityPage: (entityId: string) => Promise<EntityPageData | null>;
}

export function EntityProfileScreen({
  entityId,
  onBack,
  onOpenEvent,
  onLoadEntityPage,
}: EntityProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<EntityPageData | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    onLoadEntityPage(entityId)
      .then((result) => {
        if (!active) {
          return;
        }
        setPageData(result);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [entityId, onLoadEntityPage]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading tagged profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pageData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnLabel}>Back</Text>
          </Pressable>
          <Text style={styles.emptyTitle}>Profile not available</Text>
          <Text style={styles.emptySub}>This tag is private or does not exist anymore.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sectionedData = [
    ...pageData.uploadedEvents.map((event) => ({ ...event, _section: 'uploaded' as const })),
    ...pageData.involvedEvents.map((event) => ({ ...event, _section: 'involved' as const })),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnLabel}>Back</Text>
        </Pressable>

        <Text style={styles.title}>{pageData.entity.name}</Text>
        <Text style={styles.sub}>
          @{pageData.entity.handle} - {pageData.entity.kind}
        </Text>
        <Text style={styles.sub}>
          {pageData.entity.isPublic ? 'Public profile' : 'Private profile'}
        </Text>
        {pageData.entity.bio ? <Text style={styles.bio}>{pageData.entity.bio}</Text> : null}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{pageData.uploadedEvents.length}</Text>
            <Text style={styles.statLabel}>Uploaded</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{pageData.involvedEvents.length}</Text>
            <Text style={styles.statLabel}>Tagged/Involved</Text>
          </View>
        </View>

        <FlatList
          data={sectionedData}
          keyExtractor={(item) => `${item._section}_${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No flyers yet</Text>
              <Text style={styles.emptySub}>This profile has no visible linked events.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpenEvent(item.id)} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>
                  {item.dateLabel} - {item.venue}
                </Text>
              </View>
              <Text style={styles.rowType}>
                {item._section === 'uploaded' ? 'Uploaded' : 'Involved'}
              </Text>
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.textMuted,
    fontSize: 13,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  sub: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    color: theme.text,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    gap: 8,
    paddingBottom: 20,
    paddingTop: 2,
  },
  row: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rowType: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
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
