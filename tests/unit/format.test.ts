import { describe, expect, it } from 'vitest';
import { formatDayLabel } from '../../src/lib/format';

describe('formatDayLabel', () => {
  it('preserva a data-calendário da cidade independentemente do fuso do dispositivo', () => {
    expect(formatDayLabel('2026-10-27')).toBe('ter., 27/10');
    expect(formatDayLabel('2026-12-31')).toBe('qui., 31/12');
    expect(formatDayLabel('2027-01-01')).toBe('sex., 01/01');
    expect(formatDayLabel('2028-02-29')).toBe('ter., 29/02');
  });

  it.each([
    '',
    'inválida',
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-10-27T00:00',
  ])('identifica a data inválida %s sem inventar outra data', (date) => {
    expect(formatDayLabel(date)).toBe('Data indisponível');
  });
});
