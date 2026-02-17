import { AUSTIN_EVENTS } from '../mockData';
import { milesBetweenPoints } from '../geo';
import { supabase } from '../lib/supabase';
import { formatDateLabel, formatTimeRangeLabel } from '../time';
import { buildCanonicalEventTags, buildDraftTags } from '../discovery';
import {
  EntityKind,
  EntityPageData,
  EntityProfile,
  EventDraft,
  EventItem,
  FlyerTag,
  FlyerTagDraft,
  InteractionMap,
  IntentState,
  ModerationStatus,
  ProfileVisibility,
  ReportReason,
  SocialNotification,
  StoredIntentState,
  UserRole,
  UserSetup,
  ThemeMode,
} from '../types';
import { evaluateFlyerDraft } from './moderation';

const AUSTIN_CENTER = { latitude: 30.2672, longitude: -97.7431 };
const META_PROFILE_VISIBILITY_KEY = '__profile_visibility';
const META_SHOW_INTERESTED_KEY = '__profile_show_interested';
const META_PUBLIC_INTERESTED_IDS_KEY = '__profile_public_interested_ids';
const META_THEME_MODE_KEY = '__theme_mode';

type EventRow = {
  id: string;
  title: string;
  promoter: string;
  posted_by: string;
  posted_by_role: UserRole;
  start_at: string;
  end_at: string;
  venue: string;
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  category: string;
  kind: EventItem['kind'];
  subcategory: string;
  age_rating: string;
  tags: string[] | null;
  price_label: string;
  ticket_url: string;
  flyer_image_url: string;
  hero_color: string;
  description: string;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  profile_name: string;
  profile_image_url: string;
  city: string;
  interests: string[] | null;
  role: UserRole;
  taste_answers: Record<string, string> | null;
};

