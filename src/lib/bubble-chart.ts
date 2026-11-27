import { type BubbleLabel, bubbleLabel } from './bubble-labels';
import { type Bubble, layoutBubbles } from './bubbles';
import type { IsoDate } from './dates';
import type { SavedData } from './subscriptions';
import { type SubscriptionRow, summarize } from './summary';

/** A row whose monthly cost is known, so it can be drawn as a bubble. */
export type PricedRow = SubscriptionRow & { monthlyKobo: number };

/** Everything needed to draw one bubble. */
export interface ChartBubble {
  row: PricedRow;
  bubble: Bubble;
  label: BubbleLabel;
}

/** Everything the bubbles screen draws. */
export interface BubbleChartData {
  bubbles: ChartBubble[];
  /** Dollar subscriptions not drawn because no exchange rate has been entered. */
  excludedCount: number;
}

function isPriced(row: SubscriptionRow): row is PricedRow {
  return row.monthlyKobo !== null;
}

/**
 * Prepares the bubble chart: works out each subscription's monthly cost, packs the bubbles
 * into the drawing area and decides each bubble's text. Screens only draw the result.
 *
 * @param data - The saved data.
 * @param today - Today's date, "YYYY-MM-DD".
 * @param width - Width of the drawing area.
 * @param height - Height of the drawing area.
 * @returns One entry per drawable subscription (soonest charge first), and how many were left out.
 * @throws RangeError for invalid data or an area too small to draw in (see `summarize` and `layoutBubbles`).
 */
export function prepareBubbleChart(data: SavedData, today: IsoDate, width: number, height: number): BubbleChartData {
  const summary = summarize(data, today);
  const rows = summary.rows.filter(isPriced);
  const placed = layoutBubbles(
    rows.map((row) => ({ id: row.subscription.id, monthlyKobo: row.monthlyKobo })),
    width,
    height,
  );
  const bubbles = rows.map((row, index) => {
    const bubble = placed[index];
    return { row, bubble, label: bubbleLabel(row.subscription.name, row.monthlyKobo, bubble.r) };
  });
  return { bubbles, excludedCount: summary.excludedCount };
}