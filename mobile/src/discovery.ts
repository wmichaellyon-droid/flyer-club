import { EventDraft, EventItem, EventKind, InteractionMap, IntentState } from './types';

export type SearchMatchType = 'event' | 'venue' | 'promoter';

interface WeightedMap {
  [key: string]: number;
}

export interface InteractionProfile {
  tags: WeightedMap;
  kinds: WeightedMap;
  subcategories: WeightedMap;
  categories: WeightedMap;
  venues: WeightedMap;
  promoters: WeightedMap;
}

export const SUGGESTED_EVENT_TAGS = [
  'punk',
  'goth',
  'rock',
  'pop',
  'DIY',
  'house-show',
  'music',
  'film',
  'queer',
  'mutual aid',
  'fundraiser',
  'food',
  'vegan food',
];

const TAG_KEYWORDS: Record<string, string[]> = {
  punk: ['punk', 'hardcore', 'garage punk'],
  goth: ['goth', 'darkwave', 'post-punk'],
  rock: ['rock', 'indie rock', 'alt rock'],
  pop: ['pop', 'synth pop'],
  diy: ['diy', 'zine', 'underground', 'independent'],
  'house-show': ['house show', 'house-show', 'living room show'],
  music: ['concert', 'live music', 'show', 'lineup', 'dj set', 'band'],
  film: ['film', 'cinema', 'screening', 'movie', 'documentary', 'arthouse'],
  queer: ['queer', 'lgbtq', 'drag', 'trans', 'pride'],
  'mutual aid': ['mutual aid', 'community support', 'care network'],
  fundraiser: ['fundraiser', 'benefit', 'donation', 'charity'],
  food: ['food', 'cookout', 'dinner', 'brunch', 'snack', 'eat'],
  'vegan food': ['vegan', 'plant-based'],
  comedy: ['comedy', 'stand-up', 'improv', 'open mic'],
  metal: ['metal', 'thrash', 'death metal'],
  electronic: ['electronic', 'techno', 'house', 'edm', 'synth'],
  jazz: ['jazz', 'bebop', 'fusion'],
  community: ['community', 'meetup', 'workshop', 'collective', 'market'],
  poetry: ['poetry', 'spoken word'],
  theater: ['theater', 'theatre', 'play', 'performance'],
  campus: ['campus', 'college', 'university', 'student'],
};

const TAG_SYNONYMS: Record<string, string> = {
  'house show': 'house-show',
  houseshow: 'house-show',
  'house-show': 'house-show',
  diy: 'diy',
  'd.i.y.': 'diy',
  goth: 'goth',
  punk: 'punk',
  rock: 'rock',
  pop: 'pop',
  film: 'film',
  movie: 'film',
  queer: 'queer',
  'mutual-aid': 'mutual aid',
  mutualaid: 'mutual aid',
  'mutual aid': 'mutual aid',
  fundraiser: 'fundraiser',
  fundraisers: 'fundraiser',
  food: 'food',
  vegan: 'vegan food',
  'vegan food': 'vegan food',
  music: 'music',
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizedTagKey(value: string) {
  return normalize(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function canonicalTag(value: string) {
  const key = normalizedTagKey(value);
  if (!key) {
    return null;
  }

  if (TAG_SYNONYMS[key]) {
    return TAG_SYNONYMS[key];
  }

  if (TAG_KEYWORDS[key]) {
    return key;
  }

  return key;
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((item) => normalize(item)).filter(Boolean)));
}

function addWeight(target: WeightedMap, key: string, amount: number) {
  const normalized = normalize(key);
  if (!normalized) {
    return;
  }
  target[normalized] = (target[normalized] ?? 0) + amount;
}

function maxWeight(source: WeightedMap) {
  let max = 0;
  for (const value of Object.values(source)) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}

function normalizedWeight(source: WeightedMap, key: string) {
  const max = maxWeight(source);
  if (max <= 0) {
    return 0;
  }
  return (source[normalize(key)] ?? 0) / max;
}

function weightForIntent(intent: IntentState) {
  if (intent === 'going') {
    return 1.2;
  }
  if (intent === 'interested') {
    return 1;
  }
  if (intent === 'saved') {
    return 0.6;
  }
  return 0;
}

function inferTagsFromText(text: string) {
  const normalizedText = normalize(text);
  const inferred: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedText.includes(normalize(keyword)))) {
      inferred.push(tag);
    }
  }

  return inferred;
}

function inferKindTags(kind: EventKind) {
  if (kind === 'concert') {
    return ['music'];
  }
  if (kind === 'film') {
    return ['film'];
  }
  if (kind === 'comedy') {
    return ['comedy'];
  }
  if (kind === 'meetup') {
    return ['community'];
  }
  if (kind === 'arts') {
    return ['diy'];
  }
  return [];
}

