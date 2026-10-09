import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';

/**
 * Renders a legal document from structured sections rather than a wall of
 * prose, so a farmer can find the clause that affects them. One screen serves
 * the terms and the privacy policy; they must look alike because they are read
 * the same way — scanned for a heading, then one paragraph.
 */
export type LegalBlock =
  | { kind: 'text'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'callout'; title: string; text: string };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocumentProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDocument({ title, updated, intro, sections }: LegalDocumentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.updated}>Last updated {updated}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{intro}</Text>

        {sections.map((section, i) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>
              {i + 1}. {section.heading}
            </Text>
            {section.blocks.map((block, j) => {
              if (block.kind === 'text') {
                return (
                  <Text key={j} style={styles.body}>
                    {block.text}
                  </Text>
                );
              }
              if (block.kind === 'bullets') {
                return (
                  <View key={j} style={styles.bullets}>
                    {block.items.map((item) => (
                      <View key={item} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                );
              }
              return (
                <View key={j} style={styles.callout}>
                  <Text style={styles.calloutTitle}>{block.title}</Text>
                  <Text style={styles.calloutText}>{block.text}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  headerText: { flex: 1 },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  updated: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  scroll: { padding: Spacing.lg, gap: Spacing.xl },
  intro: { ...Type.bodyLarge, color: Colors.onSurfaceVariant },

  section: { gap: Spacing.sm },
  heading: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  body: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },

  bullets: { gap: Spacing.xs, paddingTop: Spacing.xs },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm },
  bulletDot: { ...Type.bodyMedium, color: Colors.primary },
  bulletText: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, flex: 1 },

  callout: {
    backgroundColor: Colors.tertiaryContainer,
    borderRadius: Shape.medium,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  calloutTitle: { ...TypeEmphasized.titleSmall, color: Colors.onTertiaryContainer },
  calloutText: { ...Type.bodyMedium, color: Colors.onTertiaryContainer },
});
