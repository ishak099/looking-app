import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { rescheduleForSettingsChange } from '../lib/notifications';
import { colors, serifFont } from '../theme';
import { NotificationFrequency, Settings } from '../types';

interface Props {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onBack: () => void;
}

const FREQUENCY_OPTIONS: { value: NotificationFrequency; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'One a day' },
  { value: 'weekly', label: 'A few a week' },
];

function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? 'am' : 'pm';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

export default function SettingsScreen({ settings, onSettingsChange, onBack }: Props) {
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionDenied(status === 'denied');
    });
  }, []);

  const apply = (next: Settings) => {
    onSettingsChange(next);
    rescheduleForSettingsChange(next);
  };

  const setFrequency = (notificationFrequency: NotificationFrequency) => {
    apply({ ...settings, notificationFrequency });
  };

  const adjustQuietHour = (field: 'startHour' | 'endHour', delta: number) => {
    const value = ((settings.quietHours[field] + delta) % 24 + 24) % 24;
    apply({ ...settings, quietHours: { ...settings.quietHours, [field]: value } });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={16} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.row}>
          {FREQUENCY_OPTIONS.map((opt) => {
            const active = settings.notificationFrequency === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFrequency(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {permissionDenied && (
          <Text style={styles.note}>
            Notifications are off for this app in your device settings.
          </Text>
        )}
      </View>

      {settings.notificationFrequency !== 'off' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quiet hours</Text>
          <View style={styles.quietRow}>
            <View style={styles.stepper}>
              <Pressable onPress={() => adjustQuietHour('startHour', -1)} hitSlop={12}>
                <Text style={styles.stepperButton}>–</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{formatHour(settings.quietHours.startHour)}</Text>
              <Pressable onPress={() => adjustQuietHour('startHour', 1)} hitSlop={12}>
                <Text style={styles.stepperButton}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.quietTo}>until</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => adjustQuietHour('endHour', -1)} hitSlop={12}>
                <Text style={styles.stepperButton}>–</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{formatHour(settings.quietHours.endHour)}</Text>
              <Pressable onPress={() => adjustQuietHour('endHour', 1)} hitSlop={12}>
                <Text style={styles.stepperButton}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <Text style={styles.about}>
          Looking gives you one short pointer to sit with, at unpredictable
          moments. It doesn't track what you've seen, keep score, or explain
          what you'll find. It only points — the rest is up to you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.field,
    paddingHorizontal: '7%',
    paddingTop: '14%',
  },
  back: {
    position: 'absolute',
    top: '6%',
    left: '7%',
  },
  backText: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: 44,
  },
  sectionLabel: {
    color: colors.ink,
    fontFamily: serifFont,
    fontSize: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.quiet,
    borderRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipActive: {
    borderColor: colors.ink,
  },
  chipText: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 15,
  },
  chipTextActive: {
    color: colors.ink,
  },
  note: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 13,
    marginTop: 14,
    maxWidth: 320,
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperButton: {
    color: colors.ink,
    fontFamily: serifFont,
    fontSize: 22,
    paddingHorizontal: 4,
  },
  stepperValue: {
    color: colors.ink,
    fontFamily: serifFont,
    fontSize: 16,
    minWidth: 44,
    textAlign: 'center',
  },
  quietTo: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 14,
  },
  about: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 14.5,
    lineHeight: 23,
    maxWidth: 340,
  },
});
