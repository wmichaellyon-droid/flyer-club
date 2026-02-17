import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { theme } from '../theme';
import { EventItem, IntentState, ReportReason } from '../types';

interface EventDetailScreenProps {
  event: EventItem;
  intent: IntentState;
  onBack: () => void;
  onOpenEntity: (entityId: string) => void;
  onToggleInterested: () => void;
  onSetGoing: () => void;
  onMessageFlyer: () => void;
  onShareEvent: (destination: 'native' | 'sms') => Promise<void>;
  onGetTickets: () => Promise<void>;
  onAddToCalendar: () => Promise<void>;
  onReportEvent: (reason: ReportReason, details: string) => Promise<void>;
  onBlockOrganizer: () => Promise<void>;
}

const reportReasons: { id: ReportReason; label: string }[] = [
  { id: 'scam_or_fraud', label: 'Scam/Fraud' },
  { id: 'wrong_details', label: 'Wrong details' },
  { id: 'harassment_or_hate', label: 'Harassment/Hate' },
  { id: 'spam', label: 'Spam' },
  { id: 'other', label: 'Other' },
];

export function EventDetailScreen({
  event,
  intent,
  onBack,
  onOpenEntity,
  onToggleInterested,
  onSetGoing,
  onMessageFlyer,
  onShareEvent,
  onGetTickets,
  onAddToCalendar,
  onReportEvent,
  onBlockOrganizer,
}: EventDetailScreenProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('wrong_details');
  const [reportDetails, setReportDetails] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'sent' | 'error'>('idle');
  const [actionBusy, setActionBusy] = useState(false);

  const submitReport = async () => {
    setActionBusy(true);
    try {
      await onReportEvent(selectedReason, reportDetails.trim());
      setReportState('sent');
      setReportDetails('');
    } catch {
      setReportState('error');
    } finally {
      setActionBusy(false);
    }
  };

  const blockOrganizer = async () => {
    setActionBusy(true);
    try {
      await onBlockOrganizer();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnLabel}>Back</Text>
          </Pressable>
          <Text style={styles.topBarMeta}>
            {event.category} / {event.subcategory}
          </Text>
        </View>

        <ImageBackground
          source={{ uri: event.flyerImageUrl }}
          resizeMode="cover"
          style={[styles.hero, { backgroundColor: event.heroColor }]}
          imageStyle={styles.heroImage}
        />

        <View style={styles.card}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.detailMuted}>{event.promoter}</Text>
          <Text style={styles.detailMuted}>
            {event.dateLabel} - {event.timeLabel}
          </Text>
          <View style={styles.modeRow}>
            <Text style={styles.modeChip}>Discover</Text>
            <Text style={styles.modeChip}>Commit</Text>
            <Text style={styles.modeChip}>Coordinate</Text>
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
          <Pressable onPress={onMessageFlyer} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>DM Flyer</Text>
          </Pressable>
          <Pressable onPress={() => void onShareEvent('native')} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Share</Text>
          </Pressable>
          <Pressable onPress={() => void onShareEvent('sms')} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Text</Text>
          </Pressable>
          <Pressable onPress={() => void onAddToCalendar()} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Add Calendar</Text>
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

        {event.flyerTags.some((tag) => tag.isPublic) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tagged on Flyer</Text>
            <View style={styles.taggedEntityRow}>
              {event.flyerTags
                .filter((tag) => tag.isPublic)
                .map((tag) => (
                  <Pressable
                    key={`tag_profile_${tag.id}`}
                    style={styles.taggedEntityChip}
                    onPress={() => onOpenEntity(tag.entityId)}
                  >
                    <Text style={styles.taggedEntityLabel}>
                      {tag.entityName} ({tag.entityKind})
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Safety</Text>
          <Text style={styles.safetyHint}>Report bad events or block organizers to keep your feed clean.</Text>

          <View style={styles.reasonRow}>
            {reportReasons.map((reason) => {
              const active = selectedReason === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  onPress={() => setSelectedReason(reason.id)}
                  style={[styles.reasonChip, active && styles.reasonChipActive]}
                >
                  <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]}>{reason.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.reportInput}
            value={reportDetails}
            onChangeText={setReportDetails}
            placeholder="Optional details"
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <View style={styles.safetyActionRow}>
            <Pressable
              onPress={() => void submitReport()}
              disabled={actionBusy}
              style={[styles.safetyBtn, styles.reportBtn]}
            >
              <Text style={styles.safetyBtnLabel}>Report Event</Text>
            </Pressable>
            <Pressable
              onPress={() => void blockOrganizer()}
              disabled={actionBusy}
              style={[styles.safetyBtn, styles.blockBtn]}
            >
              <Text style={styles.safetyBtnLabel}>Block Organizer</Text>
            </Pressable>
          </View>

          {reportState === 'sent' && <Text style={styles.reportSent}>Thanks. Report submitted.</Text>}
          {reportState === 'error' && <Text style={styles.reportError}>Could not submit report.</Text>}
        </View>
      </ScrollView>

      <View style={styles.stickyBar}>
        <View>
          <Text style={styles.priceLabel}>Starting at</Text>
          <Text style={styles.price}>{event.priceLabel}</Text>
        </View>
        <Pressable style={styles.ticketBtn} onPress={() => void onGetTickets()}>
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
    paddingBottom: 120,
    gap: 12,
  },
  topBar: {
    marginTop: 8,
    marginHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarMeta: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hero: {
    marginHorizontal: 12,
    minHeight: 520,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    backgroundColor: '#ffffff10',
    borderColor: '#ffffff35',
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
  card: {
    marginHorizontal: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    gap: 6,
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
  eventTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  modeChip: {
    borderWidth: 1,
    borderColor: '#ffffff2f',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: theme.text,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#ffffff0d',
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  actionBtn: {
    width: '48%',
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
  taggedEntityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  taggedEntityChip: {
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: '#ffffff10',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  taggedEntityLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  safetyHint: {
    color: theme.textMuted,
    fontSize: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reasonChipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  reasonLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  reasonLabelActive: {
    color: theme.text,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surfaceAlt,
    color: theme.text,
    minHeight: 70,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
    fontSize: 12,
  },
  safetyActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  safetyBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  reportBtn: {
    backgroundColor: '#c43f47',
  },
  blockBtn: {
    backgroundColor: '#474a61',
  },
  safetyBtnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  reportSent: {
    color: '#74d38d',
    fontSize: 12,
    fontWeight: '600',
  },
  reportError: {
    color: '#f47373',
    fontSize: 12,
    fontWeight: '600',
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
