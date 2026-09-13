import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import PointerLine from '../components/PointerLine';
import { pauseFor } from '../lib/pacing';
import { useReducedMotion } from '../lib/useReducedMotion';
import { colors } from '../theme';
import { Pointer } from '../types';

interface Props {
  pointer: Pointer;
  onDone: () => void;
}

export default function LookingScreen({ pointer, onDone }: Props) {
  const [shown, setShown] = useState(1);
  const reduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setShown((n) => {
      if (n >= pointer.lines.length) {
        onDone();
        return n;
      }
      return n + 1;
    });
  }, [pointer, onDone]);

  useEffect(() => {
    setShown(1);
  }, [pointer]);

  // Paced auto-reveal. Tapping (below) advances early; it never skips a line.
  useEffect(() => {
    const current = pointer.lines[shown - 1];
    timerRef.current = setTimeout(() => {
      if (shown < pointer.lines.length) setShown((n) => n + 1);
      else onDone();
    }, pauseFor(current, reduced));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pointer, shown, reduced, onDone]);

  return (
    <Pressable style={styles.container} onPress={advance}>
      <View style={styles.block}>
        {pointer.lines.slice(0, shown).map((line, i) => (
          <PointerLine key={i} text={line.t} isCurrent={i === shown - 1} reducedMotion={reduced} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.field,
    justifyContent: 'center',
    paddingHorizontal: '7%',
  },
  block: {
    // Approximates the prototype's 34ch cap so large-screen/tablet lines
    // don't stretch edge to edge.
    maxWidth: 560,
  },
});
