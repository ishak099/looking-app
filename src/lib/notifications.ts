import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { drawBatch, getPointer } from './queue';
import { storage } from './storage';
import { QuietHours, Settings } from '../types';

export const NOTIFICATION_CHANNEL_ID = 'pointers';

// Local scheduled notifications aren't implemented on web (expo-notifications
// throws ERR_UNAVAILABLE there). The shipped product is iOS/Android only —
// this guard just keeps the web dev preview from spamming unhandled rejections.
const NOTIFICATIONS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

// iOS hard-caps pending local notification requests at 64. We keep a rolling
// window well under that and top it up on every app open, per spec.
const TARGET_PENDING = 30;
const JITTER_MINUTES = 90;

/** Deliberately quiet: importance is LOW and can never be raised after creation
 * (only name/description can change), so pick the final value up front. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Pointers',
    importance: Notifications.AndroidImportance.LOW,
    // No custom sound/vibration — a pointer arriving should not announce itself.
    vibrationPattern: [0],
    sound: null,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Call once, after the user finishes their third pointer. Never call earlier —
 * iOS shows the system permission dialog exactly once per install, so an early
 * ask that gets declined is unrecoverable without a manual Settings visit.
 */
export async function maybeRequestPermissionAfterThirdPointer(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  const alreadyAsked = await storage.getHasRequestedNotificationPermission();
  if (alreadyAsked) return;

  const count = await storage.incrementPointersCompletedBeforeAsk();
  if (count !== 3) return;

  await storage.setHasRequestedNotificationPermission();
  const { status } = await Notifications.requestPermissionsAsync();

  if (status === 'granted') {
    const settings = await storage.getSettings();
    if (settings.notificationFrequency === 'off') {
      const next: Settings = { ...settings, notificationFrequency: 'weekly' };
      await storage.setSettings(next);
    }
    await topUpScheduledNotifications();
  }
}

function wakingWindow(quietHours: QuietHours): { startHour: number; endHour: number } {
  const { startHour, endHour } = quietHours;
  if (startHour <= endHour) {
    // Malformed (quiet hours don't actually span an overnight block) — fall
    // back to the spec's default rather than produce an empty waking window.
    return { startHour: 8, endHour: 22 };
  }
  return { startHour: endHour, endHour: startHour };
}

function randomTimeWithinWaking(day: Date, quietHours: QuietHours): Date {
  const { startHour, endHour } = wakingWindow(quietHours);
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const span = endMin - startMin;
  const jitterRoom = Math.min(JITTER_MINUTES, Math.floor(span / 2) - 1);

  const base = startMin + jitterRoom + Math.random() * (span - 2 * jitterRoom);
  const jitter = (Math.random() * 2 - 1) * JITTER_MINUTES;
  const minuteOfDay = Math.min(endMin - 1, Math.max(startMin, Math.round(base + jitter)));

  const result = new Date(day);
  result.setHours(0, Math.round(minuteOfDay), Math.floor(Math.random() * 60), 0);
  return result;
}

/** Builds `count` future trigger dates, starting the day after `from`, honoring
 * frequency + quiet hours. "weekly" picks 3 distinct days per 7-day block. */
function buildTriggerDates(from: Date, count: number, settings: Settings): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  if (settings.notificationFrequency === 'daily') {
    while (dates.length < count) {
      dates.push(randomTimeWithinWaking(cursor, settings.quietHours));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  // weekly ("a few a week"): 3 randomly chosen days per 7-day block.
  while (dates.length < count) {
    const weekDays = [0, 1, 2, 3, 4, 5, 6];
    for (let i = weekDays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weekDays[i], weekDays[j]] = [weekDays[j], weekDays[i]];
    }
    const chosen = weekDays.slice(0, 3).sort((a, b) => a - b);
    for (const offset of chosen) {
      if (dates.length >= count) break;
      const day = new Date(cursor);
      day.setDate(day.getDate() + offset);
      dates.push(randomTimeWithinWaking(day, settings.quietHours));
    }
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

/** Cancels every pending local notification and clears the notification queue
 * cursor. Call when the user turns notifications off or edits cadence. */
export async function cancelAllAndReset(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await storage.setNotifQueue({ order: [], cursor: 0, lastId: null });
  await storage.clearLastScheduledUntil();
}

/** Schedules enough notifications to bring the pending count back up to the
 * rolling target. Safe to call on every app open and after settings changes. */
export async function topUpScheduledNotifications(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  const settings = await storage.getSettings();
  if (settings.notificationFrequency === 'off') return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await ensureAndroidChannel();

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const deficit = TARGET_PENDING - pending.length;
  if (deficit <= 0) return;

  const now = new Date();
  const storedUntil = await storage.getLastScheduledUntil();
  const latestTrigger = storedUntil && storedUntil > now ? storedUntil : now;

  const dates = buildTriggerDates(latestTrigger, deficit, settings);
  const queueState = await storage.getNotifQueue();
  const { ids, next } = drawBatch(queueState, deficit);

  for (let i = 0; i < deficit; i++) {
    const pointer = getPointer(ids[i]);
    if (!pointer) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        // The notification IS the pointer beginning — never generic copy.
        body: pointer.lines[0].t,
        data: { pointerId: pointer.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dates[i],
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
  }

  await storage.setNotifQueue(next);
  await storage.setLastScheduledUntil(dates[dates.length - 1]);
}

/** Applies a settings change: reschedules from scratch so the new cadence /
 * quiet hours take effect immediately instead of only for future top-ups. */
export async function rescheduleForSettingsChange(settings: Settings): Promise<void> {
  await storage.setSettings(settings);
  await cancelAllAndReset();
  if (settings.notificationFrequency !== 'off') {
    await topUpScheduledNotifications();
  }
}