type EntityRow = {
  id: string;
  owner_user_id: string | null;
  name: string;
  handle: string;
  kind: EntityKind;
  is_public: boolean;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type EventEntityRow = {
  id: string;
  event_id: string;
  entity_id: string;
  x_ratio: number;
  y_ratio: number;
};

type FollowRow = {
  follower_user_id: string;
  following_user_id: string;
  status: 'pending' | 'accepted';
};

type NotificationRow = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string;
  actor_name: string;
  type: 'follower_going';
  event_id: string;
  event_title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const localEvents: EventItem[] = [...AUSTIN_EVENTS];
const localInteractions: Record<string, InteractionMap> = {};
const localBlocked: Record<string, Set<string>> = {};
const localShares: { userId: string; eventId: string; destination: string; createdAt: string }[] = [];
const localReports: {
  userId: string;
  eventId: string;
  reason: ReportReason;
  details: string;
  createdAt: string;
}[] = [];
const localFollowerGraph: Record<string, string[]> = {
  'local-dev-user': ['local-follower-1', 'local-follower-2'],
  'local-follower-1': ['local-dev-user'],
};
const localNotificationsByUser: Record<string, SocialNotification[]> = {
  'local-dev-user': [
    {
      id: 'local_notif_seed_1',
      recipientUserId: 'local-dev-user',
      actorUserId: 'local-follower-1',
      actorName: 'Noise Kid',
      type: 'follower_going',
      eventId: 'evt_2',
      eventTitle: 'Rooftop Silent Film + Live Score',
      message: 'Noise Kid is going to Rooftop Silent Film + Live Score.',
      isRead: false,
      createdAtIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ],
};
const localEntities = new Map<string, EntityProfile>();

for (const event of localEvents) {
  for (const tag of event.flyerTags) {
    if (!localEntities.has(tag.entityId)) {
      localEntities.set(tag.entityId, {
        id: tag.entityId,
        name: tag.entityName,
        handle: normalizeHandle(tag.entityName),
        kind: tag.entityKind,
        isPublic: tag.isPublic,
        ownerUserId:
          tag.entityKind === 'promoter' && tag.entityName.toLowerCase() === event.promoter.toLowerCase()
            ? event.postedByUserId
            : undefined,
      });
    }
  }
}

function normalizeHandle(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function parseProfileMeta(tasteAnswers: Record<string, string> | null | undefined) {
  const source = tasteAnswers ?? {};
  const visibility: ProfileVisibility =
    source[META_PROFILE_VISIBILITY_KEY] === 'private' ? 'private' : 'public';
  const showInterested = source[META_SHOW_INTERESTED_KEY] !== 'false';
  const themeMode: ThemeMode = source[META_THEME_MODE_KEY] === 'light' ? 'light' : 'dark';
  const publicInterestedEventIds = (source[META_PUBLIC_INTERESTED_IDS_KEY] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const cleanTasteAnswers: Record<string, string> = { ...source };
  delete cleanTasteAnswers[META_PROFILE_VISIBILITY_KEY];
  delete cleanTasteAnswers[META_SHOW_INTERESTED_KEY];
  delete cleanTasteAnswers[META_PUBLIC_INTERESTED_IDS_KEY];
  delete cleanTasteAnswers[META_THEME_MODE_KEY];

  return {
    visibility,
    showInterested,
    themeMode,
    publicInterestedEventIds,
    cleanTasteAnswers,
  };
}

function withProfileMeta(user: UserSetup) {
  return {
    ...user.tasteAnswers,
    [META_PROFILE_VISIBILITY_KEY]: user.profileVisibility,
    [META_SHOW_INTERESTED_KEY]: user.showInterestedOnProfile ? 'true' : 'false',
    [META_PUBLIC_INTERESTED_IDS_KEY]: user.publicInterestedEventIds.join(','),
    [META_THEME_MODE_KEY]: user.themeMode,
  };
}

function shouldAutoPublic(kind: EntityKind, requestedPublic: boolean) {
  if (requestedPublic) {
    return true;
  }
  return kind === 'promoter' || kind === 'venue';
}

function eventFromRow(
  row: EventRow,
  interactionCounts: Record<string, { interested: number; going: number }>,
  flyerTagsByEvent: Record<string, FlyerTag[]>,
): EventItem {
  const counts = interactionCounts[row.id] ?? { interested: 0, going: 0 };
  return {
    id: row.id,
    title: row.title,
    promoter: row.promoter,
    postedByUserId: row.posted_by,
    dateLabel: formatDateLabel(row.start_at),
    timeLabel: formatTimeRangeLabel(row.start_at, row.end_at),
    startAtIso: row.start_at,
    endAtIso: row.end_at,
    venue: row.venue,
    address: row.address,
    neighborhood: row.neighborhood,
    distanceMiles: milesBetweenPoints(AUSTIN_CENTER, {
      latitude: row.latitude,
      longitude: row.longitude,
    }),
    priceLabel: row.price_label,
    category: row.category,
    ageRating: row.age_rating,
    tags: buildCanonicalEventTags({
      title: row.title,
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      kind: row.kind,
      venue: row.venue,
      promoter: row.promoter,
      tags: row.tags ?? [],
    }),
    description: row.description,
    ticketUrl: row.ticket_url,
    flyerImageUrl: row.flyer_image_url,
    heroColor: row.hero_color,
    latitude: row.latitude,
    longitude: row.longitude,
    kind: row.kind,
    subcategory: row.subcategory,
    friendInterested: counts.interested,
    friendGoing: counts.going,
    postedByRole: row.posted_by_role,
    moderationStatus: row.moderation_status,
    moderationReason: row.moderation_reason ?? undefined,
    flyerTags: flyerTagsByEvent[row.id] ?? [],
  };
}

function buildLocalInteractionCounts(events: EventItem[]) {
  const counts: Record<string, { interested: number; going: number }> = {};
  for (const event of events) {
    counts[event.id] = {
      interested: event.friendInterested,
      going: event.friendGoing,
    };
  }
  return counts;
}

function entityFromRow(row: EntityRow): EntityProfile {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? undefined,
    name: row.name,
    handle: row.handle,
    kind: row.kind,
    isPublic: row.is_public,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

function tagFromRows(eventId: string, tagRow: EventEntityRow, entity: EntityProfile): FlyerTag {
  return {
    id: tagRow.id,
    eventId,
    entityId: entity.id,
    entityName: entity.name,
    entityKind: entity.kind,
    isPublic: entity.isPublic,
    x: Number(tagRow.x_ratio),
    y: Number(tagRow.y_ratio),
  };
}

function notificationFromRow(row: NotificationRow): SocialNotification {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    type: row.type,
    eventId: row.event_id,
    eventTitle: row.event_title,
    message: row.message,
    isRead: row.is_read,
    createdAtIso: row.created_at,
  };
}

function matchesEntityUpload(entity: EntityProfile, event: EventItem) {
  const normalize = (value: string) => value.trim().toLowerCase();

  if (entity.ownerUserId && event.postedByUserId === entity.ownerUserId) {
    return true;
  }
  if (entity.kind === 'promoter' && normalize(event.promoter) === normalize(entity.name)) {
    return true;
  }
  if (entity.kind === 'venue' && normalize(event.venue) === normalize(entity.name)) {
    return true;
  }
  return false;
}

function dedupeEvents(events: EventItem[]) {
  const map = new Map<string, EventItem>();
  for (const event of events) {
    if (!map.has(event.id)) {
      map.set(event.id, event);
    }
  }
  return Array.from(map.values());
}

function createLocalEntityFromTag(userId: string, tag: FlyerTagDraft): EntityProfile {
  const isPublic = shouldAutoPublic(tag.entityKind, tag.isPublic);
  const handle = normalizeHandle(tag.entityName);
  const existing = Array.from(localEntities.values()).find(
    (entity) => entity.handle === handle && entity.kind === tag.entityKind,
  );
  if (existing) {
    if (isPublic && !existing.isPublic) {
      existing.isPublic = true;
      localEntities.set(existing.id, existing);
    }
    return existing;
  }

  const id = `local_ent_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
  const entity: EntityProfile = {
    id,
    ownerUserId: userId,
    name: tag.entityName,
    handle,
    kind: tag.entityKind,
    isPublic,
  };
  localEntities.set(entity.id, entity);
  return entity;
}

async function upsertEntityFromTag(userId: string, tag: FlyerTagDraft) {
  if (!supabase || userId === 'local-dev-user') {
    return createLocalEntityFromTag(userId, tag);
  }

  const isPublic = shouldAutoPublic(tag.entityKind, tag.isPublic);
  const handle = normalizeHandle(tag.entityName);
  const { data: existing } = await supabase
    .from('entities')
    .select('id,owner_user_id,name,handle,kind,is_public,bio,avatar_url,created_at')
    .eq('handle', handle)
    .eq('kind', tag.entityKind)
    .limit(1)
    .maybeSingle<EntityRow>();

  if (existing) {
    if (isPublic && !existing.is_public) {
      await supabase.from('entities').update({ is_public: true }).eq('id', existing.id);
      existing.is_public = true;
    }
    return entityFromRow(existing);
  }

  const { data, error } = await supabase
    .from('entities')
    .insert({
      owner_user_id: userId,
      name: tag.entityName,
      handle,
      kind: tag.entityKind,
      is_public: isPublic,
      bio: '',
    })
    .select('id,owner_user_id,name,handle,kind,is_public,bio,avatar_url,created_at')
    .single<EntityRow>();

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not create entity profile for tag.');
  }
  return entityFromRow(data);
}

async function loadFlyerTagsByEvent(eventIds: string[]) {
  const flyerTagsByEvent: Record<string, FlyerTag[]> = {};
  if (eventIds.length === 0) {
    return flyerTagsByEvent;
  }

  if (!supabase) {
    const map = new Map(localEvents.map((event) => [event.id, event]));
    for (const eventId of eventIds) {
      flyerTagsByEvent[eventId] = map.get(eventId)?.flyerTags ?? [];
    }
    return flyerTagsByEvent;
  }

  const { data: eventTagsRows, error: tagError } = await supabase
    .from('event_entities')
    .select('id,event_id,entity_id,x_ratio,y_ratio')
    .in('event_id', eventIds)
    .returns<EventEntityRow[]>();

  if (tagError || !eventTagsRows || eventTagsRows.length === 0) {
    return flyerTagsByEvent;
  }

  const entityIds = Array.from(new Set(eventTagsRows.map((row) => row.entity_id)));
  const { data: entityRows } = await supabase
    .from('entities')
    .select('id,owner_user_id,name,handle,kind,is_public,bio,avatar_url,created_at')
    .in('id', entityIds)
    .returns<EntityRow[]>();

  const entityById = new Map<string, EntityProfile>();
  for (const row of entityRows ?? []) {
    entityById.set(row.id, entityFromRow(row));
  }

  for (const row of eventTagsRows) {
    const entity = entityById.get(row.entity_id);
    if (!entity || !entity.isPublic) {
      continue;
    }
    if (!flyerTagsByEvent[row.event_id]) {
      flyerTagsByEvent[row.event_id] = [];
    }
    flyerTagsByEvent[row.event_id].push(tagFromRows(row.event_id, row, entity));
  }

  return flyerTagsByEvent;
}

export async function ensureAuthUser() {
  if (!supabase) {
    return { id: 'local-dev-user', backend: 'local' as const };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return { id: sessionData.session.user.id, backend: 'supabase' as const };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { id: 'local-dev-user', backend: 'local' as const };
  }

  return { id: data.user.id, backend: 'supabase' as const };
}

export async function fetchProfile(userId: string): Promise<UserSetup | null> {
  if (!supabase || userId === 'local-dev-user') {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,profile_name,profile_image_url,city,interests,role,taste_answers')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();

  if (error || !data) {
    return null;
  }

  const profileMeta = parseProfileMeta(data.taste_answers);

  return {
    id: data.id,
    email: data.email ?? '',
    profileName: data.profile_name ?? '',
    profileImageUrl: data.profile_image_url ?? '',
    city: data.city ?? 'Austin, TX',
    interests: data.interests ?? [],
    role: data.role ?? 'event_enjoyer',
    tasteAnswers: profileMeta.cleanTasteAnswers,
    profileVisibility: profileMeta.visibility,
    showInterestedOnProfile: profileMeta.showInterested,
    publicInterestedEventIds: profileMeta.publicInterestedEventIds,
    themeMode: profileMeta.themeMode,
  };
}

export async function upsertProfile(userId: string, profile: UserSetup) {
  if (!supabase || userId === 'local-dev-user') {
    return;
  }

  await supabase.from('profiles').upsert(
    {
      id: userId,
      email: profile.email,
      profile_name: profile.profileName,
      profile_image_url: profile.profileImageUrl,
      city: profile.city,
      interests: profile.interests,
      role: profile.role,
      taste_answers: withProfileMeta(profile),
    },
    { onConflict: 'id' },
  );
}

export async function fetchEvents(params: { includeUnmoderated?: boolean; onlyUserId?: string } = {}) {
  const { includeUnmoderated = false, onlyUserId } = params;
  if (!supabase) {
    const source = includeUnmoderated
      ? localEvents
      : localEvents.filter((event) => event.moderationStatus === 'accepted');
    return onlyUserId ? source.filter((event) => event.postedByUserId === onlyUserId) : source;
  }

  let query = supabase
    .from('events')
    .select(
      'id,title,promoter,posted_by,posted_by_role,start_at,end_at,venue,address,neighborhood,city,latitude,longitude,category,kind,subcategory,age_rating,tags,price_label,ticket_url,flyer_image_url,hero_color,description,moderation_status,moderation_reason,created_at',
    )
    .order('start_at', { ascending: true });

  if (!includeUnmoderated) {
    query = query.eq('moderation_status', 'accepted');
  }
  if (onlyUserId) {
    query = query.eq('posted_by', onlyUserId);
  }

  const { data, error } = await query.returns<EventRow[]>();
  if (error || !data || data.length === 0) {
    const source = includeUnmoderated
      ? localEvents
      : localEvents.filter((event) => event.moderationStatus === 'accepted');
    return onlyUserId ? source.filter((event) => event.postedByUserId === onlyUserId) : source;
  }

  const eventIds = data.map((event) => event.id);
  const { data: interactionsData } = await supabase
    .from('interactions')
    .select('event_id,state')
    .in('event_id', eventIds)
    .returns<{ event_id: string; state: StoredIntentState }[]>();

  const counts: Record<string, { interested: number; going: number }> = {};
  for (const eventId of eventIds) {
    counts[eventId] = { interested: 0, going: 0 };
  }
  for (const item of interactionsData ?? []) {
    if (!counts[item.event_id]) {
      continue;
    }
    if (item.state === 'interested') {
      counts[item.event_id].interested += 1;
    } else if (item.state === 'going') {
      counts[item.event_id].going += 1;
    }
  }

  const flyerTagsByEvent = await loadFlyerTagsByEvent(eventIds);
  return data.map((row) => eventFromRow(row, counts, flyerTagsByEvent));
}

export async function fetchEntityPageData(userId: string, entityId: string): Promise<EntityPageData | null> {
  if (!supabase || userId === 'local-dev-user') {
    const entity = localEntities.get(entityId);
    if (!entity) {
      return null;
    }
    if (!entity.isPublic && entity.ownerUserId !== userId) {
      return null;
    }
    const accepted = localEvents.filter((event) => event.moderationStatus === 'accepted');
    const uploadedEvents = accepted.filter((event) => matchesEntityUpload(entity, event));
    const involvedEvents = accepted.filter((event) => event.flyerTags.some((tag) => tag.entityId === entityId));
    return {
      entity,
      uploadedEvents: dedupeEvents(uploadedEvents),
      involvedEvents: dedupeEvents(involvedEvents),
    };
  }

  const { data: entityRow } = await supabase
    .from('entities')
    .select('id,owner_user_id,name,handle,kind,is_public,bio,avatar_url,created_at')
    .eq('id', entityId)
    .maybeSingle<EntityRow>();

  if (!entityRow) {
    return null;
  }

  const entity = entityFromRow(entityRow);
  if (!entity.isPublic && entity.ownerUserId !== userId) {
    return null;
  }

  const acceptedEvents = await fetchEvents({ includeUnmoderated: false });
  const uploadedEvents = acceptedEvents.filter((event) => matchesEntityUpload(entity, event));
  const involvedEvents = acceptedEvents.filter((event) =>
    event.flyerTags.some((tag) => tag.entityId === entityId),
  );

  return {
    entity,
    uploadedEvents: dedupeEvents(uploadedEvents),
    involvedEvents: dedupeEvents(involvedEvents),
  };
}

export async function fetchInteractions(userId: string): Promise<InteractionMap> {
  if (!supabase || userId === 'local-dev-user') {
    return localInteractions[userId] ?? {};
  }

  const { data, error } = await supabase
    .from('interactions')
    .select('event_id,state')
    .eq('user_id', userId)
    .returns<{ event_id: string; state: StoredIntentState }[]>();

  if (error || !data) {
    return {};
  }

  const map: InteractionMap = {};
  for (const row of data) {
    map[row.event_id] = row.state;
  }
  return map;
}

export async function saveInteraction(userId: string, eventId: string, intent: IntentState) {
  if (!supabase || userId === 'local-dev-user') {
    if (!localInteractions[userId]) {
      localInteractions[userId] = {};
    }
    if (!intent) {
      delete localInteractions[userId][eventId];
    } else {
      localInteractions[userId][eventId] = intent;
    }
    return;
  }

  if (!intent) {
    await supabase.from('interactions').delete().match({ user_id: userId, event_id: eventId });
    return;
  }

  await supabase.from('interactions').upsert(
    {
      user_id: userId,
      event_id: eventId,
      state: intent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,event_id' },
  );
}

export async function createEventSubmission(userId: string, role: UserRole, draft: EventDraft) {
  const moderation = evaluateFlyerDraft(draft);
  const normalizedTags = buildDraftTags(draft);

  const eventInsert = {
    title: draft.title,
    promoter: draft.promoter,
    posted_by: userId,
    posted_by_role: role,
    start_at: draft.startAtIso,
    end_at: draft.endAtIso,
    venue: draft.venue,
    address: draft.address,
    neighborhood: draft.neighborhood,
    city: draft.city,
    latitude: draft.latitude,
    longitude: draft.longitude,
    category: draft.category,
    kind: draft.kind,
    subcategory: draft.subcategory,
    age_rating: draft.ageRating,
    tags: normalizedTags,
    price_label: draft.priceLabel,
    ticket_url: draft.ticketUrl,
    flyer_image_url: draft.flyerImageUrl,
    hero_color: draft.heroColor,
    description: draft.description,
    moderation_status: moderation.status,
    moderation_reason: moderation.reason,
  };

  if (!supabase || userId === 'local-dev-user') {
    const eventId = `local_${Date.now()}`;
    const flyerTags: FlyerTag[] = [];

    for (const tagDraft of draft.flyerTags) {
      const entity = createLocalEntityFromTag(userId, tagDraft);
      flyerTags.push({
        id: `local_tag_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        eventId,
        entityId: entity.id,
        entityName: entity.name,
        entityKind: entity.kind,
        isPublic: entity.isPublic,
        x: tagDraft.x,
        y: tagDraft.y,
      });
    }

    const localEvent: EventItem = {
      id: eventId,
      title: draft.title,
      promoter: draft.promoter,
      postedByUserId: userId,
      dateLabel: formatDateLabel(draft.startAtIso),
      timeLabel: formatTimeRangeLabel(draft.startAtIso, draft.endAtIso),
      startAtIso: draft.startAtIso,
      endAtIso: draft.endAtIso,
      venue: draft.venue,
      address: draft.address,
      neighborhood: draft.neighborhood,
      distanceMiles: milesBetweenPoints(AUSTIN_CENTER, {
        latitude: draft.latitude,
        longitude: draft.longitude,
      }),
      priceLabel: draft.priceLabel,
      category: draft.category,
      ageRating: draft.ageRating,
      tags: normalizedTags,
      description: draft.description,
      ticketUrl: draft.ticketUrl,
      flyerImageUrl: draft.flyerImageUrl,
      heroColor: draft.heroColor,
      latitude: draft.latitude,
      longitude: draft.longitude,
      kind: draft.kind,
      subcategory: draft.subcategory,
      friendInterested: 0,
      friendGoing: 0,
      postedByRole: role,
      moderationStatus: moderation.status,
      moderationReason: moderation.reason,
      flyerTags,
    };
    localEvents.unshift(localEvent);
    return {
      event: localEvent,
      moderation,
    };
  }

  const { data, error } = await supabase
    .from('events')
    .insert(eventInsert)
    .select(
      'id,title,promoter,posted_by,posted_by_role,start_at,end_at,venue,address,neighborhood,city,latitude,longitude,category,kind,subcategory,age_rating,tags,price_label,ticket_url,flyer_image_url,hero_color,description,moderation_status,moderation_reason,created_at',
    )
    .single<EventRow>();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create event');
  }

  const flyerTags: FlyerTag[] = [];
  for (const tagDraft of draft.flyerTags) {
    const entity = await upsertEntityFromTag(userId, tagDraft);
    const { data: eventTagRow, error: eventTagError } = await supabase
      .from('event_entities')
      .insert({
        event_id: data.id,
        entity_id: entity.id,
        tagged_by_user_id: userId,
        x_ratio: tagDraft.x,
        y_ratio: tagDraft.y,
      })
      .select('id,event_id,entity_id,x_ratio,y_ratio')
      .single<EventEntityRow>();

    if (eventTagError || !eventTagRow) {
      continue;
    }

    flyerTags.push(tagFromRows(data.id, eventTagRow, entity));
  }

  return {
    event: {
      ...eventFromRow(data, {}, {}),
      flyerTags,
    },
    moderation,
  };
}

