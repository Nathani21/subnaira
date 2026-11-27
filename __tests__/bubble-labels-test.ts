import { bubbleLabel, MIN_AMOUNT_RADIUS, MIN_LABEL_RADIUS } from '../src/lib/bubble-labels';

describe('bubbleLabel', () => {
  it('shows the name and short amount in a big bubble', () => {
    expect(bubbleLabel('DStv', 1_900_000, 80)).toEqual({ title: 'DStv', amount: '₦19K' });
  });

  it('shows only the name in a medium bubble', () => {
    expect(bubbleLabel('DStv', 1_900_000, MIN_LABEL_RADIUS)).toEqual({ title: 'DStv', amount: null });
  });

  it('adds the amount from the amount threshold upwards', () => {
    expect(bubbleLabel('DStv', 1_900_000, MIN_AMOUNT_RADIUS).amount).toBe('₦19K');
  });

  it('shows nothing in a small bubble', () => {
    expect(bubbleLabel('DStv', 1_900_000, MIN_LABEL_RADIUS - 1)).toEqual({ title: null, amount: null });
  });

  it('shortens a long name with an ellipsis so it fits', () => {
    // Radius 30 fits (60 - 12) / 7 = 6 characters.
    expect(bubbleLabel('ChatGPT Plus', 3_000_000, 30).title).toBe('ChatG…');
  });

  it('does not leave a space before the ellipsis', () => {
    // Radius 36 fits 8 characters, so the name is cut to 7: "Mobile " ends in a space, which is dropped.
    expect(bubbleLabel('Mobile data', 1_516_667, 36).title).toBe('Mobile…');
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects the radius %p', (radius) => {
    expect(() => bubbleLabel('DStv', 1_900_000, radius)).toThrow(RangeError);
  });

  it('rejects a fraction of a kobo', () => {
    expect(() => bubbleLabel('DStv', 1.5, 80)).toThrow(RangeError);
  });
});