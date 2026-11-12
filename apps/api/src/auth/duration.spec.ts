import { parseDurationMs } from './duration';

describe('parseDurationMs', () => {
  it.each([
    ['30', 30_000],
    ['45s', 45_000],
    ['15m', 900_000],
    ['1h', 3_600_000],
    ['7d', 604_800_000],
  ])('%s -> %d ms', (input, expected) => expect(parseDurationMs(input)).toBe(expected));

  it('rejects formats the cookie cannot follow', () => expect(() => parseDurationMs('1 week')).toThrow());
});
