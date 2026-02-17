import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { BottomNav } from './src/components/BottomNav';
import { AUSTIN_EVENTS, DEFAULT_USER } from './src/mockData';
import { EventDetailScreen } from './src/screens/EventDetailScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { theme } from './src/theme';
import { InteractionMap, IntentState, TabKey, UserSetup } from './src/types';

function setIntentInMap(
  current: InteractionMap,
  eventId: string,
  intent: IntentState,
): InteractionMap {
  const next = { ...current };
  if (!intent) {
    delete next[eventId];
    return next;
  }
  next[eventId] = intent;
  return next;
}

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('Feed');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [user, setUser] = useState<UserSetup>(DEFAULT_USER);
  const [interactions, setInteractions] = useState<InteractionMap>({
    evt_1: 'interested',
    evt_3: 'going',
  });

  const selectedEvent = useMemo(
    () => AUSTIN_EVENTS.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId],
  );

  const onToggleInterested = (eventId: string) => {
    setInteractions((prev) => {
      const current = prev[eventId];
      if (current === 'going') {
        return prev;
      }
      const nextIntent: IntentState = current === 'interested' ? undefined : 'interested';
      return setIntentInMap(prev, eventId, nextIntent);
    });
  };

  const onSetGoing = (eventId: string) => {
    setInteractions((prev) => setIntentInMap(prev, eventId, 'going'));
  };

  const onSetIntent = (eventId: string, intent: IntentState) => {
    setInteractions((prev) => setIntentInMap(prev, eventId, intent));
  };

  const onOpenEvent = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  if (!onboardingComplete) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen
          onComplete={(city, interests, role) => {
            setUser({ city, interests, role });
            setOnboardingComplete(true);
          }}
        />
      </>
    );
  }

  if (selectedEvent) {
    return (
      <>
        <StatusBar style="light" />
        <EventDetailScreen
          event={selectedEvent}
          intent={interactions[selectedEvent.id]}
          onBack={() => setSelectedEventId(null)}
          onToggleInterested={() => onToggleInterested(selectedEvent.id)}
          onSetGoing={() => onSetGoing(selectedEvent.id)}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {activeTab === 'Feed' && (
          <FeedScreen
            events={AUSTIN_EVENTS}
            interactions={interactions}
            user={user}
            onOpenEvent={onOpenEvent}
            onToggleInterested={onToggleInterested}
            onSetGoing={onSetGoing}
          />
        )}

        {activeTab === 'Explore' && <ExploreScreen events={AUSTIN_EVENTS} onOpenEvent={onOpenEvent} />}

        {activeTab === 'Upload' && <UploadScreen userRole={user.role} />}

        {activeTab === 'Profile' && (
          <ProfileScreen
            user={user}
            events={AUSTIN_EVENTS}
            interactions={interactions}
            onOpenEvent={onOpenEvent}
            onSetIntent={onSetIntent}
          />
        )}
      </View>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    flex: 1,
  },
});
