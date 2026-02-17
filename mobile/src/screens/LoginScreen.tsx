import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { DEFAULT_USER, LOGIN_QUESTIONS } from '../mockData';
import { theme } from '../theme';
import { EventTasteAnswers } from '../types';

interface LoginScreenProps {
  onComplete: (payload: {
    email: string;
    profileName: string;
    profileImageUrl: string;
    tasteAnswers: EventTasteAnswers;
  }) => void;
}

const FALLBACK_BUBBLE_IMAGES = [
  'https://loremflickr.com/1080/1080/punk,concert,poster?lock=921',
  'https://loremflickr.com/1080/1080/film,poster,arthouse?lock=922',
  'https://loremflickr.com/1080/1080/community,event,poster?lock=923',
  'https://loremflickr.com/1080/1080/diy,zine,poster?lock=924',
];

const OPTION_IMAGE_MAP: { tokens: string[]; url: string }[] = [
  {
    tokens: ['punk', 'metal', 'rock', 'pop', 'concert', 'house show', 'dj'],
    url: 'https://loremflickr.com/1080/1080/punk,concert,poster?lock=905',
  },
  {
    tokens: ['film', 'screening', 'arthouse', 'matinee', 'cinema', 'documentary'],
    url: 'https://loremflickr.com/1080/1080/indie,film,poster?lock=902',
  },
  {
    tokens: ['community', 'mutual aid', 'meetup', 'gathering'],
    url: 'https://loremflickr.com/1080/1080/community,event,poster?lock=908',
  },
  {
    tokens: ['zine', 'gallery', 'workshop', 'diy', 'flea', 'art'],
    url: 'https://loremflickr.com/1080/1080/diy,workshop,poster?lock=903',
  },
  {
    tokens: ['poetry', 'comedy', 'open mic', 'improv'],
    url: 'https://loremflickr.com/1080/1080/poetry,poster,flyer?lock=906',
  },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function bubbleSlot(index: number, boardWidth: number, bubbleSize: number, boardHeight: number) {
  const left = 10;
  const right = Math.max(left, boardWidth - bubbleSize - 10);
  const center = Math.max(left, (boardWidth - bubbleSize) / 2 - 14);

  const slots = [
    { left, top: 12 },
    { left: right, top: 26 },
    { left: center, top: Math.max(100, boardHeight * 0.46) },
    { left: right - 14, top: Math.max(120, boardHeight * 0.6) },
  ];

  return slots[index % slots.length];
}

function pickBubbleImage(option: string, fallbackIndex: number) {
  const label = option.toLowerCase();
  for (const mapping of OPTION_IMAGE_MAP) {
    if (mapping.tokens.some((token) => label.includes(token))) {
      return mapping.url;
    }
  }

  return FALLBACK_BUBBLE_IMAGES[fallbackIndex % FALLBACK_BUBBLE_IMAGES.length];
}

export function LoginScreen({ onComplete }: LoginScreenProps) {
  const { width } = useWindowDimensions();

  const baseSteps = 3; // profileName, email, profileImage
  const totalSteps = baseSteps + LOGIN_QUESTIONS.length;
  const [email, setEmail] = useState(DEFAULT_USER.email);
  const [profileName, setProfileName] = useState(DEFAULT_USER.profileName);
  const [profileImageUrl, setProfileImageUrl] = useState(DEFAULT_USER.profileImageUrl);
  const [answers, setAnswers] = useState<EventTasteAnswers>({});
  const [step, setStep] = useState(0);

  const questionIndex = step - baseSteps;
  const currentQuestion = questionIndex >= 0 ? LOGIN_QUESTIONS[questionIndex] : null;

  const bubbleSize = Math.max(96, Math.min(132, Math.floor((width - 58) / 2.35)));
  const bubbleBoardHeight = Math.max(280, bubbleSize * 2.35);
  const bubbleBoardWidth = Math.max(280, width - 36);

  const bubbleMotion = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    const loops = currentQuestion.options.map((_, idx) => {
      const drift = bubbleMotion[idx];
      drift.setValue(0);

      return Animated.loop(
        Animated.sequence([
          Animated.timing(drift, {
            toValue: 1,
            duration: 1700 + idx * 170,
            useNativeDriver: true,
          }),
          Animated.timing(drift, {
            toValue: 0,
            duration: 1700 + idx * 140,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    loops.forEach((loop) => loop.start());
    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [currentQuestion, bubbleMotion]);

  const emailHint = useMemo(() => {
    if (email.length === 0) {
      return 'Required';
    }
    return isValidEmail(email) ? 'Looks good' : 'Enter a valid email';
  }, [email]);

  const canProceed = useMemo(() => {
    if (step === 0) {
      return profileName.trim().length >= 2;
    }
    if (step === 1) {
      return isValidEmail(email);
    }
    if (step === 2) {
      return true;
    }
    if (currentQuestion) {
      return !!answers[currentQuestion.id];
    }
    return false;
  }, [step, profileName, email, currentQuestion, answers]);

  const onNext = () => {
    if (!canProceed) {
      return;
    }

    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    onComplete({
      email: email.trim(),
      profileName: profileName.trim(),
      profileImageUrl: profileImageUrl.trim(),
      tasteAnswers: answers,
    });
  };

  const onBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const nextLabel = step === totalSteps - 1 ? 'Finish login' : 'Next';

  const stepTitle =
    step === 0
      ? 'Step 1: Choose your profile name'
      : step === 1
        ? 'Step 2: Enter your email'
        : step === 2
          ? 'Step 3: Add a profile photo (optional)'
          : `Step ${step + 1}: Event taste question ${questionIndex + 1}`;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.kicker}>Flyer Club</Text>
          <Text style={styles.title}>Create your login</Text>
          <Text style={styles.subtitle}>Complete each step to unlock the next one.</Text>
          <Text style={styles.progressLabel}>
            {step + 1} / {totalSteps}
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
          </View>

          <View style={styles.block}>
            <Text style={styles.stepTitle}>{stepTitle}</Text>

            {step === 0 && (
              <View style={styles.questionCard}>
                <Text style={styles.label}>Profile name (required)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your profile name"
                  placeholderTextColor={theme.textMuted}
                  value={profileName}
                  onChangeText={setProfileName}
                />
              </View>
            )}

            {step === 1 && (
              <View style={styles.questionCard}>
                <Text style={styles.label}>Email (required)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@email.com"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={styles.hint}>{emailHint}</Text>
              </View>
            )}

            {step === 2 && (
              <View style={styles.questionCard}>
                <Text style={styles.label}>Profile photo URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor={theme.textMuted}
                  value={profileImageUrl}
                  onChangeText={setProfileImageUrl}
                  autoCapitalize="none"
                />
                <Text style={styles.hint}>You can skip this and add a photo later.</Text>
              </View>
            )}

            {currentQuestion && (
              <View style={styles.questionCard}>
                <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>

                <View style={[styles.bubbleBoard, { height: bubbleBoardHeight }]}> 
                  {currentQuestion.options.map((option, index) => {
                    const active = answers[currentQuestion.id] === option;
                    const slot = bubbleSlot(index, bubbleBoardWidth, bubbleSize, bubbleBoardHeight);
                    const bob = bubbleMotion[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-6 - index * 1.4, 8 + index * 1.2],
                    });

                    return (
                      <Animated.View
                        key={option}
                        style={[
                          styles.bubbleWrap,
                          {
                            width: bubbleSize,
                            height: bubbleSize,
                            left: slot.left,
                            top: slot.top,
                            transform: [{ translateY: bob }, { scale: active ? 1.05 : 1 }],
                          },
                        ]}
                      >
                        <Pressable
                          onPress={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: option,
                            }))
                          }
                          style={[styles.bubblePressable, active && styles.bubblePressableActive]}
                        >
                          <ImageBackground
                            source={{ uri: pickBubbleImage(option, index + step) }}
                            style={styles.bubbleImage}
                            imageStyle={styles.bubbleImageAsset}
                          >
                            <View style={[styles.bubbleShade, active && styles.bubbleShadeActive]} />
                            <Text style={[styles.bubbleText, active && styles.bubbleTextActive]}>{option}</Text>
                          </ImageBackground>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>

                <Text style={styles.hint}>Tap one moving bubble to lock your answer.</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onBack}
              disabled={step === 0}
              style={[styles.backBtn, step === 0 && styles.backBtnDisabled]}
            >
              <Text style={styles.backBtnLabel}>Back</Text>
            </Pressable>
            <Pressable style={[styles.cta, !canProceed && styles.ctaDisabled]} disabled={!canProceed} onPress={onNext}>
              <Text style={styles.ctaLabel}>{nextLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  keyboardWrap: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 18,
    gap: 16,
    paddingBottom: 28,
    justifyContent: 'center',
  },
  kicker: {
    color: theme.primary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  title: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 30,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  stepTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
  },
  progressLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
  },
  block: {
    gap: 8,
  },
  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  hint: {
    color: theme.textMuted,
    fontSize: 11,
  },
  questionCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  questionPrompt: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  bubbleBoard: {
    position: 'relative',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#10091c',
    borderWidth: 1,
    borderColor: '#ffffff18',
  },
  bubbleWrap: {
    position: 'absolute',
  },
  bubblePressable: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff3a',
    overflow: 'hidden',
  },
  bubblePressableActive: {
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 8,
  },
  bubbleImageAsset: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  bubbleShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
  },
  bubbleShadeActive: {
    backgroundColor: '#0000004a',
  },
  bubbleText: {
    color: '#f7f2ff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: '#000000c0',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bubbleTextActive: {
    color: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  backBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  backBtnDisabled: {
    opacity: 0.4,
  },
  backBtnLabel: {
    color: theme.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  cta: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaLabel: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 15,
  },
});
