import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { CropSuggestion } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { rupeesExact } from './formatting';

/**
 * One crop in full: what it earns, what is against it, and what to buy.
 *
 * The fertiliser plan shows its arithmetic. A farmer handed a number of bags
 * with no working cannot check it against what the shop tells them, and this
 * is the part of the advice that costs real money to get wrong.
 */
export function CropSheet({
  crop,
  areaAcres,
  onClose,
}: {
  crop: CropSuggestion;
  areaAcres: number | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const name = crop.crop.charAt(0).toUpperCase() + crop.crop.slice(1);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.wrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.sub}>
                {crop.category} · {crop.season} · {crop.durationDays} days
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={Colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>Sowing</Text>
            <Text style={styles.body}>
              {crop.sowableNow
                ? `Can be sown now. Window: ${crop.sowingWindows.join(' or ')}.`
                : `Not this month. Window: ${crop.sowingWindows.join(' or ')}.`}
            </Text>

            <Text style={styles.heading}>The money</Text>
            {crop.estimatedProfit === null ? (
              <Text style={styles.body}>
                No mandi price is published for this crop, so nothing can be estimated.
              </Text>
            ) : (
              <View style={styles.ledger}>
                <Line label={`${crop.expectedYieldQuintals} quintals at ${rupeesExact(crop.pricePerQuintal ?? 0)}`} value={rupeesExact(crop.estimatedRevenue ?? 0)} />
                <Line label="Seed, fertiliser, labour, spray" value={`− ${rupeesExact(crop.estimatedInputCost)}`} />
                <Line label="Left over" value={rupeesExact(crop.estimatedProfit)} strong />
              </View>
            )}
            <Text style={styles.footnote}>
              An estimate from typical yields and today&apos;s rate. Both move.
            </Text>

            {crop.cautions.length > 0 ? (
              <>
                <Text style={styles.heading}>Worth knowing</Text>
                {crop.cautions.map((c) => (
                  <Text key={c} style={styles.bullet}>· {c}</Text>
                ))}
              </>
            ) : null}

            <Text style={styles.heading}>
              Fertiliser{areaAcres ? ` for ${areaAcres} acre${areaAcres === 1 ? '' : 's'}` : ' per acre'}
            </Text>
            {crop.fertiliser.products.map((p) => (
              <View key={p.name} style={styles.product}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productQty}>
                  {p.kg} kg · about {p.bags} bag{p.bags === 1 ? '' : 's'}
                </Text>
                <Text style={styles.productSupplies}>{p.supplies}</Text>
              </View>
            ))}
            {crop.fertiliser.workings.map((w) => (
              <Text key={w} style={styles.working}>· {w}</Text>
            ))}

            {crop.notes ? (
              <>
                <Text style={styles.heading}>Note</Text>
                <Text style={styles.body}>{crop.notes}</Text>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.strong]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shape.extraLarge, borderTopRightRadius: Shape.extraLarge,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, maxHeight: '85%',
  },
  handle: {
    width: 32, height: 4, borderRadius: Shape.full,
    backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginBottom: Spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  title: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  sub: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },
  scroll: { marginTop: Spacing.md },
  heading: {
    ...TypeEmphasized.labelLarge, color: Colors.onSurfaceVariant,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
  body: { ...Type.bodyMedium, color: Colors.onSurface },
  bullet: { ...Type.bodyMedium, color: Colors.onSurface, marginBottom: 2 },
  ledger: { gap: Spacing.xs },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  lineLabel: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, flex: 1 },
  lineValue: { ...Type.bodyMedium, color: Colors.onSurface },
  strong: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  footnote: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },
  product: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Shape.medium, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  productName: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  productQty: { ...Type.bodyMedium, color: Colors.onSurface },
  productSupplies: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  working: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginBottom: 2 },
});
