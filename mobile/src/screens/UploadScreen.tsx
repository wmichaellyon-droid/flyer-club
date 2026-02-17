import { useMemo, useState } from 'react';
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
import { EVENT_KIND_FILTERS, EVENT_SUBCATEGORIES_BY_KIND } from '../mockData';
import { ThemePalette, useAppTheme } from '../theme';
import { combineDateAndTime, defaultEventEndIso } from '../time';
import {
  EntityKind,
  EventDraft,
  EventItem,
  EventKind,
  FlyerTagDraft,
  ModerationStatus,
  UserRole,
} from '../types';

interface UploadScreenProps {
  userRole: UserRole;
  submissions: EventItem[];
  onSubmitEvent: (draft: EventDraft) => Promise<{ moderationStatus: ModerationStatus; moderationReason: string }>;
  onModerateEvent: (eventId: string, status: ModerationStatus, reason: string) => Promise<void>;
}

const entityKinds: EntityKind[] = ['band', 'person', 'promoter', 'venue', 'collective'];

const communityRules = [
  'Anyone can upload flyers',
  'Only flyer-format posts pass moderation',
  'Tap flyer to place tags for bands/people/venues/promoters',
];

function clampUnit(value: number) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function UploadScreen({ userRole, submissions, onSubmitEvent, onModerateEvent }: UploadScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

  const [draftEntityName, setDraftEntityName] = useState('');
  const [draftEntityKind, setDraftEntityKind] = useState<EntityKind>('band');
  const [draftEntityPublic, setDraftEntityPublic] = useState(true);
  const [taggingArmed, setTaggingArmed] = useState(false);
  const [flyerTags, setFlyerTags] = useState<FlyerTagDraft[]>([]);
  const [flyerLayout, setFlyerLayout] = useState({ width: 1, height: 1 });

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

  const canArmTagging = draftEntityName.trim().length > 0;
  const canPlaceTag = canArmTagging && flyerImageUrl.startsWith('http');

  const resetForm = () => {
    setTitle('');
    setPromoter('');
    setDate('');
    setVenue('');
    setAddress('');
    setNeighborhood('');
    setDescription('');
    setFlyerTags([]);
    setDraftEntityName('');
    setTaggingArmed(false);
  };

  const onTapFlyer = (locationX: number, locationY: number) => {
    if (!taggingArmed || !canPlaceTag) {
      return;
    }

    const x = clampUnit(locationX / flyerLayout.width);
    const y = clampUnit(locationY / flyerLayout.height);

    setFlyerTags((prev) => [
      ...prev,
      {
        entityName: draftEntityName.trim(),
        entityKind: draftEntityKind,
        isPublic: draftEntityPublic,
        x,
        y,
      },
    ]);
    setTaggingArmed(false);
    setDraftEntityName('');
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
      flyerTags,
    };

    setSubmitState('submitting');
    setSubmitMessage('');
    try {
      const result = await onSubmitEvent(draft);
      setSubmitState('done');
      setSubmitMessage(
        `Moderation: ${result.moderationStatus.toUpperCase()} - ${result.moderationReason}`,
      );
      resetForm();
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Could not submit event.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Upload Event</Text>
        <Text style={styles.subtitle}>
          Community uploads are open to all users. Tag bands, people, promoters, and venues directly on flyers.
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

          <View style={styles.tagBuilderCard}>
            <Text style={styles.tagBuilderTitle}>Flyer Tagging</Text>
            <Text style={styles.tagHint}>
              Add a name, choose type/public, then tap the flyer to place the tag.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Band/person/promoter/venue name"
              placeholderTextColor={theme.textMuted}
              value={draftEntityName}
              onChangeText={setDraftEntityName}
            />

            <View style={styles.chips}>
              {entityKinds.map((value) => {
                const active = value === draftEntityKind;
                return (
                  <Pressable
                    key={value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDraftEntityKind(value)}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.row}>
              <Pressable
                style={[styles.visibilityBtn, draftEntityPublic && styles.visibilityBtnActive]}
                onPress={() => setDraftEntityPublic(true)}
              >
                <Text style={[styles.visibilityLabel, draftEntityPublic && styles.visibilityLabelActive]}>
                  Public Profile
                </Text>
              </Pressable>
              <Pressable
                style={[styles.visibilityBtn, !draftEntityPublic && styles.visibilityBtnActive]}
                onPress={() => setDraftEntityPublic(false)}
              >
                <Text style={[styles.visibilityLabel, !draftEntityPublic && styles.visibilityLabelActive]}>
                  Private Tag
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setTaggingArmed((prev) => !prev)}
              disabled={!canPlaceTag}
              style={[
                styles.armBtn,
                !canPlaceTag && styles.submitBtnDisabled,
                taggingArmed && styles.armBtnActive,
              ]}
            >
              <Text style={styles.armBtnLabel}>
                {taggingArmed ? 'Tap Flyer Now...' : 'Tap Flyer to Place Tag'}
              </Text>
            </Pressable>

            <Pressable
              onPress={(event) => {
                onTapFlyer(event.nativeEvent.locationX, event.nativeEvent.locationY);
              }}
              onLayout={(event) =>
                setFlyerLayout({
                  width: event.nativeEvent.layout.width,
                  height: event.nativeEvent.layout.height,
                })
              }
              style={styles.flyerPreviewWrap}
            >
              <ImageBackground
                source={flyerImageUrl.startsWith('http') ? { uri: flyerImageUrl } : undefined}
                resizeMode="cover"
                style={styles.flyerPreview}
              >
                <View style={styles.flyerPreviewTint} />
                {flyerTags.map((tag, index) => (
                  <View
                    key={`${tag.entityName}-${index}`}
                    style={[
                      styles.flyerTagPin,
                      {
                        left: `${Math.min(94, Math.max(4, tag.x * 100))}%`,
                        top: `${Math.min(92, Math.max(4, tag.y * 100))}%`,
                      },
                    ]}
                  >
                    <Text style={styles.flyerTagPinLabel}>{tag.entityName}</Text>
                  </View>
                ))}
                {!flyerImageUrl.startsWith('http') && (
                  <Text style={styles.flyerPreviewPlaceholder}>Paste a flyer URL to enable visual tagging.</Text>
                )}
              </ImageBackground>
            </Pressable>

            {flyerTags.length > 0 && (
              <View style={styles.tagList}>
                {flyerTags.map((tag, index) => (
                  <View key={`${tag.entityName}-${index}`} style={styles.tagListItem}>
                    <Text style={styles.tagListLabel}>
                      {tag.entityName} ({tag.entityKind}) {tag.isPublic ? '- public' : '- private'}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setFlyerTags((prev) => prev.filter((_, tagIndex) => tagIndex !== index))
                      }
                    >
                      <Text style={styles.tagRemove}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

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

          <Pressable
            onPress={() => void submit()}
            disabled={!canSubmit || submitState === 'submitting'}
            style={[
              styles.submitBtn,
              (!canSubmit || submitState === 'submitting') && styles.submitBtnDisabled,
            ]}
          >
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
              <Text style={styles.queueTagCount}>Tagged profiles: {submission.flyerTags.length}</Text>
              {(isPromoter || submission.moderationStatus === 'review') && (
                <View style={styles.queueActions}>
                  <Pressable
                    style={[styles.queueBtn, styles.approveBtn]}
                    onPress={() =>
                      void onModerateEvent(submission.id, 'accepted', 'Manual moderator approval')
                    }
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
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
    textTransform: 'capitalize',
  },
  chipLabelActive: {
    color: theme.text,
  },
  tagBuilderCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    backgroundColor: '#ffffff06',
    padding: 10,
    gap: 8,
  },
  tagBuilderTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  tagHint: {
    color: theme.textMuted,
    fontSize: 11,
  },
  visibilityBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 7,
    backgroundColor: theme.surfaceAlt,
  },
  visibilityBtnActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  visibilityLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  visibilityLabelActive: {
    color: theme.text,
  },
  armBtn: {
    borderRadius: 10,
    backgroundColor: '#3e3f62',
    paddingVertical: 10,
    alignItems: 'center',
  },
  armBtnActive: {
    backgroundColor: theme.primary,
  },
  armBtnLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  flyerPreviewWrap: {
    borderWidth: 1,
    borderColor: '#ffffff22',
    borderRadius: 12,
    overflow: 'hidden',
  },
  flyerPreview: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyerPreviewTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000044',
  },
  flyerPreviewPlaceholder: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  flyerTagPin: {
    position: 'absolute',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    minWidth: 18,
    minHeight: 18,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#d54dffcc',
    borderWidth: 1,
    borderColor: '#ffffffbf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerTagPinLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagList: {
    gap: 6,
  },
  tagListItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagListLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  tagRemove: {
    color: '#f28e8e',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
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
  queueTagCount: {
    color: theme.textMuted,
    fontSize: 11,
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
