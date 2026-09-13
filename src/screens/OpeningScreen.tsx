import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, serifFont, useClampFontSize } from '../theme';

interface Props {
  onBegin: () => void;
  onSettings: () => void;
}

export default function OpeningScreen({ onBegin, onSettings }: Props) {
  const headlineSize = useClampFontSize(25.6, 5.5, 35.2);

  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <Text style={[styles.headline, { fontSize: headlineSize, lineHeight: headlineSize * 1.45 }]}>
          One thing to look at. It takes about a minute.
        </Text>
        <Pressable style={styles.button} onPress={onBegin}>
          <Text style={styles.buttonText}>Begin looking</Text>
        </Pressable>
        <Text style={styles.caution}>
          If this ever feels unsettling rather than interesting, stop.
        </Text>
      </View>
      <Pressable style={styles.settingsLink} onPress={onSettings} hitSlop={16}>
        <Text style={styles.settingsText}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.field,
    justifyContent: 'center',
    paddingHorizontal: '7%',
    paddingVertical: '10%',
  },
  block: {
    maxWidth: 420,
  },
  headline: {
    color: colors.ink,
    fontFamily: serifFont,
    fontWeight: '400',
    marginBottom: 42,
  },
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.quiet,
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  buttonText: {
    color: colors.ink,
    fontFamily: serifFont,
    fontSize: 16.8,
  },
  caution: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 13.6,
    lineHeight: 21.8,
    marginTop: 64,
    maxWidth: 320,
  },
  settingsLink: {
    position: 'absolute',
    bottom: '6%',
    right: '7%',
  },
  settingsText: {
    color: colors.quiet,
    fontFamily: serifFont,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