export function buildCanonicalEventTags(input: {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  kind: EventKind;
  venue?: string;
  promoter?: string;
  tags?: string[];
}) {
  const manual = (input.tags ?? [])
    .map((tag) => canonicalTag(tag))
    .filter((tag): tag is string => Boolean(tag));

  const inferred = inferTagsFromText(
    [input.title, input.description, input.category, input.subcategory, input.venue ?? '', input.promoter ?? ''].join(
      ' ',
    ),
  );

  return dedupe([...manual, ...inferKindTags(input.kind), ...inferred]);
}

function eventTags(event: EventItem) {
  return buildCanonicalEventTags({
    title: event.title,
    description: event.description,
    category: event.category,
    subcategory: event.subcategory,
    kind: event.kind,
    venue: event.venue,
    promoter: event.promoter,
    tags: event.tags,
  });
}

export function buildDraftTags(draft: EventDraft) {
  return buildCanonicalEventTags({
    title: draft.title,
    description: draft.description,
    category: draft.category,
    subcategory: draft.subcategory,
    kind: draft.kind,
    venue: draft.venue,
    promoter: draft.promoter,
    tags: draft.tags,
  });
}

export function buildInteractionProfile(events: EventItem[], interactions: InteractionMap): InteractionProfile {
  const eventById = new Map(events.map((event) => [event.id, event]));

  const profile: InteractionProfile = {
    tags: {},
    kinds: {},
    subcategories: {},
    categories: {},
    venues: {},
    promoters: {},
  };

  for (const [eventId, intent] of Object.entries(interactions)) {
    if (!intent) {
      continue;
    }
    const event = eventById.get(eventId);
    if (!event) {
      continue;
    }

    const weight = weightForIntent(intent);
    if (weight <= 0) {
      continue;
    }

    addWeight(profile.kinds, event.kind, weight);
    addWeight(profile.subcategories, event.subcategory, weight);
    addWeight(profile.categories, event.category, weight * 0.85);
    addWeight(profile.venues, event.venue, weight);
    addWeight(profile.promoters, event.promoter, weight * 0.9);

    for (const tag of eventTags(event)) {
      addWeight(profile.tags, tag, weight * 1.1);
    }
  }

  return profile;
}

export function eventPreferenceBoost(event: EventItem, profile: InteractionProfile) {
  const kindBoost = normalizedWeight(profile.kinds, event.kind) * 0.18;
  const subcategoryBoost = normalizedWeight(profile.subcategories, event.subcategory) * 0.24;
  const categoryBoost = normalizedWeight(profile.categories, event.category) * 0.16;
  const venueBoost = normalizedWeight(profile.venues, event.venue) * 0.24;
  const promoterBoost = normalizedWeight(profile.promoters, event.promoter) * 0.14;

  const tags = eventTags(event);
  let tagBoost = 0;
  for (const tag of tags) {
    tagBoost = Math.max(tagBoost, normalizedWeight(profile.tags, tag));
  }

  return kindBoost + subcategoryBoost + categoryBoost + venueBoost + promoterBoost + tagBoost * 0.42;
}

export function eventSearchScore(
  event: EventItem,
  query: string,
): { score: number; matchedTypes: SearchMatchType[] } {
  const q = normalize(query);
  if (!q) {
    return { score: 0, matchedTypes: [] };
  }

  let score = 0;
  const matchedTypes: SearchMatchType[] = [];

  const scoreField = (value: string, base: number, type: SearchMatchType) => {
    const normalized = normalize(value);
    if (!normalized.includes(q)) {
      return;
    }
    score += base;
    if (normalized.startsWith(q)) {
      score += 0.7;
    }
    if (normalized === q) {
      score += 1;
    }
    if (!matchedTypes.includes(type)) {
      matchedTypes.push(type);
    }
  };

  scoreField(event.title, 4.1, 'event');
  scoreField(event.category, 1.6, 'event');
  scoreField(event.subcategory, 1.8, 'event');
  scoreField(event.neighborhood, 1.3, 'event');
  scoreField(event.description, 0.8, 'event');
  for (const tag of eventTags(event)) {
    scoreField(tag, 1.3, 'event');
  }

  scoreField(event.venue, 3.7, 'venue');
  scoreField(event.address, 1.2, 'venue');

  scoreField(event.promoter, 3.6, 'promoter');
  for (const tag of event.flyerTags) {
    if (tag.entityKind === 'venue') {
      scoreField(tag.entityName, 2.2, 'venue');
    } else if (tag.entityKind === 'promoter' || tag.entityKind === 'collective') {
      scoreField(tag.entityName, 2.2, 'promoter');
    } else {
      scoreField(tag.entityName, 1.4, 'event');
    }
  }

  return { score, matchedTypes };
}
