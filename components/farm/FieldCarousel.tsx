import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { FarmField } from '@agronavis/shared-types';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { describeArea } from '@/features/maps/area';

/**
 * Which field the dashboard is talking about, chosen by swiping.
 *
 * It used to be a row of small pills. With one or two fields that reads fine;
 * with seven it is a cramped list where the selected one is a slightly
 * different colour and nothing says the rest are there.
 *
 * One card at a time, filling the width, with its neighbours showing at the
 * edges so the row is visibly a row. Swiping to a card selects it — the
 * gesture and the choice are one action, rather than scrolling to find
 * something and then having to tap it as well.
 */

/** How much of the next card shows, which is what makes it look swipeable. */
const PEEK = 30;
const GAP = Spacing.md;

export function FieldCarousel({
  fields,
  activeFieldId,
  onSelect,
  /** The farmer's state, so an area can be shown in katha or guntha. */
  state,
}: {
  fields: FarmField[];
  activeFieldId: string | null;
  onSelect: (fieldId: string, farmId: string) => void;
  state?: string | null;
}) {
  const listRef = useRef<FlatList<FarmField>>(null);

  /**
   * The width this carousel actually has, not the screen's.
   *
   * Sizing from `Dimensions` assumed it sat flush against the screen edges.
   * It does not — the dashboard pads its scroll content — so the card came out
   * wider than its container and the row sat visibly off centre, with a gap on
   * the left and almost none on the right. Measuring makes it correct wherever
   * it is placed.
   */
  const [width, setWidth] = useState(Dimensions.get('window').width - Spacing.xl * 2);
  const cardWidth = Math.max(1, width - PEEK * 2);
  const stride = cardWidth + GAP;

  const index = Math.max(0, fields.findIndex((f) => f.id === activeFieldId));

  // Follow a selection made elsewhere: mapping a new field makes it active,
  // and the carousel should already be on it when the farmer looks.
  /**
   * Where the list actually is, so the effect below does not animate back to
   * a card the farmer has just swiped to. Without it every settle triggered a
   * scroll to the position it had already reached, which reads as a stutter
   * at the end of each swipe.
   */
  const shownIndex = useRef(index);

  /**
   * The stride the list is currently laid out against.
   *
   * The first render sizes from an estimate and `onLayout` corrects it a frame
   * later. When that changes the stride, every stored offset is stale — the
   * list would sit between two cards — so it is put back on the current one,
   * without animation because nothing moved from the farmer's point of view.
   */
  const laidOutStride = useRef(stride);

  useEffect(() => {
    if (fields.length === 0) return;

    const resized = Math.abs(laidOutStride.current - stride) > 1;
    if (!resized && shownIndex.current === index) return;

    laidOutStride.current = stride;
    shownIndex.current = index;

    const id = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: index * stride, animated: !resized });
    }, 0);
    return () => clearTimeout(id);
  }, [index, stride, fields.length]);

  /**
   * Settling on a card is choosing it.
   *
   * Read from the scroll offset rather than a viewability callback: the
   * offset is exactly what the snap produced, so the card under the thumb and
   * the field being queried cannot disagree.
   */
  const onSettled = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const landed = Math.max(
        0,
        Math.min(fields.length - 1, Math.round(e.nativeEvent.contentOffset.x / stride)),
      );
      shownIndex.current = landed;
      const field = fields[landed];
      if (field && field.id !== activeFieldId) onSelect(field.id, field.farmId);
    },
    [fields, stride, activeFieldId, onSelect],
  );

  /** Step one card, for the chevrons. */
  const step = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(fields.length - 1, index + delta));
      const field = fields[next];
      if (field) onSelect(field.id, field.farmId);
    },
    [fields, index, onSelect],
  );

  if (fields.length === 0) return null;

  const hasPrev = index > 0;
  const hasNext = index < fields.length - 1;

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - width) > 1) setWidth(w);
      }}
    >
      <View>
      <FlatList
        ref={listRef}
        data={fields}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => f.id}
        // Snapping, not paging: a page is the full screen width, which would
        // hide the neighbours this design depends on.
        snapToInterval={stride}
        decelerationRate="fast"
        disableIntervalMomentum
        // Exactly the peek on each side, so the active card is centred in
        // whatever width this component was given.
        contentContainerStyle={{ paddingHorizontal: PEEK, gap: GAP }}
        onMomentumScrollEnd={onSettled}
        getItemLayout={(_d, i) => ({ length: stride, offset: stride * i, index: i })}
        initialScrollIndex={index}
        // A list that cannot measure should still show the first card rather
        // than an empty strip.
        onScrollToIndexFailed={() => {}}
        // Enough to fill the screen and its neighbours, no more. A farmer
        // with twenty fields should not pay for twenty cards on open.
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        renderItem={({ item }) => {
          const active = item.id === activeFieldId;
          return (
            <TouchableOpacity
              style={[styles.card, { width: cardWidth }, active && styles.cardActive]}
              onPress={() => onSelect(item.id, item.farmId)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.name}, ${describeArea(item.areaAcres, state)}`}
            >
              <View style={[styles.icon, active && styles.iconActive]}>
                <MaterialIcons
                  name="grass"
                  size={22}
                  color={active ? Colors.onPrimary : Colors.primary}
                />
              </View>
              <View style={styles.text}>
                <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.area, active && styles.areaActive]} numberOfLines={1}>
                  {describeArea(item.areaAcres, state)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/*
        Chevrons over the peek, which is otherwise dead space — most visibly
        on the first and last card, where there is no neighbour to show and
        the row looked lopsided. They also give the carousel a tap target for
        anyone who does not swipe.
      */}
      {hasPrev ? (
        <TouchableOpacity
          style={[styles.chev, styles.chevLeft]}
          onPress={() => step(-1)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Previous field"
        >
          <MaterialIcons name="chevron-left" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      ) : null}

      {hasNext ? (
        <TouchableOpacity
          style={[styles.chev, styles.chevRight]}
          onPress={() => step(1)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next field"
        >
          <MaterialIcons name="chevron-right" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      ) : null}
      </View>

      {/* One dot per field, the current one drawn as a bar. With several
          fields a farmer needs to see how far along the row they are. */}
      {fields.length > 1 ? (
        <View style={styles.dots}>
          {fields.map((f, i) => (
            <View key={f.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cardActive: { backgroundColor: Colors.primary, ...Elevation.level2 },

  icon: {
    width: 44, height: 44, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  iconActive: { backgroundColor: 'rgba(255,255,255,0.22)' },

  text: { flex: 1 },
  name: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  nameActive: { color: Colors.onPrimary },
  area: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 1 },
  areaActive: { color: Colors.primaryFixed },

  chev: {
    position: 'absolute', top: 0, bottom: 0, width: PEEK + Spacing.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  chevLeft: { left: 0 },
  chevRight: { right: 0 },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.outlineVariant },
  dotActive: { width: 22, backgroundColor: Colors.primary },
});
