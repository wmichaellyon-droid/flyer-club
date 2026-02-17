import { AUSTIN_EVENTS } from '../mockData';
import { milesBetweenPoints } from '../geo';
import { supabase } from '../lib/supabase';
import { formatDateLabel, formatTimeRangeLabel } from '../time';
import {
  EventDraft,
  EventItem,
  InteractionMap,
  IntentState,
  ModerationStatus,
  ReportReason,
  StoredIntentState,
  UserRole,
  UserSetup,
} from '../types';
import { evaluateFlyerDraft } from './moderation';

const AUSTIN_CENTER = { latitude: 30.2672, longitude: -97.7431 };

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

function eventFromRow(
  row: EventRow,
  interactionCounts: Record<string, { interested: number; going: number }>,
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
    tags: row.tags ?? [],
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

  return {
    id: data.id,
    email: data.email ?? '',
    profileName: data.profile_name ?? '',
    profileImageUrl: data.profile_image_url ?? '',
    city: data.city ?? 'Austin, TX',
    interests: data.interests ?? [],
    role: data.role ?? 'event_enjoyer',
    tasteAnswers: data.taste_answers ?? {},
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
      taste_answers: profile.tasteAnswers,
    },
    { onConflict: 'id' },
  );
}

export async function fetchEvents(params: { includeUnmoderated?: boolean; onlyUserId?: string } = {}) {
  const { includeUnmoderated = false, onlyUserId } = params;
  if (!supabase) {
    const source = includeUnmoderated ? localEvents : localEvents.filter((event) => event.moderationStatus === 'accepted');
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
    const source = includeUnmoderated ? localEvents : localEvents.filter((event) => event.moderationStatus === 'accepted');
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

  return data.map((row) => eventFromRow(row, counts));
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

export async function createEventSubmission(
  userId: string,
  role: UserRole,
  draft: EventDraft,
) {
  const moderation = evaluateFlyerDraft(draft);

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
    tags: draft.tags,
    price_label: draft.priceLabel,
    ticket_url: draft.ticketUrl,
    flyer_image_url: draft.flyerImageUrl,
    hero_color: draft.heroColor,
    description: draft.description,
    moderation_status: moderation.status,
    moderation_reason: moderation.reason,
  };

  if (!supabase || userId === 'local-dev-user') {
    const localEvent: EventItem = {
      id: `local_${Date.now()}`,
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
      tags: draft.tags,
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

  return {
    event: eventFromRow(data, {}),
    moderation,
  };
}

export async function setEventModerationStatus(
  eventId: string,
  status: ModerationStatus,
  reason: string,
) {
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

export async function reportEvent(
  userId: string,
  eventId: string,
  reason: ReportReason,
  details: string,
) {
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

export async function logAnalytics(
  userId: string,
  eventName: string,
  payload: Record<string, unknown> = {},
) {
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