export async function setEventModerationStatus(eventId: string, status: ModerationStatus, reason: string) {
  if (!supabase) {
    const item = localEvents.find((event) => event.id === eventId);
    if (item) {
      item.moderationStatus = status;
      item.moderationReason = reason;
    }
    return;
  }

  await supabase
    .from('events')
    .update({ moderation_status: status, moderation_reason: reason })
    .eq('id', eventId);
}

export async function fetchBlockedUserIds(userId: string) {
  if (!supabase || userId === 'local-dev-user') {
    return Array.from(localBlocked[userId] ?? new Set<string>());
  }

  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_user_id')
    .eq('blocker_user_id', userId)
    .returns<{ blocked_user_id: string }[]>();

  return (data ?? []).map((row) => row.blocked_user_id);
}

export async function blockUser(blockerUserId: string, blockedUserId: string) {
  if (!supabase || blockerUserId === 'local-dev-user') {
    if (!localBlocked[blockerUserId]) {
      localBlocked[blockerUserId] = new Set<string>();
    }
    localBlocked[blockerUserId].add(blockedUserId);
    return;
  }

  await supabase.from('user_blocks').upsert(
    {
      blocker_user_id: blockerUserId,
      blocked_user_id: blockedUserId,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'blocker_user_id,blocked_user_id' },
  );
}

