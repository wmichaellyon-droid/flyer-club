export type TabKey = 'Feed' | 'Explore' | 'Upload' | 'Profile';

export type IntentState = 'interested' | 'going' | 'saved' | undefined;

export type IntentFilter = 'Interested' | 'Going' | 'Saved';

export type UserRole = 'concert_lover' | 'event_enjoyer' | 'promoter';
export type EventKind = 'concert' | 'film' | 'meetup' | 'comedy' | 'arts';
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
  dateLabel: string;
  timeLabel: string;
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
  friendInterested: number;
  friendGoing: number;
  postedByRole: UserRole;
}

export interface UserSetup {
  email: string;
  profileName: string;
  profileImageUrl: string;
  city: string;
  interests: string[];
  role: UserRole;
  tasteAnswers: EventTasteAnswers;
}

export type InteractionMap = Record<string, IntentState>;
