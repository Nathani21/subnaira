import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSavedData } from '@/hooks/use-saved-data';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { demoData } from '@/lib/demo';
import { chargeLabel, cycleLabel, formatAmount } from '@/lib/labels';
import { formatNaira } from '@/lib/money';
import type { SavedData } from '@/lib/subscriptions';
import { type Summary, summarize } from '@/lib/summary';

export default function HomeScreen() {
  const { state, save } = useSavedData();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Subscriptions</ThemedText>
          {state.status === 'loading' && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
          {state.status === 'error' && <Problem message={state.message} />}
          {state.status === 'ready' && <Overview data={state.data} onTryDemo={() => save(demoData())} />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Overview({ data, onTryDemo }: { data: SavedData; onTryDemo: () => void }) {
  const today = useToday();
  const result = useMemo((): { summary: Summary } | { error: string } => {
    try {
      return { summary: summarize(data, today) };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      return { error: `Couldn't work out your totals (${detail}).` };
    }
  }, [data, today]);

  if ('error' in result) {
    return <Problem message={result.error} />;
  }
  const { summary } = result;
  if (summary.rows.length === 0) {
    return <EmptyState onTryDemo={onTryDemo} />;
  }
  const leftOut = summary.excludedCount;

  return (
    <>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          Every month
        </ThemedText>
        <ThemedText type="subtitle">{formatNaira(summary.totalMonthlyKobo)}</ThemedText>
        {summary.missingRate && (
          <ThemedText type="small" themeColor="textSecondary">
            Not counting {leftOut} dollar {leftOut === 1 ? 'subscription' : 'subscriptions'}. Add an exchange
            rate to include {leftOut === 1 ? 'it' : 'them'}.
          </ThemedText>
        )}
      </ThemedView>

      {summary.rows.map((row) => {
        const { subscription } = row;
        const showMonthly =
          row.monthlyKobo !== null && (subscription.currency === 'USD' || subscription.cycle !== 'monthly');
        return (
          <ThemedView key={subscription.id} type="backgroundElement" style={styles.row}>
            <View style={styles.rowSide}>
              <ThemedText>{subscription.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {chargeLabel(row.daysUntil)}
              </ThemedText>
            </View>
            <View style={[styles.rowSide, styles.rowRight]}>
              <ThemedText>
                {formatAmount(subscription.amount, subscription.currency)} {cycleLabel(subscription.cycle)}
              </ThemedText>
              {showMonthly && row.monthlyKobo !== null && (
                <ThemedText type="small" themeColor="textSecondary">
                  ≈ {formatNaira(row.monthlyKobo)} a month
                </ThemedText>
              )}
            </View>
          </ThemedView>
        );
      })}
    </>
  );
}

function EmptyState({ onTryDemo }: { onTryDemo: () => void }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText>No subscriptions yet.</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Load some examples to see how it works.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onTryDemo}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="smallBold">Try demo subscriptions</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Something went wrong</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {message}
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
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  rowSide: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    marginTop: Spacing.one,
  },
});