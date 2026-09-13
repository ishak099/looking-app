import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../lib/useReducedMotion';
import { colors, serifFont } from '../theme';

interface Props {
  onLookAtAnother: () => void;
  onSettings: () => void;
}

// The pointer itself paces every line; this applies the same "slightly too
// slow" pacing to the gap AFTER a pointer, so tapping straight through to
// the next one doesn't turn the app into a scrolling feed of quotes. No
// countdown, no message about it — just quiet, then the link.
const REST_PAUSE_MS = 5000;
const FADE_MS = 1300;

export default function AfterScreen({ onLookAtAnother, onSettings }: Props) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    setReady(false);
    const delay = reduced ? REST_PAUSE_MS * 0.85 : REST_PAUSE_MS;
    const id = setTimeout(() => {
      setReady(true);
      if (reduced) {
        opacity.setValue(1);
      } else {
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
      }
    }, delay);
    return () => clearTimeout(id);
  }, [reduced, opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }} pointerEvents={ready ? 'auto' : 'none'}>
        <Pressable onPress={onLookAtAnother} hitSlop={12}>
          <Text style={styles.link}>Look at another</Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={[styles.settingsLink, { opacity }]} pointerEvents={ready ? 'auto' : 'none'}>
        <Pressable onPress={onSettings} hitSlop={16}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.field,
    justifyContent: 'center',
    paddingHorizontal: '7%',
  },
  link: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 16,
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
  },
  settingsLink: {
    position: 'absolute',
    bottom: '10%',
    right: '7%',
  },
  settingsText: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
