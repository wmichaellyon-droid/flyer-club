import { Linking, Platform, Share } from 'react-native';
import { EventItem } from './types';

const APP_SCHEME = 'flyerclub';
const WEB_EVENT_BASE_URL = 'https://flyerclub.app/e';
const SHARE_UTM_QUERY = 'utm_source=flyerclub_app&utm_medium=share&utm_campaign=event_invite';

function encodeEventId(eventId: string) {
  return encodeURIComponent(eventId);
}

export function buildEventLinks(eventId: string) {
  const encodedEventId = encodeEventId(eventId);
  const appUrl = `${APP_SCHEME}://event/${encodedEventId}`;
  const webUrl = `${WEB_EVENT_BASE_URL}/${encodedEventId}?${SHARE_UTM_QUERY}`;
  return { appUrl, webUrl };
}

export function buildEventShareMessage(event: EventItem) {
  const { webUrl, appUrl } = buildEventLinks(event.id);

  return [
    'Flyer Club invite',
    event.title,
    `${event.dateLabel} | ${event.timeLabel}`,
    `${event.venue} | ${event.neighborhood}`,
    `Price: ${event.priceLabel}`,
    '',
    `Open event: ${webUrl}`,
    `Direct app link: ${appUrl}`,
  ].join('\n');
}

export async function shareEvent(event: EventItem) {
  const { webUrl } = buildEventLinks(event.id);
  await Share.share({
    title: event.title,
    message: buildEventShareMessage(event),
    url: webUrl,
  });
}

export async function shareEventBySms(event: EventItem) {
  const body = encodeURIComponent(buildEventShareMessage(event));
  const separator = Platform.OS === 'ios' ? '&' : '?';
  await Linking.openURL(`sms:${separator}body=${body}`);
}

export function parseSharedEventId(url: string) {
  const appMatch = url.match(/^flyerclub:\/\/event\/([^/?#]+)/i);
  if (appMatch?.[1]) {
    return decodeURIComponent(appMatch[1]);
  }

  const webMatch = url.match(/^https?:\/\/flyerclub\.app\/e\/([^/?#]+)/i);
  if (webMatch?.[1]) {
    return decodeURIComponent(webMatch[1]);
  }

  return null;
}
