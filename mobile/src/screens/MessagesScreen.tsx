import { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { DM_QUICK_TEXTS } from '../mockData';
import { ThemePalette, useAppTheme } from '../theme';
import { DirectInboxData, DirectMessageFriend, EventItem, UserSetup } from '../types';

interface MessagesScreenProps {
  user: UserSetup;
  events: EventItem[];
  friends: DirectMessageFriend[];
  inbox: DirectInboxData;
  selectedThreadId: string | null;
  pendingFlyerEventId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onSendMessage: (payload: { friendId: string; text: string; flyerEventId?: string }) => void;
  onOpenEvent: (eventId: string) => void;
  onClearPendingFlyer: () => void;
}

function formatTimeLabel(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function MessagesScreen({
  user,
  events,
  friends,
  inbox,
  selectedThreadId,
  pendingFlyerEventId,
  onSelectThread,
  onSendMessage,
  onOpenEvent,
  onClearPendingFlyer,
}: MessagesScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState('');
  const [attachFlyer, setAttachFlyer] = useState(true);

  const friendById = useMemo(() => {
    const map = new Map<string, DirectMessageFriend>();
    for (const friend of friends) {
      map.set(friend.id, friend);
    }
    return map;
  }, [friends]);

  const thread = useMemo(
    () => inbox.threads.find((item) => item.id === selectedThreadId) ?? null,
    [inbox.threads, selectedThreadId],
  );

  const activeFriend = thread ? friendById.get(thread.friendId) ?? null : null;

  const messages = useMemo(() => {
    if (!thread) {
      return [];
    }
    return inbox.messages
      .filter((item) => item.threadId === thread.id)
      .sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
  }, [inbox.messages, thread]);

  const pendingFlyer = pendingFlyerEventId
    ? events.find((event) => event.id === pendingFlyerEventId) ?? null
    : null;

  const send = () => {
    if (!activeFriend) {
      return;
    }

    const text = draft.trim();
    const flyerEventId = attachFlyer ? pendingFlyer?.id : undefined;
    if (!text && !flyerEventId) {
      return;
    }

    onSendMessage({
      friendId: activeFriend.id,
      text,
      flyerEventId,
    });
    setDraft('');
  };

  const sendQuick = (text: string) => {
    if (!activeFriend) {
      return;
    }
    onSendMessage({
      friendId: activeFriend.id,
      text,
      flyerEventId: attachFlyer ? pendingFlyer?.id : undefined,
    });
  };

  if (!thread || !activeFriend) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenBackdrop />
        <View style={styles.container}>
          <Text style={styles.title}>Coordinate</Text>
          <Text style={styles.subtitle}>Send flyers + quick plans to friends.</Text>

          {pendingFlyer && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>Ready to send</Text>
              <Text style={styles.pendingName}>{pendingFlyer.title}</Text>
              <Text style={styles.pendingMeta}>
                {pendingFlyer.dateLabel} - {pendingFlyer.venue}
              </Text>
              <Pressable onPress={onClearPendingFlyer}>
                <Text style={styles.pendingClear}>Clear flyer</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.sectionTitle}>Start with a friend</Text>
          <View style={styles.friendRow}>
            {friends.map((friend) => (
              <Pressable
                key={friend.id}
                style={styles.friendChip}
                onPress={() => {
                  const existing = inbox.threads.find((item) => item.friendId === friend.id);
                  onSelectThread(existing?.id ?? `thread_${friend.id}`);
                  if (pendingFlyer) {
                    setDraft(DM_QUICK_TEXTS[0]);
                  }
                }}
              >
                <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                <Text style={styles.friendName}>{friend.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Recent conversations</Text>
          <ScrollView contentContainerStyle={styles.threadList}>
            {inbox.threads.map((item) => {
              const friend = friendById.get(item.friendId);
              if (!friend) {
                return null;
              }
              return (
                <Pressable key={item.id} style={styles.threadRow} onPress={() => onSelectThread(item.id)}>
                  <Text style={styles.threadAvatar}>{friend.avatar}</Text>
                  <View style={styles.threadMain}>
                    <Text style={styles.threadName}>{friend.name}</Text>
                    <Text style={styles.threadPreview} numberOfLines={1}>
                      {item.lastMessagePreview}
                    </Text>
                  </View>
                  <Text style={styles.threadHandle}>{friend.handle}</Text>
                </Pressable>
              );
            })}
            {inbox.threads.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyLabel}>No messages yet.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <View style={styles.container}>
        <View style={styles.threadHeader}>
          <Pressable onPress={() => onSelectThread(null)} style={styles.backBtn}>
            <Text style={styles.backBtnLabel}>Back</Text>
          </Pressable>
          <View>
            <Text style={styles.threadHeaderName}>{activeFriend.name}</Text>
            <Text style={styles.threadHeaderHandle}>{activeFriend.handle} - coordinate</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.messageList}>
          {messages.map((message) => {
            const mine = message.sender === 'self';
            const attachedEvent = message.flyerEventId
              ? events.find((event) => event.id === message.flyerEventId) ?? null
              : null;
            return (
              <View key={message.id} style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapFriend]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleFriend]}>
                  {message.text.length > 0 && <Text style={styles.bubbleText}>{message.text}</Text>}
                  {attachedEvent && (
                    <Pressable style={styles.flyerCard} onPress={() => onOpenEvent(attachedEvent.id)}>
                      <ImageBackground
                        source={{ uri: attachedEvent.flyerImageUrl }}
                        style={styles.flyerImage}
                        imageStyle={styles.flyerImageAsset}
                      >
                        <View style={styles.flyerTint} />
                        <View style={styles.flyerInfo}>
                          <Text style={styles.flyerTitle} numberOfLines={1}>
                            {attachedEvent.title}
                          </Text>
                          <Text style={styles.flyerMeta} numberOfLines={1}>
                            {attachedEvent.dateLabel} - {attachedEvent.venue}
                          </Text>
                        </View>
                      </ImageBackground>
                    </Pressable>
                  )}
                  <Text style={styles.bubbleTime}>{formatTimeLabel(message.createdAtIso)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {pendingFlyer && (
          <View style={styles.attachRow}>
            <Pressable
              style={[styles.attachChip, attachFlyer && styles.attachChipActive]}
              onPress={() => setAttachFlyer((prev) => !prev)}
            >
              <Text style={[styles.attachLabel, attachFlyer && styles.attachLabelActive]}>
                {attachFlyer ? 'Flyer attached' : 'Attach flyer'}
              </Text>
            </Pressable>
            <Pressable onPress={onClearPendingFlyer}>
              <Text style={styles.pendingClear}>Clear</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.quickRow}>
          {DM_QUICK_TEXTS.map((option) => (
            <Pressable key={option} style={styles.quickChip} onPress={() => sendQuick(option)}>
              <Text style={styles.quickLabel}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            placeholder={`Message ${activeFriend.name}...`}
            placeholderTextColor={theme.textMuted}
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendBtnLabel}>Send</Text>
          </Pressable>
        </View>
        <Text style={styles.selfHandle}>{user.profileName || 'You'}</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 12,
  },
  pendingCard: {
    borderWidth: 1,
    borderColor: '#ffffff26',
    borderRadius: 14,
    backgroundColor: '#ffffff10',
    padding: 10,
    gap: 2,
  },
  pendingTitle: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  pendingName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pendingMeta: {
    color: theme.textMuted,
    fontSize: 11,
  },
  pendingClear: {
    color: theme.accentWarm,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  friendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  friendChip: {
    borderWidth: 1,
    borderColor: '#ffffff28',
    borderRadius: 12,
    backgroundColor: '#ffffff0c',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 74,
  },
  friendAvatar: {
    fontSize: 18,
  },
  friendName: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  threadList: {
    gap: 8,
    paddingBottom: 28,
  },
  threadRow: {
    borderWidth: 1,
    borderColor: '#ffffff24',
    borderRadius: 12,
    backgroundColor: '#ffffff0b',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  threadAvatar: {
    fontSize: 20,
  },
  threadMain: {
    flex: 1,
    gap: 2,
  },
  threadName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  threadPreview: {
    color: theme.textMuted,
    fontSize: 11,
  },
  threadHandle: {
    color: theme.textMuted,
    fontSize: 11,
  },
  emptyBox: {
    paddingVertical: 22,
    alignItems: 'center',
  },
  emptyLabel: {
    color: theme.textMuted,
    fontSize: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff2d',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff10',
  },
  backBtnLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  threadHeaderName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  threadHeaderHandle: {
    color: theme.textMuted,
    fontSize: 11,
  },
  messageList: {
    gap: 8,
    paddingVertical: 6,
    paddingBottom: 14,
  },
  bubbleWrap: {
    width: '100%',
  },
  bubbleWrapMine: {
    alignItems: 'flex-end',
  },
  bubbleWrapFriend: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  bubbleMine: {
    backgroundColor: '#1ca992',
  },
  bubbleFriend: {
    backgroundColor: '#213544',
    borderWidth: 1,
    borderColor: '#ffffff29',
  },
  bubbleText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTime: {
    color: '#d6e9f2',
    fontSize: 10,
    opacity: 0.8,
    alignSelf: 'flex-end',
  },
  flyerCard: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff42',
  },
  flyerImage: {
    width: 220,
    height: 120,
    justifyContent: 'flex-end',
  },
  flyerImageAsset: {
    width: '100%',
    height: '100%',
  },
  flyerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000064',
  },
  flyerInfo: {
    padding: 8,
    gap: 2,
  },
  flyerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  flyerMeta: {
    color: '#f5f5f5',
    fontSize: 10,
  },
  attachRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachChip: {
    borderWidth: 1,
    borderColor: '#ffffff32',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attachChipActive: {
    borderColor: theme.primary,
    backgroundColor: '#ffffff12',
  },
  attachLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  attachLabelActive: {
    color: theme.text,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: '#ffffff2f',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff0c',
  },
  quickLabel: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
  composerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#101b24',
    borderWidth: 1,
    borderColor: '#ffffff31',
    borderRadius: 12,
    color: theme.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
  },
  sendBtn: {
    borderRadius: 12,
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  selfHandle: {
    color: theme.textMuted,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  });

