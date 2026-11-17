import { StyleSheet, Text, View } from 'react-native';
import type { CropSuggestion } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { rupeesExact } from './formatting';

/**
 * The crop at the top of the ranking, stated plainly.
 *
 * It carries its own cautions rather than only its profit. A hero card that
 * shows a number and nothing else reads as a promise, and this figure is an
 * estimate from typical yields and today's price — both of which move.
 */
export function BestPick({ crop, areaAcres }: { crop: CropSuggestion; areaAcres?: number }) {
  const perAcre = crop.estimatedProfit;
  const whole = perAcre !== null && areaAcres ? perAcre : null;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>BEST PICK{crop.sowableNow ? ' · SOW NOW' : ''}</Text>
      <Text style={styles.name}>
        {crop.crop.charAt(0).toUpperCase() + crop.crop.slice(1)}
      </Text>

      {whole !== null ? (
        <Text style={styles.amount}>
          {rupeesExact(whole)}
          <Text style={styles.amountSub}>
            {areaAcres ? `  over ${areaAcres} acre${areaAcres === 1 ? '' : 's'}, estimated` : ''}
          </Text>
        </Text>
      ) : (
        <Text style={styles.noPrice}>No mandi price published for this crop</Text>
      )}

      <View style={styles.chips}>
        <Chip text={`Cost ${rupeesExact(crop.estimatedInputCost)}`} />
        <Chip text={`${crop.durationDays} days`} />
        <Chip text={crop.season} />
        {crop.sowableNow ? <Chip text="Suits this month" /> : null}
      </View>

      {crop.cautions.length > 0 ? (
        <Text style={styles.caution} numberOfLines={2}>
          {crop.cautions.join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: Shape.extraLarge, padding: Spacing.xl, gap: Spacing.sm,
  },
  kicker: { ...TypeEmphasized.labelSmall, color: Colors.primaryFixed, letterSpacing: 1 },
  name: { ...TypeEmphasized.headlineMedium, color: Colors.onPrimary },
  amount: { ...TypeEmphasized.headlineSmall, color: Colors.primaryFixed },
  amountSub: { ...Type.bodySmall, color: Colors.primaryFixed },
  noPrice: { ...Type.bodyMedium, color: Colors.primaryFixed },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Shape.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  chipText: { ...Type.labelMedium, color: Colors.onPrimary },
  caution: { ...Type.bodySmall, color: Colors.primaryFixed, marginTop: Spacing.xs },
});
