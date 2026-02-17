import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from './src/components/BottomNav';
import { ScreenBackdrop } from './src/components/ScreenBackdrop';
import { AUSTIN_EVENTS, DEFAULT_USER, DM_FRIENDS } from './src/mockData';
import { shareEvent, shareEventBySms, parseSharedEventId } from './src/share';
import { EventDetailScreen } from './src/screens/EventDetailScreen';
import { EntityProfileScreen } from './src/screens/EntityProfileScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MapScreen } from './src/screens/MapScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { addEventToCalendar } from './src/services/calendar';
import {
  blockUser,
  createEventSubmission,
  ensureAuthUser,
  fetchEntityPageData,
  fetchBlockedUserIds,
  fetchEvents,
  fetchInteractions,
  fetchProfile,
  logShare,
  reportEvent,
  saveInteraction,
  setEventModerationStatus,
  upsertProfile,
} from './src/services/backend';
import {
  loadDirectInbox,
  saveDirectInbox,
  sendDirectMessage,
  upsertThreadForFriend,
} from './src/services/directMessages';
import { trackEvent } from './src/services/analytics';
import { cancelEventReminders, initializeNotifications, scheduleEventReminders } from './src/services/reminders';
import { AppThemeProvider, ThemeMode, useAppTheme } from './src/theme';
import {
  DirectInboxData,
  EventTasteAnswers,
  FollowRequest,
  InteractionMap,
  IntentState,
  RadiusFilter,
  ReportReason,
  TabKey,
  UserLocation,
  UserSetup,
} from './src/types';

const AUSTIN_CENTER: UserLocation = {
  latitude: 30.2672,
  longitude: -97.7431,
};

function setIntentInMap(current: InteractionMap, eventId: string, intent: IntentState): InteractionMap {
  const next = { ...current };
  if (!intent) {
    delete next[eventId];
    return next;
  }
  next[eventId] = intent;
  return next;
}

function inferInterestsFromAnswers(answers: EventTasteAnswers) {
  const joined = Object.values(answers).join(' ').toLowerCase();
  const inferred = new Set<string>();

  if (
    joined.includes('concert') ||
    joined.includes('punk') ||
    joined.includes('metal') ||
    joined.includes('rock') ||
    joined.includes('pop') ||
    joined.includes('house')
  ) {
    inferred.add('Nightlife');
  }
  if (joined.includes('film') || joined.includes('screening')) {
    inferred.add('Film');
  }
  if (joined.includes('community') || joined.includes('mutual aid') || joined.includes('meetup')) {
    inferred.add('Community');
  }
  if (joined.includes('diy') || joined.includes('zine') || joined.includes('gallery') || joined.includes('art')) {
    inferred.add('DIY');
    inferred.add('Zines');
  }
  if (joined.includes('comedy')) {
    inferred.add('Comedy');
  }
  if (joined.includes('free') || joined.includes('under $20')) {
    inferred.add('Community');
  }
  if (inferred.size === 0) {
    inferred.add('DIY');
    inferred.add('Film');
  }
  return Array.from(inferred);
}

