export type TabKey = 'Feed' | 'Map' | 'Explore' | 'Messages' | 'Upload' | 'Profile';

export type IntentState = 'interested' | 'going' | 'saved' | undefined;
export type StoredIntentState = 'interested' | 'going' | 'saved';
export type ModerationStatus = 'accepted' | 'review' | 'rejected';
export type RadiusFilter = 2 | 5 | 10 | 'city';
export type EntityKind = 'band' | 'person' | 'promoter' | 'venue' | 'collective';

export type IntentFilter = 'Interested' | 'Going' | 'Saved';

export type UserRole = 'concert_lover' | 'event_enjoyer' | 'promoter';
export type EventKind = 'concert' | 'film' | 'meetup' | 'comedy' | 'arts';
export type EventSubcategory = string;
export type EventTasteAnswers = Record<string, string>;

export interface EventTasteQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface EventItem {
  id: string;
  title: string;
  promoter: string;
  postedByUserId: string;
  dateLabel: string;
  timeLabel: string;
  startAtIso: string;
  endAtIso: string;
  venue: string;
  address: string;
  neighborhood: string;
  distanceMiles: number;
  priceLabel: string;
  category: string;
  ageRating: string;
  tags: string[];
  description: string;
  ticketUrl: string;
  flyerImageUrl: string;
  heroColor: string;
  latitude: number;
  longitude: number;
  kind: EventKind;
  subcategory: EventSubcategory;
  friendInterested: number;
  friendGoing: number;
  postedByRole: UserRole;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  flyerTags: FlyerTag[];
}

export interface UserSetup {
  id?: string;
  email: string;
  profileName: string;
  profileImageUrl: string;
  city: string;
  interests: string[];
  role: UserRole;
  tasteAnswers: EventTasteAnswers;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface EventDraft {
  title: string;
  promoter: string;
  startAtIso: string;
  endAtIso: string;
  venue: string;
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  category: string;
  kind: EventKind;
  subcategory: EventSubcategory;
  ageRating: string;
  tags: string[];
  priceLabel: string;
  ticketUrl: string;
  flyerImageUrl: string;
  heroColor: string;
  description: string;
  flyerTags: FlyerTagDraft[];
}

export interface EntityProfile {
  id: string;
  ownerUserId?: string;
  name: string;
  handle: string;
  kind: EntityKind;
  isPublic: boolean;
  bio?: string;
  avatarUrl?: string;
}

export interface EntityPageData {
  entity: EntityProfile;
  uploadedEvents: EventItem[];
  involvedEvents: EventItem[];
}

export interface FlyerTag {
  id: string;
  eventId: string;
  entityId: string;
  entityName: string;
  entityKind: EntityKind;
  isPublic: boolean;
  x: number;
  y: number;
}

export interface FlyerTagDraft {
  entityName: string;
  entityKind: EntityKind;
  isPublic: boolean;
  x: number;
  y: number;
}

export type ReportReason =
  | 'scam_or_fraud'
  | 'wrong_details'
  | 'harassment_or_hate'
  | 'spam'
  | 'other';

export type InteractionMap = Record<string, IntentState>;

export interface DirectMessageFriend {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

export interface DirectMessageThread {
  id: string;
  friendId: string;
  updatedAtIso: string;
  lastMessagePreview: string;
}

export interface DirectMessageItem {
  id: string;
  threadId: string;
  sender: 'self' | 'friend';
  text: string;
  flyerEventId?: string;
  createdAtIso: string;
}

export interface DirectInboxData {
  threads: DirectMessageThread[];
  messages: DirectMessageItem[];
}
