import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ForecastDay } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';
import { Skeleton } from '@/components/ui';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function weatherIcon(code: string): IconName {
  if (code.startsWith('01')) return 'wb-sunny';
  if (code.startsWith('02')) return 'wb-cloudy';
  if (code.startsWith('03') || code.startsWith('04')) return 'cloud';
  if (code.startsWith('09') || code.startsWith('10')) return 'water-drop';
  if (code.startsWith('11')) return 'thunderstorm';
  if (code.startsWith('13')) return 'ac-unit';
  if (code.startsWith('50')) return 'foggy';
  return 'wb-cloudy';
}

const dayLabel = (date: string, index: number) =>
  index === 0
    ? 'Today'
    : new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' });

interface ForecastStripProps {
  forecast: ForecastDay[];
  loading?: boolean;
}

export function ForecastStrip({ forecast, loading = false }: ForecastStripProps) {
  if (loading) {
    return (
      <View style={styles.row}>
        {[0, 1, 2, 3, 4].map((key) => (
          <View key={key} style={styles.day}>
            <Skeleton width={40} height={12} />
            <Skeleton width={28} height={28} radius={Shape.full} />
            <Skeleton width={44} height={12} />
          </View>
        ))}
      </View>
    );
  }

  if (forecast.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {forecast.map((day, index) => {
        const wet = day.rainProbability >= 50;
        return (
          <View key={day.date} style={[styles.day, index === 0 && styles.today]}>
            <Text style={[styles.label, index === 0 && styles.todayLabel]}>
              {dayLabel(day.date, index)}
            </Text>
            <MaterialIcons
              name={weatherIcon(day.icon)}
              size={26}
              color={index === 0 ? Colors.onPrimaryContainer : Colors.onSurfaceVariant}
            />
            <Text style={[styles.temps, index === 0 && styles.todayLabel]}>
              {day.tempMax}
              <Text style={styles.tempMin}>/{day.tempMin}</Text>
            </Text>
            {wet ? (
              <View style={styles.rain}>
                <MaterialIcons name="umbrella" size={11} color={Colors.tertiary} />
                <Text style={styles.rainLabel}>{day.rainProbability}%</Text>
              </View>
            ) : (
              <Text style={styles.rainPlaceholder}>{day.rainMm > 0 ? `${day.rainMm}mm` : '—'}</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
  day: {
    width: 68,
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.md,
    borderRadius: Shape.large,
    backgroundColor: Colors.surfaceContainerLow,
  },
  today: { backgroundColor: Colors.primaryContainer },
  label: { ...Type.labelMedium, color: Colors.onSurfaceVariant },
  todayLabel: { color: Colors.onPrimaryContainer },
  temps: { ...Type.labelLarge, color: Colors.onSurface },
  tempMin: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  rain: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rainLabel: { ...Type.labelSmall, color: Colors.tertiary },
  rainPlaceholder: { ...Type.labelSmall, color: Colors.outline },
});
