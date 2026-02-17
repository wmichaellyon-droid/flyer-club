import { logAnalytics } from './backend';

export type AnalyticsEventName =
  | 'app_opened'
  | 'feed_viewed'
  | 'flyer_impression'
  | 'interested_toggled'
  | 'going_clicked'
  | 'saved_clicked'
  | 'share_clicked'
  | 'ticket_clicked'
  | 'event_created'
  | 'event_reported'
  | 'user_blocked'
  | 'calendar_added'
  | 'radius_changed';

export function trackEvent(
  userId: string,
  eventName: AnalyticsEventName,
  payload: Record<string, unknown> = {},
) {
  void logAnalytics(userId, eventName, payload);
}
