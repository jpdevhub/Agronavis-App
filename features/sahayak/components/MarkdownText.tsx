import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Type, TypeEmphasized } from '@/constants/theme';

/**
 * Renders the small slice of Markdown a chat model actually emits: headings,
 * bullet and numbered lists, **bold**, and `code`. A full Markdown library is
 * far more surface than this needs, and none of them style cleanly against the
 * MD3 type scale.
 */
export function MarkdownText({ text, color }: { text: string; color: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) return;

    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <Text key={i} style={[styles.heading, { color }]}>
          {inline(heading[1], color)}
        </Text>,
      );
      return;
    }

    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      blocks.push(
        <View key={i} style={styles.row}>
          <Text style={[styles.marker, { color }]}>•</Text>
          <Text style={[styles.body, { color }]}>{inline(bullet[1], color)}</Text>
        </View>,
      );
      return;
    }

    const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      blocks.push(
        <View key={i} style={styles.row}>
          <Text style={[styles.marker, { color }]}>{numbered[1]}.</Text>
          <Text style={[styles.body, { color }]}>{inline(numbered[2], color)}</Text>
        </View>,
      );
      return;
    }

    blocks.push(
      <Text key={i} style={[styles.body, { color }]}>
        {inline(line, color)}
      </Text>,
    );
  });

  return <View style={styles.wrap}>{blocks}</View>;
}

/** Splits a line on **bold**, *italic* and `code`, keeping the delimiters out. */
function inline(text: string, color: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith('**')) {
      parts.push(
        <Text key={key++} style={[styles.bold, { color }]}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <Text key={key++} style={styles.code}>
          {token.slice(1, -1)}
        </Text>,
      );
    } else {
      parts.push(
        <Text key={key++} style={styles.italic}>
          {token.slice(1, -1)}
        </Text>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : [text];
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  heading: { ...TypeEmphasized.titleMedium, marginTop: Spacing.xs },
  body: { ...Type.bodyLarge, flex: 1 },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  marker: { ...Type.bodyLarge, minWidth: 18 },
  bold: { ...TypeEmphasized.bodyLarge, fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  code: {
    ...Type.bodyMedium,
    fontFamily: 'monospace',
    color: Colors.onSurfaceVariant,
    backgroundColor: Colors.surfaceContainerHigh,
  },
});
