import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, serifFont } from '../theme';

interface Props {
  onLookAtAnother: () => void;
  onSettings: () => void;
}

export default function AfterScreen({ onLookAtAnother, onSettings }: Props) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onLookAtAnother} hitSlop={12}>
        <Text style={styles.link}>Look at another</Text>
      </Pressable>
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
