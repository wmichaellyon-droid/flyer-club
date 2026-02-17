import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginScreen({ onComplete }: LoginScreenProps) {
  const baseSteps = 3; // profileName, email, profileImage
  const totalSteps = baseSteps + LOGIN_QUESTIONS.length;
  const [email, setEmail] = useState(DEFAULT_USER.email);
  const [profileName, setProfileName] = useState(DEFAULT_USER.profileName);
  const [profileImageUrl, setProfileImageUrl] = useState(DEFAULT_USER.profileImageUrl);
  const [answers, setAnswers] = useState<EventTasteAnswers>({});
  const [step, setStep] = useState(0);

  const questionIndex = step - baseSteps;
  const currentQuestion = questionIndex >= 0 ? LOGIN_QUESTIONS[questionIndex] : null;

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
      return true; // optional step
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
                <View style={styles.optionsWrap}>
                  {currentQuestion.options.map((option) => {
                    const active = answers[currentQuestion.id] === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: option,
                          }))
                        }
                        style={[styles.optionChip, active && styles.optionChipActive]}
                      >
                        <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={onBack} disabled={step === 0} style={[styles.backBtn, step === 0 && styles.backBtnDisabled]}>
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
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  optionChipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  optionChipLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  optionChipLabelActive: {
    color: theme.text,
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
