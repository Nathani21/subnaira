import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BubbleColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { type ChartBubble, type PricedRow, prepareBubbleChart } from '@/lib/bubble-chart';
import { chargeLabel, cycleLabel, formatAmount } from '@/lib/labels';
import { formatNaira } from '@/lib/money';
import type { SavedData } from '@/lib/subscriptions';

/** Draws every subscription as a bubble, with a details card for the tapped one. */
export function BubbleChart({ data }: { data: SavedData }) {
  const today = useToday();
  const theme = useTheme();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const result = useMemo(() => {
    if (size === null) {
      return null;
    }
    try {
      return { chart: prepareBubbleChart(data, today, size.width, size.height), ...size };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      return { error: `Couldn't draw the bubbles (${detail}).` };
    }
  }, [data, today, size]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize({ width, height });
    }
  };

  if (data.subscriptions.length === 0) {
    return <BubbleMessage text="No subscriptions yet. Add some on the Home tab, or try the demo there." />;
  }

  const drawn = result !== null && 'chart' in result ? result : null;
  const selected = drawn?.chart.bubbles.find(({ row }) => row.subscription.id === selectedId)?.row;

  return (
    <>
      <View style={styles.chart} onLayout={onLayout}>
        {result !== null && 'error' in result && <BubbleMessage text={result.error} />}
        {drawn !== null && (
          <Svg width={drawn.width} height={drawn.height}>
            {drawn.chart.bubbles.map((item) => {
              const id = item.row.subscription.id;
              return (
                <BubbleShape
                  key={id}
                  item={item}
                  selected={id === selectedId}
                  outline={theme.text}
                  onPress={() => setSelectedId((current) => (current === id ? null : id))}
                />
              );
            })}
          </Svg>
        )}
      </View>
      <Details row={selected} excludedCount={drawn?.chart.excludedCount ?? 0} />
    </>
  );
}

function BubbleShape({
  item,
  selected,
  outline,
  onPress,
}: {
  item: ChartBubble;
  selected: boolean;
  outline: string;
  onPress: () => void;
}) {
  const { bubble, label, row } = item;
  const titleY = label.amount === null ? bubble.y + 4 : bubble.y - 2;
  return (
    <G onPress={onPress}>
      <Circle
        cx={bubble.x}
        cy={bubble.y}
        // Pull the outline inside the edge so it never touches a neighbour.
        r={selected ? bubble.r - 1.5 : bubble.r}
        fill={BubbleColors[row.subscription.currency]}
        stroke={selected ? outline : 'none'}
        strokeWidth={selected ? 3 : 0}
      />
      {label.title !== null && (
        <SvgText x={bubble.x} y={titleY} fill="#ffffff" fontSize={12} fontWeight="600" textAnchor="middle">
          {label.title}
        </SvgText>
      )}
      {label.amount !== null && (
        <SvgText x={bubble.x} y={bubble.y + 14} fill="#ffffff" fontSize={11} textAnchor="middle">
          {label.amount}
        </SvgText>
      )}
    </G>
  );
}

function Details({ row, excludedCount }: { row: PricedRow | undefined; excludedCount: number }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {row === undefined ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tap a bubble to see its details.
        </ThemedText>
      ) : (
        <>
          <ThemedText type="smallBold">{row.subscription.name}</ThemedText>
          <ThemedText type="small">
            {formatAmount(row.subscription.amount, row.subscription.currency)} {cycleLabel(row.subscription.cycle)}
            {' · ≈ '}
            {formatNaira(row.monthlyKobo)} a month
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Next charge: {chargeLabel(row.daysUntil).toLowerCase()}
          </ThemedText>
        </>
      )}
      {excludedCount > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {excludedCount} dollar {excludedCount === 1 ? "subscription isn't" : "subscriptions aren't"} shown. Add an
          exchange rate first.
        </ThemedText>
      )}
    </ThemedView>
  );
}

/** The colour key: which colour means Naira and which means dollars. */
export function BubbleLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: BubbleColors.NGN }]} />
        <ThemedText type="small" themeColor="textSecondary">
          Naira
        </ThemedText>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: BubbleColors.USD }]} />
        <ThemedText type="small" themeColor="textSecondary">
          Dollars
        </ThemedText>
      </View>
    </View>
  );
}

/** A short message in a card, for loading, empty and error states. */
export function BubbleMessage({ text }: { text: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  chart: {
    flex: 1,
    minHeight: 200,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});