import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EVENT_KIND_FILTERS, EVENT_SUBCATEGORIES_BY_KIND } from '../mockData';
import { theme } from '../theme';
import { combineDateAndTime, defaultEventEndIso } from '../time';
import { EventDraft, EventItem, EventKind, ModerationStatus, UserRole } from '../types';

interface UploadScreenProps {
  userRole: UserRole;
  submissions: EventItem[];
  onSubmitEvent: (draft: EventDraft) => Promise<{ moderationStatus: ModerationStatus; moderationReason: string }>;
  onModerateEvent: (eventId: string, status: ModerationStatus, reason: string) => Promise<void>;
}

const communityRules = [
  'Anyone can upload flyers',
  'Only flyer-format posts pass moderation',
  'Missing details get sent to review or rejected',
];

export function UploadScreen({ userRole, submissions, onSubmitEvent, onModerateEvent }: UploadScreenProps) {
  const [title, setTitle] = useState('');
  const [promoter, setPromoter] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Austin, TX');
  const [latitude, setLatitude] = useState('30.2672');
  const [longitude, setLongitude] = useState('-97.7431');
  const [category, setCategory] = useState('DIY');
  const [kind, setKind] = useState<EventKind>('meetup');
  const [subcategory, setSubcategory] = useState('Community');
  const [ageRating, setAgeRating] = useState('All Ages');
  const [priceLabel, setPriceLabel] = useState('Free');
  const [ticketUrl, setTicketUrl] = useState('https://');
  const [flyerImageUrl, setFlyerImageUrl] = useState('https://');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('Tonight,DIY');
  const [heroColor, setHeroColor] = useState('#3a1b53');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const isPromoter = userRole === 'promoter';

  const availableSubcategories = useMemo(() => EVENT_SUBCATEGORIES_BY_KIND[kind], [kind]);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 2 &&
      promoter.trim().length > 1 &&
      date.trim().length > 0 &&
      venue.trim().length > 1 &&
      address.trim().length > 4 &&
      flyerImageUrl.startsWith('http')
    );
  }, [title, promoter, date, venue, address, flyerImageUrl]);

  const resetForm = () => {
    setTitle('');
    setPromoter('');
    setDate('');
    setVenue('');
    setAddress('');
    setNeighborhood('');
    setDescription('');
  };

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    const startAtIso = combineDateAndTime(date, startTime);
    const endAtIso = combineDateAndTime(date, endTime) ?? (startAtIso ? defaultEventEndIso(startAtIso) : null);
    if (!startAtIso || !endAtIso) {
      setSubmitState('error');
      setSubmitMessage('Date/time is invalid. Use YYYY-MM-DD and 24h HH:MM format.');
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setSubmitState('error');
      setSubmitMessage('Latitude/longitude must be numeric.');
      return;
    }

    const draft: EventDraft = {
      title: title.trim(),
      promoter: promoter.trim(),
      startAtIso,
      endAtIso,
      venue: venue.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      latitude: lat,
      longitude: lng,
      category: category.trim(),
      kind,
      subcategory: subcategory.trim(),
      ageRating: ageRating.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      priceLabel: priceLabel.trim(),
      ticketUrl: ticketUrl.trim(),
      flyerImageUrl: flyerImageUrl.trim(),
      heroColor: heroColor.trim() || '#3a1b53',
      description: description.trim(),
    };

    setSubmitState('submitting');
    setSubmitMessage('');
    try {
      const result = await onSubmitEvent(draft);
      setSubmitState('done');
      setSubmitMessage(`Moderation: ${result.moderationStatus.toUpperCase()} - ${result.moderationReason}`);
      resetForm();
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Could not submit event.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Upload Event</Text>
        <Text style={styles.subtitle}>
          Community uploads are open to all users. Each flyer passes moderation before it appears in feeds.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Community Rules</Text>
          {communityRules.map((rule) => (
            <Text key={rule} style={styles.ruleItem}>
              - {rule}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Builder</Text>
          <TextInput
            style={styles.input}
            placeholder="Event title"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Organizer / promoter name"
            placeholderTextColor={theme.textMuted}
            value={promoter}
            onChangeText={setPromoter}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor={theme.textMuted}
            value={date}
            onChangeText={setDate}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Start (HH:MM)"
              placeholderTextColor={theme.textMuted}
              value={startTime}
              onChangeText={setStartTime}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="End (HH:MM)"
              placeholderTextColor={theme.textMuted}
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Venue"
            placeholderTextColor={theme.textMuted}
            value={venue}
            onChangeText={setVenue}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor={theme.textMuted}
            value={address}
            onChangeText={setAddress}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Neighborhood"
              placeholderTextColor={theme.textMuted}
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="City"
              placeholderTextColor={theme.textMuted}
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Latitude"
              placeholderTextColor={theme.textMuted}
              value={latitude}
              onChangeText={setLatitude}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Longitude"
              placeholderTextColor={theme.textMuted}
              value={longitude}
              onChangeText={setLongitude}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Category (DIY, Film, Nightlife...)"
            placeholderTextColor={theme.textMuted}
            value={category}
            onChangeText={setCategory}
          />

          <View style={styles.chips}>
            {EVENT_KIND_FILTERS.filter((item) => item.id !== 'all').map((item) => {
              const active = item.id === kind;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setKind(item.id as EventKind);
                    setSubcategory(EVENT_SUBCATEGORIES_BY_KIND[item.id as EventKind][0]);
                  }}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chips}>
            {availableSubcategories.map((value) => {
              const active = value === subcategory;
              return (
                <Pressable
                  key={value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSubcategory(value)}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Age rating"
              placeholderTextColor={theme.textMuted}
              value={ageRating}
              onChangeText={setAgeRating}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Price label"
              placeholderTextColor={theme.textMuted}
              value={priceLabel}
              onChangeText={setPriceLabel}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Tags (comma separated)"
            placeholderTextColor={theme.textMuted}
            value={tags}
            onChangeText={setTags}
          />
          <TextInput
            style={styles.input}
            placeholder="Ticket URL"
            placeholderTextColor={theme.textMuted}
            value={ticketUrl}
            onChangeText={setTicketUrl}
          />
          <TextInput
            style={styles.input}
            placeholder="Flyer image URL"
            placeholderTextColor={theme.textMuted}
            value={flyerImageUrl}
            onChangeText={setFlyerImageUrl}
          />
          <TextInput
            style={styles.input}
            placeholder="Hero color (#RRGGBB)"
            placeholderTextColor={theme.textMuted}
            value={heroColor}
            onChangeText={setHeroColor}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Event description"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Pressable onPress={() => void submit()} disabled={!canSubmit || submitState === 'submitting'} style={[styles.submitBtn, (!canSubmit || submitState === 'submitting') && styles.submitBtnDisabled]}>
            <Text style={styles.submitBtnLabel}>
              {submitState === 'submitting' ? 'Submitting...' : 'Submit Event'}
            </Text>
          </Pressable>
          {submitMessage.length > 0 && (
            <Text style={[styles.submitMessage, submitState === 'error' && styles.submitError]}>
              {submitMessage}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Moderation Queue</Text>
          {submissions.length === 0 && <Text style={styles.emptyText}>No submissions yet.</Text>}
          {submissions.map((submission) => (
            <View key={submission.id} style={styles.queueItem}>
              <Text style={styles.queueTitle}>{submission.title}</Text>
              <Text style={styles.queueMeta}>
                {submission.dateLabel} - {submission.venue}
              </Text>
              <Text style={styles.queueStatus}>
                {submission.moderationStatus.toUpperCase()}
                {submission.moderationReason ? ` - ${submission.moderationReason}` : ''}
              </Text>
              {(isPromoter || submission.moderationStatus === 'review') && (
                <View style={styles.queueActions}>
                  <Pressable
                    style={[styles.queueBtn, styles.approveBtn]}
                    onPress={() => void onModerateEvent(submission.id, 'accepted', 'Manual moderator approval')}
                  >
                    <Text style={styles.queueBtnLabel}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.queueBtn, styles.reviewBtn]}
                    onPress={() => void onModerateEvent(submission.id, 'review', 'Needs manual review')}
                  >
                    <Text style={styles.queueBtnLabel}>Review</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.queueBtn, styles.rejectBtn]}
                    onPress={() => void onModerateEvent(submission.id, 'rejected', 'Rejected by moderator')}
                  >
                    <Text style={styles.queueBtnLabel}>Reject</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  container: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 13,
  },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  ruleItem: {
    color: theme.textMuted,
    fontSize: 12,
  },
  input: {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    color: theme.text,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
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
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 13,
  },
  submitMessage: {
    color: '#74d38d',
    fontSize: 12,
    fontWeight: '600',
  },
  submitError: {
    color: '#f47373',
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 12,
  },
  queueItem: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    backgroundColor: theme.surfaceAlt,
    padding: 10,
    gap: 4,
  },
  queueTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  queueMeta: {
    color: theme.textMuted,
    fontSize: 11,
  },
  queueStatus: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  queueActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  queueBtn: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 7,
  },
  approveBtn: {
    backgroundColor: '#297b57',
  },
  reviewBtn: {
    backgroundColor: '#4b4f72',
  },
  rejectBtn: {
    backgroundColor: '#9f3e47',
  },
  queueBtnLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
