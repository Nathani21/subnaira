import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BubbleChart, BubbleLegend, BubbleMessage } from '@/components/bubble-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSavedData } from '@/hooks/use-saved-data';

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
          <BubbleLegend />
        </View>
        {state.status === 'loading' && <BubbleMessage text="Loading…" />}
        {state.status === 'error' && <BubbleMessage text={state.message} />}
        {state.status === 'ready' && <BubbleChart data={state.data} />}
      </SafeAreaView>
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
});