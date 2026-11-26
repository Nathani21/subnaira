import { demoData } from '../src/lib/demo';
import { parseSavedData, serializeSavedData } from '../src/lib/subscriptions';
import { summarize } from '../src/lib/summary';

describe('demoData', () => {
  it('passes the same checks as real saved data', () => {
    const data = demoData();
    expect(parseSavedData(serializeSavedData(data))).toEqual(data);
  });

  it('can be summarised with every dollar subscription converted', () => {
    const summary = summarize(demoData(), '2026-11-26');
    expect(summary.rows).toHaveLength(6);
    expect(summary.missingRate).toBe(false);
    expect(summary.totalMonthlyKobo).toBeGreaterThan(0);
  });
});