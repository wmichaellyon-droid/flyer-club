import AsyncStorage from '@react-native-async-storage/async-storage';
import { DirectInboxData, DirectMessageFriend, DirectMessageItem, DirectMessageThread } from '../types';

const STORAGE_PREFIX = 'flyerclub_dm_v1';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function seedInbox(friends: DirectMessageFriend[]): DirectInboxData {
  if (friends.length === 0) {
    return { threads: [], messages: [] };
  }

  const friend = friends[0];
  const now = Date.now();
  const threadId = `thread_${friend.id}`;
  const firstTime = new Date(now - 1000 * 60 * 35).toISOString();
  const secondTime = new Date(now - 1000 * 60 * 9).toISOString();

  return {
    threads: [
      {
        id: threadId,
        friendId: friend.id,
        updatedAtIso: secondTime,
        lastMessagePreview: 'I am there. Meet near the front?',
      },
    ],
    messages: [
      {
        id: `msg_${threadId}_1`,
        threadId,
        sender: 'friend',
        text: 'This lineup looks so good. Are you coming?',
        createdAtIso: firstTime,
      },
      {
        id: `msg_${threadId}_2`,
        threadId,
        sender: 'self',
        text: 'I am there. Meet near the front?',
        createdAtIso: secondTime,
      },
    ],
  };
}

function sortThreads(threads: DirectMessageThread[]) {
  return [...threads].sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
}

export async function loadDirectInbox(userId: string, friends: DirectMessageFriend[]): Promise<DirectInboxData> {
  if (!userId) {
    return seedInbox(friends);
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) {
      return seedInbox(friends);
    }
    const parsed = JSON.parse(raw) as DirectInboxData;
    if (!parsed || !Array.isArray(parsed.threads) || !Array.isArray(parsed.messages)) {
      return seedInbox(friends);
    }
    return {
      threads: sortThreads(parsed.threads),
      messages: parsed.messages,
    };
  } catch {
    return seedInbox(friends);
  }
}

export async function saveDirectInbox(userId: string, inbox: DirectInboxData) {
  if (!userId) {
    return;
  }
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(inbox));
}

export function upsertThreadForFriend(
  inbox: DirectInboxData,
  friendId: string,
  updatedAtIso: string,
  preview: string,
) {
  const existing = inbox.threads.find((thread) => thread.friendId === friendId);
  const thread: DirectMessageThread = existing
    ? { ...existing, updatedAtIso, lastMessagePreview: preview }
    : {
        id: `thread_${friendId}`,
        friendId,
        updatedAtIso,
        lastMessagePreview: preview,
      };

  const remaining = inbox.threads.filter((item) => item.id !== thread.id);
  return {
    ...inbox,
    threads: sortThreads([thread, ...remaining]),
  };
}

export function sendDirectMessage(
  inbox: DirectInboxData,
  params: {
    friendId: string;
    text: string;
    flyerEventId?: string;
  },
) {
  const now = new Date().toISOString();
  const next = upsertThreadForFriend(inbox, params.friendId, now, params.text || 'Sent a flyer');
  const thread = next.threads.find((item) => item.friendId === params.friendId);
  if (!thread) {
    return next;
  }

  const message: DirectMessageItem = {
    id: `msg_${thread.id}_${Date.now()}`,
    threadId: thread.id,
    sender: 'self',
    text: params.text,
    flyerEventId: params.flyerEventId,
    createdAtIso: now,
  };

  return {
    threads: next.threads,
    messages: [...next.messages, message],
  };
}
