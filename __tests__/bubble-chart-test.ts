import { prepareBubbleChart } from '../src/lib/bubble-chart';
import { demoData } from '../src/lib/demo';

const TODAY = '2026-11-26';

describe('prepareBubbleChart', () => {
  it('draws one labelled bubble per demo subscription', () => {
    const chart = prepareBubbleChart(demoData(), TODAY, 360, 440);
    expect(chart.excludedCount).toBe(0);
    expect(
      chart.bubbles.map(({ row, label }) => [row.subscription.id, label.title, label.amount]),
    ).toEqual([
      ['demo-dstv', 'DStv', '₦19K'],
      ['demo-data', 'Mobile data', '₦15.17K'],
      ['demo-netflix', 'Netflix', '₦23.24K'],
      ['demo-chatgpt', 'ChatGPT Plus', '₦30K'],
      ['demo-icloud', null, null], // smallest bubble: too small for text, still tappable
      ['demo-gym', 'Gym', '₦12.5K'],
    ]);
  });

  it('gives the most expensive subscription the biggest bubble', () => {
    const { bubbles } = prepareBubbleChart(demoData(), TODAY, 360, 440);
    const biggest = bubbles.reduce((a, b) => (b.bubble.r > a.bubble.r ? b : a));
    expect(biggest.row.subscription.id).toBe('demo-chatgpt');
  });

  it('leaves out dollar subscriptions until a rate is entered, and counts them', () => {
    const chart = prepareBubbleChart({ ...demoData(), rateKoboPerDollar: null }, TODAY, 360, 440);
    expect(chart.excludedCount).toBe(3);
    expect(chart.bubbles.every(({ row }) => row.subscription.currency === 'NGN')).toBe(true);
  });

  it('is empty with no subscriptions', () => {
    expect(prepareBubbleChart({ ...demoData(), subscriptions: [] }, TODAY, 360, 440)).toEqual({
      bubbles: [],
      excludedCount: 0,
    });
  });

  it('rejects an area too small to draw in', () => {
    expect(() => prepareBubbleChart(demoData(), TODAY, 1, 1)).toThrow(RangeError);
  });
});