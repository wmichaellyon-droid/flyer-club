import * as Calendar from 'expo-calendar';
import { EventItem } from '../types';

async function getDefaultCalendarId() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const primary =
    calendars.find((calendar) => calendar.allowsModifications && calendar.isPrimary) ??
    calendars.find((calendar) => calendar.allowsModifications) ??
    null;

  return primary?.id ?? null;
}

export async function addEventToCalendar(event: EventItem) {
  const permissions = await Calendar.getCalendarPermissionsAsync();
  let granted = permissions.granted;
  if (!granted) {
    const requested = await Calendar.requestCalendarPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) {
    return { ok: false, message: 'Calendar permission denied.' };
  }

  const calendarId = await getDefaultCalendarId();
  if (!calendarId) {
    return { ok: false, message: 'No writable calendar found.' };
  }

  const startDate = new Date(event.startAtIso);
  const endDate = new Date(event.endAtIso);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { ok: false, message: 'Event date is invalid.' };
  }

  await Calendar.createEventAsync(calendarId, {
    title: event.title,
    startDate,
    endDate,
    location: `${event.venue}, ${event.address}`,
    notes: `${event.description}\n\nTickets: ${event.ticketUrl}`,
    timeZone: 'America/Chicago',
  });

  return { ok: true, message: 'Added to calendar.' };
}
