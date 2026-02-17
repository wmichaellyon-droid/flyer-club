export type TabKey = 'Feed' | 'Explore' | 'Upload' | 'Profile';

export type IntentState = 'interested' | 'going' | 'saved' | undefined;

export type IntentFilter = 'Interested' | 'Going' | 'Saved';

export type UserRole = 'concert_lover' | 'event_enjoyer' | 'promoter';

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
  friendInterested: number;
  friendGoing: number;
  postedByRole: UserRole;
}

export interface UserSetup {
  city: string;
  interests: string[];
  role: UserRole;
}

export type InteractionMap = Record<string, IntentState>;
