const { normalizeCode } = require('../src/utils/normalize');

describe('normalizeCode', () => {
  it('trims whitespace', () => {
    expect(normalizeCode('  11423  ')).toBe('11423');
  });

  it('lowercases', () => {
    expect(normalizeCode('FG-P-F-0503')).toBe('fg-p-f-0503');
  });

  it('trims and lowercases together', () => {
    expect(normalizeCode('  FG-P-F-0503  ')).toBe('fg-p-f-0503');
  });

  it('treats null/undefined as empty string', () => {
    expect(normalizeCode(null)).toBe('');
    expect(normalizeCode(undefined)).toBe('');
  });

  it('coerces numbers to string', () => {
    expect(normalizeCode(11423)).toBe('11423');
  });

  it('makes two differently-cased/whitespaced codes compare equal', () => {
    expect(normalizeCode(' 11423 ')).toBe(normalizeCode('11423'));
    expect(normalizeCode('FG-P-F-0503')).toBe(normalizeCode('fg-p-f-0503 '));
  });
});
