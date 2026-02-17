import { EventItem, EventKind, InteractionMap, IntentState } from './types';

export type SceneModeId = 'auto' | 'punk' | 'diy' | 'film' | 'comedy' | 'mutual_aid' | 'campus';
export type SearchMatchType = 'event' | 'venue' | 'promoter';

interface SceneDefinition {
  id: Exclude<SceneModeId, 'auto'>;
  label: string;
  kinds: EventKind[];
  keywords: string[];
}

interface WeightedMap {
  [key: string]: number;
}

export interface InteractionProfile {
  scenes: WeightedMap;
  kinds: WeightedMap;
  subcategories: WeightedMap;
  categories: WeightedMap;
  venues: WeightedMap;
  promoters: WeightedMap;
}

const SCENE_DEFINITIONS: SceneDefinition[] = [
  {
    id: 'punk',
    label: 'Punk',
    kinds: ['concert'],
    keywords: ['punk', 'hardcore', 'rock', 'metal', 'garage', 'alt', 'noise'],
  },
  {
    id: 'diy',
    label: 'DIY',
    kinds: ['concert', 'arts', 'meetup'],
    keywords: ['diy', 'zine', 'print', 'underground', 'warehouse', 'indie', 'collective'],
  },
  {
    id: 'film',
    label: 'Film',
    kinds: ['film'],
    keywords: ['film', 'cinema', 'screening', 'arthouse', 'documentary', 'horror'],
  },
  {
    id: 'comedy',
    label: 'Comedy',
    kinds: ['comedy'],
    keywords: ['comedy', 'stand-up', 'improv', 'open mic', 'alt comedy'],
  },
  {
    id: 'mutual_aid',
    label: 'Mutual Aid',
    kinds: ['meetup'],
    keywords: ['mutual aid', 'community', 'teach-in', 'food fair', 'care', 'network', 'meetup'],
  },
  {
    id: 'campus',
    label: 'Campus',
    kinds: ['concert', 'film', 'meetup', 'comedy', 'arts'],
    keywords: ['campus', 'college', 'university', 'student', 'dorm', 'frat', 'sorority'],
  },
];

export const SCENE_MODES: { id: SceneModeId; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  ...SCENE_DEFINITIONS.map((item) => ({ id: item.id, label: item.label })),
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function eventText(event: EventItem) {
  return normalize(
    [
      event.title,
      event.promoter,
      event.venue,
      event.neighborhood,
      event.category,
      event.subcategory,
      event.kind,
      event.tags.join(' '),
      event.description,
      event.flyerTags.map((tag) => tag.entityName).join(' '),
    ].join(' '),
  );
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

export function eventSceneScore(event: EventItem, scene: SceneModeId) {
  if (scene === 'auto') {
    return 0;
  }

  const definition = SCENE_DEFINITIONS.find((item) => item.id === scene);
  if (!definition) {
    return 0;
  }

  let score = 0;
  const text = eventText(event);

  if (definition.kinds.includes(event.kind)) {
    score += 0.35;
  }

  for (const keyword of definition.keywords) {
    if (text.includes(keyword)) {
      score += 0.14;
    }
  }

  return Math.min(1, score);
}

export function eventMatchesScene(event: EventItem, scene: SceneModeId) {
  if (scene === 'auto') {
    return true;
  }
  return eventSceneScore(event, scene) >= 0.22;
}

export function buildInteractionProfile(events: EventItem[], interactions: InteractionMap): InteractionProfile {
  const eventById = new Map(events.map((event) => [event.id, event]));

  const profile: InteractionProfile = {
    scenes: {},
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
    addWeight(profile.categories, event.category, weight * 0.9);
    addWeight(profile.venues, event.venue, weight);
    addWeight(profile.promoters, event.promoter, weight * 0.95);

    for (const definition of SCENE_DEFINITIONS) {
      const sceneScore = eventSceneScore(event, definition.id);
      if (sceneScore > 0) {
        addWeight(profile.scenes, definition.id, weight * sceneScore);
      }
    }
  }

  return profile;
}

export function topSceneFromProfile(profile: InteractionProfile): Exclude<SceneModeId, 'auto'> | null {
  let topScene: Exclude<SceneModeId, 'auto'> | null = null;
  let best = 0;
  for (const definition of SCENE_DEFINITIONS) {
    const weight = profile.scenes[definition.id] ?? 0;
    if (weight > best) {
      best = weight;
      topScene = definition.id;
    }
  }
  return topScene;
}

export function eventPreferenceBoost(event: EventItem, profile: InteractionProfile) {
  const kindBoost = normalizedWeight(profile.kinds, event.kind) * 0.26;
  const subcategoryBoost = normalizedWeight(profile.subcategories, event.subcategory) * 0.32;
  const categoryBoost = normalizedWeight(profile.categories, event.category) * 0.2;
  const venueBoost = normalizedWeight(profile.venues, event.venue) * 0.3;
  const promoterBoost = normalizedWeight(profile.promoters, event.promoter) * 0.2;

  let sceneBoost = 0;
  for (const definition of SCENE_DEFINITIONS) {
    sceneBoost = Math.max(
      sceneBoost,
      normalizedWeight(profile.scenes, definition.id) * eventSceneScore(event, definition.id) * 0.34,
    );
  }

  return kindBoost + subcategoryBoost + categoryBoost + venueBoost + promoterBoost + sceneBoost;
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
  for (const tag of event.tags) {
    scoreField(tag, 1.1, 'event');
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

