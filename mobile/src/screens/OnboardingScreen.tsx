import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { AVAILABLE_INTERESTS, PROFILE_ROLES } from '../mockData';
import { ThemePalette, useAppTheme } from '../theme';
import { UserRole, UserSetup } from '../types';

interface OnboardingScreenProps {
  initialUser: UserSetup;
  onComplete: (city: string, interests: string[], role: UserRole) => void;
}

export function OnboardingScreen({ initialUser, onComplete }: OnboardingScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [city, setCity] = useState(initialUser.city);
  const [selected, setSelected] = useState<string[]>(initialUser.interests);
  const [role, setRole] = useState<UserRole>(initialUser.role);

  const canContinue = useMemo(
    () => city.trim().length > 0 && selected.length > 0 && !!role,
    [city, selected, role],
  );

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenBackdrop />
      <View style={styles.container}>
        <Text style={styles.kicker}>Flyer Club</Text>
        <Text style={styles.title}>Find Austin events worth showing up for.</Text>
        <Text style={styles.subtitle}>Local-first flyer feed. Real intent. Real attendance.</Text>

        <View style={styles.block}>
          <Text style={styles.label}>City</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Austin, TX"
            placeholderTextColor={theme.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Profile type</Text>
          <View style={styles.roleWrap}>
            {PROFILE_ROLES.map((item) => {
              const active = role === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setRole(item.id)}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                >
                  <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{item.title}</Text>
                  <Text style={[styles.roleDesc, active && styles.roleDescActive]}>{item.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Pick your interests</Text>
          <View style={styles.chips}>
            {AVAILABLE_INTERESTS.map((interest) => {
              const active = selected.includes(interest);
              return (
                <Pressable
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{interest}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={() => onComplete(city.trim(), selected, role)}
          disabled={!canContinue}
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
        >
          <Text style={styles.ctaLabel}>Continue</Text>
        </Pressable>
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
    padding: 20,
    justifyContent: 'center',
    gap: 20,
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
    lineHeight: 36,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  block: {
    gap: 12,
  },
  label: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    color: theme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleWrap: {
    gap: 8,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  roleCardActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  roleTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  roleTitleActive: {
    color: theme.text,
  },
  roleDesc: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  roleDescActive: {
    color: theme.text,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  chipLabel: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: theme.text,
  },
  cta: {
    marginTop: 8,
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
  },
  });
