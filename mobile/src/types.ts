export type TabKey = 'Feed' | 'Explore' | 'Upload' | 'Profile';

export type IntentState = 'interested' | 'going' | 'saved' | undefined;

export type IntentFilter = 'Interested' | 'Going' | 'Saved';

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
  heroColor: string;
  friendInterested: number;
  friendGoing: number;
}

export interface UserSetup {
  city: string;
  interests: string[];
}

export type InteractionMap = Record<string, IntentState>;
