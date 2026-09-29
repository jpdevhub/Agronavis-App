import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors, Shape } from '@/constants/theme';

interface Props {
  uri: string | null | undefined;
  name: string | null | undefined;
  size?: number;
}

function initialsOf(name: string | null | undefined): string {
  const source = (name ?? '').trim();
  if (!source) return 'A';
  return source.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** The farmer's photo, or their initials when there isn't one. */
export function Avatar({ uri, name, size = 40 }: Props) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[box, styles.photo]} />;
  return (
    <View style={[box, styles.fallback]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { borderWidth: 2, borderColor: Colors.primaryFixed },
  fallback: {
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Shape.full,
  },
  initials: { fontWeight: '800', color: Colors.onPrimaryContainer },
});
