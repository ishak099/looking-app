import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import AfterScreen from './src/screens/AfterScreen';
import LookingScreen from './src/screens/LookingScreen';
import OpeningScreen from './src/screens/OpeningScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {
  ensureAndroidChannel,
  maybeRequestPermissionAfterThirdPointer,
  topUpScheduledNotifications,
} from './src/lib/notifications';
import { drawNext, getPointer } from './src/lib/queue';
import { DEFAULT_SETTINGS, storage } from './src/lib/storage';
import { colors } from './src/theme';
import { Pointer, Settings } from './src/types';

type Route = 'start' | 'looking' | 'resting' | 'settings';

const NOTIFICATIONS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

export default function App() {
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Route>('start');
  const [previousRoute, setPreviousRoute] = useState<Route>('start');
  const [pointer, setPointer] = useState<Pointer | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    (async () => {
      await ensureAndroidChannel();
      const [hasSeenOpening, storedSettings] = await Promise.all([
        storage.getHasSeenOpening(),
        storage.getSettings(),
      ]);
      setSettings(storedSettings);
      setRoute(hasSeenOpening ? 'resting' : 'start');
      setReady(true);
      topUpScheduledNotifications();
      if (!NOTIFICATIONS_SUPPORTED) return;

      // Cold start via a notification tap: open straight into that pointer.
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      const pointerId = lastResponse?.notification.request.content.data?.pointerId as
        | string
        | undefined;
      if (pointerId) {
        const p = getPointer(pointerId);
        if (p) {
          setPointer(p);
          setRoute('looking');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const pointerId = response.notification.request.content.data?.pointerId as
        | string
        | undefined;
      if (!pointerId) return;
      const p = getPointer(pointerId);
      if (!p) return;
      setPointer(p);
      setRoute('looking');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') topUpScheduledNotifications();
    });
    return () => sub.remove();
  }, []);

  const goLooking = useCallback(async () => {
    const queueState = await storage.getInAppQueue();
    const { id, next } = drawNext(queueState);
    await storage.setInAppQueue(next);
    const p = getPointer(id);
    if (!p) return;
    setPointer(p);
    setRoute('looking');
  }, []);

  const begin = useCallback(async () => {
    await storage.setHasSeenOpening();
    await goLooking();
  }, [goLooking]);

  const onDone = useCallback(() => {
    setRoute('resting');
    maybeRequestPermissionAfterThirdPointer();
  }, []);

  const openSettings = useCallback(() => {
    setPreviousRoute((cur) => (route === 'settings' ? cur : route));
    setRoute('settings');
  }, [route]);

  const closeSettings = useCallback(() => {
    setRoute(previousRoute);
  }, [previousRoute]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.field }} />;
  }

  return (
    <>
      {route === 'start' && <OpeningScreen onBegin={begin} onSettings={openSettings} />}
      {route === 'looking' && pointer && <LookingScreen pointer={pointer} onDone={onDone} />}
      {route === 'resting' && (
        <AfterScreen onLookAtAnother={goLooking} onSettings={openSettings} />
      )}
      {route === 'settings' && (
        <SettingsScreen settings={settings} onSettingsChange={setSettings} onBack={closeSettings} />
      )}
      <StatusBar style="light" />
    </>
  );
}
