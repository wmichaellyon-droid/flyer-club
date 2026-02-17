import { Linking, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { EventItem, IntentState } from '../types';

interface EventDetailScreenProps {
  event: EventItem;
  intent: IntentState;
  onBack: () => void;
  onToggleInterested: () => void;
  onSetGoing: () => void;
}

export function EventDetailScreen({
  event,
  intent,
  onBack,
  onToggleInterested,
  onSetGoing,
}: EventDetailScreenProps) {
  const onShare = async () => {
    await Share.share({
      message: `${event.title} at ${event.venue}.`,
      url: event.ticketUrl,
    });
  };

  const onGetTickets = async () => {
    await Linking.openURL(event.ticketUrl);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.hero, { backgroundColor: event.heroColor }]}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnLabel}>Back</Text>
          </Pressable>
          <View style={styles.heroContent}>
            <Text style={styles.heroCategory}>{event.category}</Text>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroPromoter}>{event.promoter}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event Info</Text>
          <Text style={styles.detailText}>{event.dateLabel}</Text>
          <Text style={styles.detailMuted}>{event.timeLabel}</Text>
          <Text style={styles.detailText}>{event.venue}</Text>
          <Text style={styles.detailMuted}>{event.address}</Text>
          <Text style={styles.detailMuted}>{event.neighborhood}</Text>
        </View>

        <View style={styles.rowActions}>
          <Pressable onPress={onSetGoing} style={[styles.actionBtn, styles.actionPrimary]}>
            <Text style={styles.actionPrimaryLabel}>Going</Text>
          </Pressable>
          <Pressable onPress={onToggleInterested} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Interested</Text>
          </Pressable>
          <Pressable onPress={onShare} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Share</Text>
          </Pressable>
        </View>

        <Text style={styles.intentStatus}>Current intent: {intent ?? 'none'}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
          <View style={styles.tagRow}>
            {event.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.stickyBar}>
        <View>
          <Text style={styles.priceLabel}>Starting at</Text>
          <Text style={styles.price}>{event.priceLabel}</Text>
        </View>
        <Pressable style={styles.ticketBtn} onPress={onGetTickets}>
          <Text style={styles.ticketBtnLabel}>Get Tickets</Text>
        </Pressable>
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
    paddingBottom: 100,
    gap: 12,
  },
  hero: {
    padding: 16,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#00000042',
    borderColor: '#ffffff44',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 12,
  },
  heroContent: {
    gap: 6,
  },
  heroCategory: {
    color: theme.text,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: theme.text,
    fontSize: 32,
    fontWeight: '800',
  },
  heroPromoter: {
    color: '#f3e9ffcc',
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  sectionTitle: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  detailText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detailMuted: {
    color: theme.textMuted,
    fontSize: 13,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 999,
    borderColor: theme.border,
    borderWidth: 1,
    backgroundColor: theme.surfaceAlt,
  },
  actionPrimary: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  actionLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 12,
  },
  actionPrimaryLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 12,
  },
  intentStatus: {
    color: theme.textMuted,
    fontSize: 12,
    marginHorizontal: 14,
  },
  description: {
    color: theme.textMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    color: theme.text,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#180d24f2',
    borderTopWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: theme.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  price: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 18,
  },
  ticketBtn: {
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ticketBtnLabel: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 14,
  },
});
