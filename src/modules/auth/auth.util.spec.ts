import { parseDurationMs, sha256Hex } from './auth.util';

describe('sha256Hex', () => {
  it('produit la même empreinte pour la même valeur', () => {
    expect(sha256Hex('abc')).toBe(sha256Hex('abc'));
  });

  it('produit des empreintes différentes pour des valeurs différentes', () => {
    expect(sha256Hex('abc')).not.toBe(sha256Hex('abd'));
  });

  it('ne renvoie jamais la valeur en clair', () => {
    expect(sha256Hex('mon-refresh-token')).not.toContain('mon-refresh-token');
  });
});

describe('parseDurationMs', () => {
  it.each([
    ['15m', 15 * 60 * 1000],
    ['7d', 7 * 24 * 60 * 60 * 1000],
    ['300s', 300 * 1000],
    ['1h', 60 * 60 * 1000],
  ])('convertit "%s" en %i ms', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it.each(['15', '15x', '', 'abc', '-5m'])(
    'rejette le format invalide "%s"',
    (input) => {
      expect(() => parseDurationMs(input)).toThrow();
    },
  );
});