function LoadingScreen({ label }: { label: string }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <StatusBar style="light" />
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingTitle}>Flyer Club</Text>
        <Text style={styles.loadingSub}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [authLoading, setAuthLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string>('');
  const [loginComplete, setLoginComplete] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('Feed');
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>(10);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [pendingSharedEventId, setPendingSharedEventId] = useState<string | null>(null);
  const [user, setUser] = useState<UserSetup>(DEFAULT_USER);
  const [events, setEvents] = useState(AUSTIN_EVENTS);
  const [submissions, setSubmissions] = useState<typeof AUSTIN_EVENTS>([]);
  const [userLocation, setUserLocation] = useState<UserLocation>(AUSTIN_CENTER);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<InteractionMap>({});
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([
    {
      id: 'follow_req_1',
      requesterId: 'usr_noise_kid',
      requesterName: 'Noise Kid',
      requesterHandle: '@noise.kid',
    },
    {
      id: 'follow_req_2',
      requesterId: 'usr_filmclub_ana',
      requesterName: 'Ana Filmclub',
      requesterHandle: '@ana.filmclub',
    },
  ]);
  const [directInbox, setDirectInbox] = useState<DirectInboxData>({ threads: [], messages: [] });
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pendingDmFlyerEventId, setPendingDmFlyerEventId] = useState<string | null>(null);
  const [dmLoaded, setDmLoaded] = useState(false);
  const authStateRef = useRef({ loginComplete, onboardingComplete });

  authStateRef.current = { loginComplete, onboardingComplete };

  const knownEvents = useMemo(() => {
    const map = new Map<string, (typeof AUSTIN_EVENTS)[number]>();
    for (const item of [...events, ...submissions]) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  }, [events, submissions]);

  const selectedEvent = useMemo(
    () => knownEvents.find((event) => event.id === selectedEventId) ?? null,
    [knownEvents, selectedEventId],
  );

  const refreshData = async (userId: string) => {
    const [fetchedInteractions, fetchedBlocked] = await Promise.all([
      fetchInteractions(userId),
      fetchBlockedUserIds(userId),
    ]);
    setInteractions(fetchedInteractions);
    setBlockedUserIds(fetchedBlocked);

    const [fetchedEvents, fetchedSubmissions] = await Promise.all([
      fetchEvents({ includeUnmoderated: false }),
      fetchEvents({ includeUnmoderated: true, onlyUserId: userId }),
    ]);
    setEvents(fetchedEvents.filter((event) => !fetchedBlocked.includes(event.postedByUserId)));
    setSubmissions(fetchedSubmissions);
  };

  useEffect(() => {
    initializeNotifications();
    let active = true;

    (async () => {
      const session = await ensureAuthUser();
      if (!active) {
        return;
      }
      setAuthUserId(session.id);

      const profile = await fetchProfile(session.id);
      if (!active) {
        return;
      }
      if (profile) {
        setUser(profile);
        setThemeMode(profile.themeMode);
        setLoginComplete(profile.profileName.trim().length > 0 && profile.email.trim().length > 0);
        setOnboardingComplete(profile.city.trim().length > 0 && profile.interests.length > 0);
      }

      await refreshData(session.id);
      const inbox = await loadDirectInbox(session.id, DM_FRIENDS);
      if (active) {
        setDirectInbox(inbox);
        setDmLoaded(true);
      }
      trackEvent(session.id, 'app_opened', { loginComplete: Boolean(profile) });
      if (active) {
        setAuthLoading(false);
      }
    })().catch(async () => {
      if (!active) {
        return;
      }
      setAuthUserId('local-dev-user');
      setThemeMode('dark');
      setEvents(AUSTIN_EVENTS);
      setSubmissions([]);
      setInteractions({
        evt_1: 'interested',
        evt_3: 'going',
      });
      const inbox = await loadDirectInbox('local-dev-user', DM_FRIENDS);
      if (active) {
        setDirectInbox(inbox);
        setDmLoaded(true);
      }
      setAuthLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authUserId || !loginComplete || !onboardingComplete) {
      return;
    }
    void upsertProfile(authUserId, user);
  }, [authUserId, loginComplete, onboardingComplete, user]);

  useEffect(() => {
    if (!authUserId || !dmLoaded) {
      return;
    }
    void saveDirectInbox(authUserId, directInbox);
  }, [authUserId, dmLoaded, directInbox]);

  useEffect(() => {
    if (!authUserId || !loginComplete || !onboardingComplete) {
      return;
    }

    let active = true;
    (async () => {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      let granted = currentPermission.status === 'granted';

      if (!granted) {
        const request = await Location.requestForegroundPermissionsAsync();
        granted = request.status === 'granted';
      }

      if (!granted || !active) {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!active) {
        return;
      }
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    })().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [authUserId, loginComplete, onboardingComplete]);

  useEffect(() => {
    const openFromUrl = (url: string) => {
      const eventId = parseSharedEventId(url);
      if (!eventId) {
        return;
      }
      setPendingSharedEventId(eventId);
    };

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          openFromUrl(initialUrl);
        }
      })
      .catch(() => undefined);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      openFromUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!pendingSharedEventId || !loginComplete || !onboardingComplete) {
      return;
    }
    const eventExists = knownEvents.some((event) => event.id === pendingSharedEventId);
    if (!eventExists) {
      return;
    }
    setSelectedEventId(pendingSharedEventId);
    setPendingSharedEventId(null);
  }, [pendingSharedEventId, loginComplete, onboardingComplete, knownEvents]);

  useEffect(() => {
    if (activeTab === 'Feed' && authUserId) {
      trackEvent(authUserId, 'feed_viewed', { radiusFilter });
    }
  }, [activeTab, authUserId, radiusFilter]);

  const updateIntent = async (eventId: string, intent: IntentState) => {
    const event = knownEvents.find((item) => item.id === eventId);
    setInteractions((prev) => setIntentInMap(prev, eventId, intent));
    setUser((prev) => {
      const withoutEvent = prev.publicInterestedEventIds.filter((id) => id !== eventId);
      if (intent === 'interested') {
        return {
          ...prev,
          publicInterestedEventIds: [...withoutEvent, eventId],
        };
      }
      return {
        ...prev,
        publicInterestedEventIds: withoutEvent,
      };
    });
    await saveInteraction(authUserId, eventId, intent);
    if (event) {
      await scheduleEventReminders(event, intent);
      if (!intent) {
        await cancelEventReminders(eventId);
      }
    }
  };

  const onToggleInterested = (eventId: string) => {
    const current = interactions[eventId];
    if (current === 'going') {
      return;
    }
    const nextIntent: IntentState = current === 'interested' ? undefined : 'interested';
    void updateIntent(eventId, nextIntent);
    trackEvent(authUserId, 'interested_toggled', { eventId, nextIntent: nextIntent ?? 'none' });
  };

  const onSetGoing = (eventId: string) => {
    void updateIntent(eventId, 'going');
    trackEvent(authUserId, 'going_clicked', { eventId });
  };

  const onSetIntent = (eventId: string, intent: IntentState) => {
    void updateIntent(eventId, intent);
    if (intent === 'saved') {
      trackEvent(authUserId, 'saved_clicked', { eventId });
    }
  };

  const onUpdateProfilePrivacy = (patch: {
    profileVisibility?: 'public' | 'private';
    showInterestedOnProfile?: boolean;
  }) => {
    setUser((prev) => ({
      ...prev,
      profileVisibility: patch.profileVisibility ?? prev.profileVisibility,
      showInterestedOnProfile: patch.showInterestedOnProfile ?? prev.showInterestedOnProfile,
    }));
  };

  const onUpdateThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    setUser((prev) => ({ ...prev, themeMode: mode }));
  };

  const onSetInterestedVisibility = (eventId: string, visible: boolean) => {
    setUser((prev) => {
      const nextIds = prev.publicInterestedEventIds.filter((id) => id !== eventId);
      return {
        ...prev,
        publicInterestedEventIds: visible ? [...nextIds, eventId] : nextIds,
      };
    });
  };

  const onRespondFollowRequest = (requestId: string, action: 'approve' | 'decline') => {
    setFollowRequests((prev) => prev.filter((item) => item.id !== requestId));
    trackEvent(authUserId, 'profile_follow_request_action', { requestId, action });
  };

  const onOpenEvent = (eventId: string) => {
    setSelectedEntityId(null);
    setSelectedEventId(eventId);
  };

  const onOpenEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const onOpenDmForEvent = (eventId: string) => {
    setPendingDmFlyerEventId(eventId);
    setSelectedEventId(null);
    setActiveTab('Messages');
    trackEvent(authUserId, 'dm_flyer_intent', { eventId });
  };

  const onSelectThread = (threadId: string | null) => {
    if (!threadId) {
      setSelectedThreadId(null);
      return;
    }

    const existing = directInbox.threads.find((thread) => thread.id === threadId);
    if (existing) {
      setSelectedThreadId(threadId);
      return;
    }

    if (threadId.startsWith('thread_')) {
      const friendId = threadId.slice('thread_'.length);
      const next = upsertThreadForFriend(directInbox, friendId, new Date().toISOString(), 'New chat');
      setDirectInbox(next);
      setSelectedThreadId(`thread_${friendId}`);
      return;
    }

    setSelectedThreadId(threadId);
  };

  const onSendDirectMessage = (payload: { friendId: string; text: string; flyerEventId?: string }) => {
    const next = sendDirectMessage(directInbox, payload);
    setDirectInbox(next);
    const thread = next.threads.find((item) => item.friendId === payload.friendId);
    if (thread) {
      setSelectedThreadId(thread.id);
    }
    trackEvent(authUserId, 'dm_sent', {
      friendId: payload.friendId,
      hasFlyer: Boolean(payload.flyerEventId),
    });
  };

  const onShareEvent = async (event: (typeof AUSTIN_EVENTS)[number], destination: 'native' | 'sms') => {
    if (destination === 'native') {
      await shareEvent(event);
    } else {
      await shareEventBySms(event);
    }
    await logShare(authUserId, event.id, destination);
    trackEvent(authUserId, 'share_clicked', { eventId: event.id, destination });
  };

  const onGetTickets = async (event: (typeof AUSTIN_EVENTS)[number]) => {
    await Linking.openURL(event.ticketUrl);
    trackEvent(authUserId, 'ticket_clicked', { eventId: event.id });
  };

  const onAddToCalendar = async (event: (typeof AUSTIN_EVENTS)[number]) => {
    const result = await addEventToCalendar(event);
    if (result.ok) {
      trackEvent(authUserId, 'calendar_added', { eventId: event.id });
    }
  };

  const onReportEvent = async (
    event: (typeof AUSTIN_EVENTS)[number],
    reason: ReportReason,
    details: string,
  ) => {
    await reportEvent(authUserId, event.id, reason, details);
    trackEvent(authUserId, 'event_reported', { eventId: event.id, reason });
  };

  const onBlockOrganizer = async (event: (typeof AUSTIN_EVENTS)[number]) => {
    await blockUser(authUserId, event.postedByUserId);
    trackEvent(authUserId, 'user_blocked', { blockedUserId: event.postedByUserId, eventId: event.id });
    setSelectedEventId(null);
    await refreshData(authUserId);
  };

  if (authLoading) {
    return (
      <AppThemeProvider mode={themeMode}>
        <LoadingScreen label="Initializing session..." />
      </AppThemeProvider>
    );
  }

  if (!loginComplete) {
    return (
      <AppThemeProvider mode={themeMode}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <LoginScreen
          onComplete={({ email, profileName, profileImageUrl, tasteAnswers }) => {
            const nextUser: UserSetup = {
              ...user,
              id: authUserId,
              email,
              profileName,
              profileImageUrl,
              tasteAnswers,
              interests: inferInterestsFromAnswers(tasteAnswers),
            };
            setUser(nextUser);
            setLoginComplete(true);
          }}
        />
      </AppThemeProvider>
    );
  }

  if (!onboardingComplete) {
    return (
      <AppThemeProvider mode={themeMode}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <OnboardingScreen
          initialUser={user}
          onComplete={(city, interests, role) => {
            setUser((prev) => ({ ...prev, id: authUserId, city, interests, role }));
            setOnboardingComplete(true);
          }}
        />
      </AppThemeProvider>
    );
  }

  if (selectedEntityId) {
    return (
      <AppThemeProvider mode={themeMode}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <EntityProfileScreen
          entityId={selectedEntityId}
          onBack={() => setSelectedEntityId(null)}
          onOpenEvent={(eventId) => {
            setSelectedEntityId(null);
            setSelectedEventId(eventId);
          }}
          onLoadEntityPage={(entityId) => fetchEntityPageData(authUserId, entityId)}
        />
      </AppThemeProvider>
    );
  }

  if (selectedEvent) {
    return (
      <AppThemeProvider mode={themeMode}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <EventDetailScreen
          event={selectedEvent}
          intent={interactions[selectedEvent.id]}
          onBack={() => setSelectedEventId(null)}
          onOpenEntity={onOpenEntity}
          onToggleInterested={() => onToggleInterested(selectedEvent.id)}
          onSetGoing={() => onSetGoing(selectedEvent.id)}
          onMessageFlyer={() => onOpenDmForEvent(selectedEvent.id)}
          onShareEvent={(destination) => onShareEvent(selectedEvent, destination)}
          onGetTickets={() => onGetTickets(selectedEvent)}
          onAddToCalendar={() => onAddToCalendar(selectedEvent)}
          onReportEvent={(reason, details) => onReportEvent(selectedEvent, reason, details)}
          onBlockOrganizer={() => onBlockOrganizer(selectedEvent)}
        />
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider mode={themeMode}>
      <SafeAreaView style={{ flex: 1, backgroundColor: themeMode === 'dark' ? '#000000' : '#ffffff' }}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1 }}>
          {activeTab === 'Feed' && (
          <FeedScreen
            events={events}
            interactions={interactions}
            user={user}
            userLocation={userLocation}
            radiusFilter={radiusFilter}
            onChangeRadius={(radius) => {
              setRadiusFilter(radius);
              trackEvent(authUserId, 'radius_changed', { radius });
            }}
            onOpenEvent={onOpenEvent}
            onToggleInterested={onToggleInterested}
            onSetGoing={onSetGoing}
            onMessageFlyer={onOpenDmForEvent}
            onShareEvent={onShareEvent}
            onGetTickets={onGetTickets}
            onFlyerImpression={(eventId) => trackEvent(authUserId, 'flyer_impression', { eventId })}
          />
        )}

        {activeTab === 'Map' && (
          <MapScreen
            events={events}
            interactions={interactions}
            user={user}
            userLocation={userLocation}
            radiusFilter={radiusFilter}
            onChangeRadius={(radius) => {
              setRadiusFilter(radius);
              trackEvent(authUserId, 'radius_changed', { radius });
            }}
            onOpenEvent={onOpenEvent}
            onToggleInterested={onToggleInterested}
            onSetGoing={onSetGoing}
            onMessageFlyer={onOpenDmForEvent}
            onUpdateUserLocation={setUserLocation}
            onShareEvent={onShareEvent}
            onGetTickets={onGetTickets}
          />
        )}

        {activeTab === 'Explore' && (
          <ExploreScreen
            events={events}
            userLocation={userLocation}
            radiusFilter={radiusFilter}
            onChangeRadius={(radius) => {
              setRadiusFilter(radius);
              trackEvent(authUserId, 'radius_changed', { radius });
            }}
            onOpenEvent={onOpenEvent}
          />
        )}

        {activeTab === 'Messages' && (
          <MessagesScreen
            user={user}
            events={knownEvents}
            friends={DM_FRIENDS}
            inbox={directInbox}
            selectedThreadId={selectedThreadId}
            pendingFlyerEventId={pendingDmFlyerEventId}
            onSelectThread={onSelectThread}
            onSendMessage={onSendDirectMessage}
            onOpenEvent={(eventId) => onOpenEvent(eventId)}
            onClearPendingFlyer={() => setPendingDmFlyerEventId(null)}
          />
        )}

        {activeTab === 'Upload' && (
          <UploadScreen
            userRole={user.role}
            submissions={submissions}
            onSubmitEvent={async (draft) => {
              const result = await createEventSubmission(authUserId, user.role, draft);
              trackEvent(authUserId, 'event_created', {
                moderationStatus: result.moderation.status,
                kind: draft.kind,
              });
              await refreshData(authUserId);
              return {
                moderationStatus: result.moderation.status,
                moderationReason: result.moderation.reason,
              };
            }}
            onModerateEvent={async (eventId, status, reason) => {
              await setEventModerationStatus(eventId, status, reason);
              await refreshData(authUserId);
            }}
          />
        )}

        {activeTab === 'Profile' && (
          <ProfileScreen
            user={user}
            events={events}
            interactions={interactions}
            followRequests={followRequests}
            onOpenEvent={onOpenEvent}
            onSetIntent={onSetIntent}
            onUpdateProfilePrivacy={onUpdateProfilePrivacy}
            onUpdateThemeMode={onUpdateThemeMode}
            onSetInterestedVisibility={onSetInterestedVisibility}
            onRespondFollowRequest={onRespondFollowRequest}
          />
        )}
        </View>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </SafeAreaView>
    </AppThemeProvider>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
  },
  loadingSub: {
    color: theme.textMuted,
    fontSize: 13,
  },
  });
