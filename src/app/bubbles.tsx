import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, BubbleColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSavedData } from '@/hooks/use-saved-data';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { bubbleLabel } from '@/lib/bubble-labels';
import { type Bubble, layoutBubbles } from '@/lib/bubbles';
import { chargeLabel, cycleLabel, formatAmount } from '@/lib/labels';
import { formatNaira } from '@/lib/money';
import type { SavedData } from '@/lib/subscriptions';
import { type SubscriptionRow, summarize } from '@/lib/summary';

/** A row whose monthly cost is known, so it can be drawn as a bubble. */
type PricedRow = SubscriptionRow & { monthlyKobo: number };

function isPriced(row: SubscriptionRow): row is PricedRow {
  return row.monthlyKobo !== null;
}

export default function BubblesScreen() {
  const { state } = useSavedData();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Bubbles</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bigger bubble, bigger monthly cost. Tap one for details.
          </ThemedText>
          <Legend />
        </View>
        {state.status === 'loading' && <Message text="Loading…" />}
        {state.status === 'error' && <Message text={state.message} />}
        {state.status === 'ready' && <BubbleChart data={state.data} />}
      </SafeAreaView>
    </ThemedView>
  );
}

function BubbleChart({ data }: { data: SavedData }) {
  const today = useToday();
  const theme = useTheme();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const result = useMemo(() => {
    if (size === null) {
      return null;
    }
    try {
      const summary = summarize(data, today);
      const rows = summary.rows.filter(isPriced);
      const bubbles = layoutBubbles(
        rows.map((row) => ({ id: row.subscription.id, monthlyKobo: row.monthlyKobo })),
        size.width,
        size.height,
      );
      return { rows, bubbles, excludedCount: summary.excludedCount, ...size };
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
    return <Message text="No subscriptions yet. Add some on the Home tab, or try the demo there." />;
  }

  const chart = result !== null && 'rows' in result ? result : null;
  const selected = chart?.rows.find((row) => row.subscription.id === selectedId);

  return (
    <>
      <View style={styles.chart} onLayout={onLayout}>
        {result !== null && 'error' in result && <Message text={result.error} />}
        {chart !== null && (
          <Svg width={chart.width} height={chart.height}>
            {chart.bubbles.map((bubble, index) => {
              const row = chart.rows[index];
              const id = row.subscription.id;
              return (
                <BubbleShape
                  key={id}
                  bubble={bubble}
                  row={row}
                  selected={id === selectedId}
                  outline={theme.text}
                  onPress={() => setSelectedId((current) => (current === id ? null : id))}
                />
              );
            })}
          </Svg>
        )}
      </View>
      <Details row={selected} excludedCount={chart?.excludedCount ?? 0} />
    </>
  );
}

function BubbleShape({
  bubble,
  row,
  selected,
  outline,
  onPress,
}: {
  bubble: Bubble;
  row: PricedRow;
  selected: boolean;
  outline: string;
  onPress: () => void;
}) {
  const label = bubbleLabel(row.subscription.name, row.monthlyKobo, bubble.r);
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

function Legend() {
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

function Message({ text }: { text: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.four,
    gap: Spacing.one,
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
  chart: {
    flex: 1,
    minHeight: 200,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
});