export async function reportEvent(userId: string, eventId: string, reason: ReportReason, details: string) {
  if (!supabase || userId === 'local-dev-user') {
    localReports.push({
      userId,
      eventId,
      reason,
      details,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  await supabase.from('event_reports').insert({
    reporter_user_id: userId,
    event_id: eventId,
    reason,
    details,
    created_at: new Date().toISOString(),
  });
}

export async function logShare(userId: string, eventId: string, destination: string) {
  if (!supabase || userId === 'local-dev-user') {
    localShares.push({
      userId,
      eventId,
      destination,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  await supabase.from('shares').insert({
    sender_user_id: userId,
    event_id: eventId,
    destination,
    created_at: new Date().toISOString(),
  });
}

export async function notifyFollowersGoing(params: {
  actorUserId: string;
  actorName: string;
  eventId: string;
  eventTitle: string;
}) {
  const { actorUserId, actorName, eventId, eventTitle } = params;
  const safeActorName = actorName.trim() || 'Someone you follow';
  const message = `${safeActorName} is going to ${eventTitle}.`;

  if (!supabase || actorUserId === 'local-dev-user') {
    const followerIds = localFollowerGraph[actorUserId] ?? [];
    if (followerIds.length === 0) {
      return { sentCount: 0 };
    }

    const createdAtIso = new Date().toISOString();
    for (const followerId of followerIds) {
      if (!localNotificationsByUser[followerId]) {
        localNotificationsByUser[followerId] = [];
      }
      localNotificationsByUser[followerId].unshift({
        id: `local_notif_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        recipientUserId: followerId,
        actorUserId,
        actorName: safeActorName,
        type: 'follower_going',
        eventId,
        eventTitle,
        message,
        isRead: false,
        createdAtIso,
      });
    }
    return { sentCount: followerIds.length };
  }

  try {
    const { data: followers, error: followerError } = await supabase
      .from('user_follows')
      .select('follower_user_id,following_user_id,status')
      .eq('following_user_id', actorUserId)
      .eq('status', 'accepted')
      .returns<FollowRow[]>();

    if (followerError || !followers || followers.length === 0) {
      return { sentCount: 0 };
    }

    const followerIds = Array.from(new Set(followers.map((item) => item.follower_user_id))).filter(
      (id) => id !== actorUserId,
    );
    if (followerIds.length === 0) {
      return { sentCount: 0 };
    }

    const createdAt = new Date().toISOString();
    const payload = followerIds.map((recipientUserId) => ({
      recipient_user_id: recipientUserId,
      actor_user_id: actorUserId,
      actor_name: safeActorName,
      type: 'follower_going',
      event_id: eventId,
      event_title: eventTitle,
      message,
      is_read: false,
      created_at: createdAt,
    }));

    const { error: insertError } = await supabase.from('user_notifications').insert(payload);
    if (insertError) {
      return { sentCount: 0 };
    }
    return { sentCount: followerIds.length };
  } catch {
    return { sentCount: 0 };
  }
}

export async function fetchNotifications(userId: string, limit = 25): Promise<SocialNotification[]> {
  if (!supabase || userId === 'local-dev-user') {
    const local = localNotificationsByUser[userId] ?? [];
    return [...local].sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)).slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select(
        'id,recipient_user_id,actor_user_id,actor_name,type,event_id,event_title,message,is_read,created_at',
      )
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<NotificationRow[]>();

    if (error || !data) {
      return [];
    }
    return data.map(notificationFromRow);
  } catch {
    return [];
  }
}

export async function markNotificationsRead(userId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) {
    return;
  }

  if (!supabase || userId === 'local-dev-user') {
    const list = localNotificationsByUser[userId] ?? [];
    const idSet = new Set(notificationIds);
    for (const item of list) {
      if (idSet.has(item.id)) {
        item.isRead = true;
      }
    }
    return;
  }

  try {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', userId)
      .in('id', notificationIds);
  } catch {
    return;
  }
}

export async function logAnalytics(userId: string, eventName: string, payload: Record<string, unknown> = {}) {
  if (!supabase || userId === 'local-dev-user') {
    return;
  }

  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: eventName,
    payload,
    created_at: new Date().toISOString(),
  });
}
