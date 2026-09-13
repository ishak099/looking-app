import AsyncStorage from '@react-native-async-storage/async-storage';
import { PointerQueueState, Settings } from '../types';

// Deliberately small. Per the spec: no accumulation, no per-view analytics,
// no history. This is the entire on-device footprint of the app.
const KEYS = {
  hasSeenOpening: 'looking.hasSeenOpening',
  settings: 'looking.settings',
  hasRequestedNotificationPermission: 'looking.hasRequestedNotificationPermission',
  pointersCompletedBeforeAsk: 'looking.pointersCompletedBeforeAsk',
  pointerQueue: 'looking.pointerQueue',
  lastScheduledUntil: 'looking.lastScheduledUntil',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  notificationFrequency: 'off',
  quietHours: { startHour: 22, endHour: 8 },
};

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJSON(key: string, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  async getHasSeenOpening(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.hasSeenOpening)) === '1';
  },
  async setHasSeenOpening(): Promise<void> {
    await AsyncStorage.setItem(KEYS.hasSeenOpening, '1');
  },

  async getSettings(): Promise<Settings> {
    const s = await getJSON<Settings>(KEYS.settings);
    return s ?? DEFAULT_SETTINGS;
  },
  async setSettings(settings: Settings): Promise<void> {
    await setJSON(KEYS.settings, settings);
  },

  async getHasRequestedNotificationPermission(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.hasRequestedNotificationPermission)) === '1';
  },
  async setHasRequestedNotificationPermission(): Promise<void> {
    await AsyncStorage.setItem(KEYS.hasRequestedNotificationPermission, '1');
  },

  /** Counts completed pointers only until the permission ask has fired; irrelevant after. */
  async getPointersCompletedBeforeAsk(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.pointersCompletedBeforeAsk);
    return raw ? parseInt(raw, 10) : 0;
  },
  async incrementPointersCompletedBeforeAsk(): Promise<number> {
    const next = (await storage.getPointersCompletedBeforeAsk()) + 1;
    await AsyncStorage.setItem(KEYS.pointersCompletedBeforeAsk, String(next));
    return next;
  },

  /** One shared shuffle-walk for every draw — in-app taps and scheduled
   * notifications alike — so nothing repeats until all pointers have been
   * shown once, regardless of which surface showed them. */
  async getPointerQueue(): Promise<PointerQueueState | null> {
    return getJSON<PointerQueueState>(KEYS.pointerQueue);
  },
  async setPointerQueue(state: PointerQueueState): Promise<void> {
    await setJSON(KEYS.pointerQueue, state);
  },

  async getLastScheduledUntil(): Promise<Date | null> {
    const raw = await AsyncStorage.getItem(KEYS.lastScheduledUntil);
    return raw ? new Date(raw) : null;
  },
  async setLastScheduledUntil(date: Date): Promise<void> {
    await AsyncStorage.setItem(KEYS.lastScheduledUntil, date.toISOString());
  },
  async clearLastScheduledUntil(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.lastScheduledUntil);
  },
};
