import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { EventItem, IntentState } from '../types';

const REMINDER_KEY = 'flyerclub.reminders.v1';

type ReminderMap = Record<string, string[]>;

let notificationsInitialized = false;

async function loadReminderMap() {
  const raw = await AsyncStorage.getItem(REMINDER_KEY);
  if (!raw) {
    return {} as ReminderMap;
  }
  try {
    return JSON.parse(raw) as ReminderMap;
  } catch {
    return {} as ReminderMap;
  }
}

async function saveReminderMap(value: ReminderMap) {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(value));
}

export function initializeNotifications() {
  if (notificationsInitialized) {
    return;
  }
  notificationsInitialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function cancelEventReminders(eventId: string) {
  const map = await loadReminderMap();
  const ids = map[eventId] ?? [];
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // no-op
    }
  }
  delete map[eventId];
  await saveReminderMap(map);
}

export async function scheduleEventReminders(event: EventItem, intent: IntentState) {
  await cancelEventReminders(event.id);

  if (intent !== 'saved' && intent !== 'going') {
    return;
  }

  const permission = await Notifications.getPermissionsAsync();
  let granted = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) {
    const request = await Notifications.requestPermissionsAsync();
    granted = request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
  if (!granted) {
    return;
  }

  const startDate = new Date(event.startAtIso);
  if (Number.isNaN(startDate.getTime())) {
    return;
  }

  const twentyFourHoursBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
  const twoHoursBefore = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
  const now = Date.now();
  const scheduledIds: string[] = [];

  const reminders = [
    {
      when: twentyFourHoursBefore,
      title: `${event.title} is tomorrow`,
      body: `Starts at ${event.timeLabel} at ${event.venue}.`,
    },
    {
      when: twoHoursBefore,
      title: `${event.title} starts in 2 hours`,
      body: `Get ready for ${event.venue}.`,
    },
  ];

  for (const reminder of reminders) {
    if (reminder.when.getTime() <= now) {
      continue;
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.when,
      },
    });
    scheduledIds.push(id);
  }

  if (scheduledIds.length === 0) {
    return;
  }

  const map = await loadReminderMap();
  map[event.id] = scheduledIds;
  await saveReminderMap(map);
}
