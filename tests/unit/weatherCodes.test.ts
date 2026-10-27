import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it.each([
    [0, 'Céu limpo', '☀️'],
    [2, 'Parcialmente nublado', '⛅'],
    [61, 'Chuva leve', '🌧️'],
    [95, 'Trovoada', '⛈️'],
  ])('mapeia código %s para rótulo e ícone', (code, label, icon) => {
    expect(getWeatherCondition(code)).toEqual({ label, icon });
  });

  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('reconhece o código WMO %s', (code) => {
    const condition = getWeatherCondition(code);
    expect(condition.label).not.toBe('Condição indisponível');
    expect(condition.icon).not.toBe('❔');
  });

  it.each([undefined, -1, 999, Number.NaN])('identifica código indisponível: %s', (code) => {
    expect(getWeatherCondition(code)).toEqual({
      label: 'Condição indisponível',
      icon: '❔',
    });
  });
});
