import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
  const [email, setEmail] = useState(DEFAULT_USER.email);
  const [profileName, setProfileName] = useState(DEFAULT_USER.profileName);
  const [profileImageUrl, setProfileImageUrl] = useState(DEFAULT_USER.profileImageUrl);
  const [answers, setAnswers] = useState<EventTasteAnswers>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === LOGIN_QUESTIONS.length;
  const canContinue = isValidEmail(email) && profileName.trim().length >= 2 && allAnswered;

  const emailHint = useMemo(() => {
    if (email.length === 0) {
      return 'Required';
    }
    return isValidEmail(email) ? 'Looks good' : 'Enter a valid email';
  }, [email]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>Flyer Club</Text>
          <Text style={styles.title}>Create your login</Text>
          <Text style={styles.subtitle}>Email and profile name are required. Add a profile photo if you want.</Text>

          <View style={styles.block}>
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

          <View style={styles.block}>
            <Text style={styles.label}>Profile name (required)</Text>
            <TextInput
              style={styles.input}
              placeholder="Your profile name"
              placeholderTextColor={theme.textMuted}
              value={profileName}
              onChangeText={setProfileName}
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>Profile photo URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={theme.textMuted}
              value={profileImageUrl}
              onChangeText={setProfileImageUrl}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>Quick event taste quiz ({answeredCount}/{LOGIN_QUESTIONS.length})</Text>
            {LOGIN_QUESTIONS.map((question) => (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionPrompt}>{question.prompt}</Text>
                <View style={styles.optionsWrap}>
                  {question.options.map((option) => {
                    const active = answers[question.id] === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
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
            ))}
          </View>

          <Pressable
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
            disabled={!canContinue}
            onPress={() =>
              onComplete({
                email: email.trim(),
                profileName: profileName.trim(),
                profileImageUrl: profileImageUrl.trim(),
                tasteAnswers: answers,
              })
            }
          >
            <Text style={styles.ctaLabel}>Continue to setup</Text>
          </Pressable>
        </ScrollView>
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
    padding: 18,
    gap: 16,
    paddingBottom: 28,
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
  cta: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
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
