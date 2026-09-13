import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors, serifFont, useClampFontSize } from '../theme';

interface Props {
  text: string;
  isCurrent: boolean;
  reducedMotion: boolean;
}

export default function PointerLine({ text, isCurrent, reducedMotion }: Props) {
  const opacity = useRef(new Animated.Value(reducedMotion ? (isCurrent ? 1 : 0.3) : 0)).current;
  const fontSize = useClampFontSize(24, 5, 32);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(isCurrent ? 1 : 0.3);
      return;
    }
    Animated.timing(opacity, {
      toValue: isCurrent ? 1 : 0.3,
      duration: isCurrent ? 1300 : 1100,
      useNativeDriver: true,
    }).start();
  }, [isCurrent, reducedMotion, opacity]);

  return (
    <Animated.Text
      style={[
        styles.line,
        { fontSize, lineHeight: fontSize * 1.5, marginBottom: fontSize * 1.15, opacity },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  line: {
    color: colors.ink,
    fontFamily: serifFont,
    fontWeight: '400',
  },
});
