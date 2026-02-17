import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

const statuses = ['Analyzing', 'Approved', 'Needs Review', 'Rejected'];
const checks = [
  'Event text detected (date/time/venue)',
  'Flyer layout confidence',
  'Not a selfie/photo/meme',
  'Duplicate-spam risk check',
];

function checkState(status: string) {
  if (status === 'Approved') {
    return 'pass';
  }
  if (status === 'Rejected') {
    return 'fail';
  }
  return 'pending';
}

export function UploadScreen() {
  const [flyerUrl, setFlyerUrl] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState('Analyzing');

  const onSubmit = () => {
    if (!flyerUrl || !eventTitle || !venue) {
      return;
    }
    setStatus('Analyzing');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Upload</Text>
        <Text style={styles.subtitle}>Promoter flow with flyer moderation status.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Flyer URL"
            placeholderTextColor={theme.textMuted}
            value={flyerUrl}
            onChangeText={setFlyerUrl}
          />
          <TextInput
            style={styles.input}
            placeholder="Event title"
            placeholderTextColor={theme.textMuted}
            value={eventTitle}
            onChangeText={setEventTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Venue"
            placeholderTextColor={theme.textMuted}
            value={venue}
            onChangeText={setVenue}
          />
        </View>

        <Pressable onPress={onSubmit} style={styles.submitBtn}>
          <Text style={styles.submitBtnLabel}>Submit Flyer</Text>
        </Pressable>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>AI Moderation Status</Text>
          <Text style={styles.statusValue}>{status}</Text>
          <View style={styles.ruleList}>
            {checks.map((check) => {
              const state = checkState(status);
              return (
                <View key={check} style={styles.ruleRow}>
                  <View
                    style={[
                      styles.ruleDot,
                      state === 'pass' && styles.ruleDotPass,
                      state === 'fail' && styles.ruleDotFail,
                    ]}
                  />
                  <Text style={styles.ruleLabel}>{check}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.statusSwitchRow}>
            {statuses.map((item) => {
              const active = item === status;
              return (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[styles.statusPill, active && styles.statusPillActive]}
                >
                  <Text style={[styles.statusPillLabel, active && styles.statusPillLabelActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 12,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 13,
  },
  form: {
    gap: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  statusTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statusValue: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  statusSwitchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ruleList: {
    gap: 6,
    marginBottom: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.textMuted,
  },
  ruleDotPass: {
    backgroundColor: theme.positive,
  },
  ruleDotFail: {
    backgroundColor: '#ea5454',
  },
  ruleLabel: {
    color: theme.textMuted,
    fontSize: 12,
  },
  statusPill: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.surfaceAlt,
  },
  statusPillActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  statusPillLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillLabelActive: {
    color: theme.text,
  },
});
