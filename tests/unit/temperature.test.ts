import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  convertTemperature,
  fahrenheitToCelsius,
  formatTemperature,
  unitLabel,
} from '../../src/lib/temperature';

describe('temperature', () => {
  it.each([
    [-40, -40],
    [0, 32],
    [100, 212],
    [20, 68],
    [22.4, 72.32],
  ])('converte %s °C em %s °F sem arredondar', (celsius, fahrenheit) => {
    expect(celsiusToFahrenheit(celsius)).toBeCloseTo(fahrenheit);
    expect(fahrenheitToCelsius(fahrenheit)).toBeCloseTo(celsius);
  });

  it.each([
    ['celsius', 20, 20],
    ['fahrenheit', 20, 68],
  ] as const)('converte %s para sua unidade de apresentação', (unit, celsius, expected) => {
    expect(convertTemperature(celsius, unit)).toBe(expected);
  });

  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna o símbolo correto para %s', (unit, label) => {
    expect(unitLabel(unit)).toBe(label);
  });

  it('arredonda somente na apresentação e evita zero negativo', () => {
    expect(formatTemperature(22.4, 'celsius')).toBe('22 °C');
    expect(formatTemperature(22.4, 'fahrenheit')).toBe('72 °F');
    expect(formatTemperature(-0.2, 'celsius')).toBe('0 °C');
    expect(formatTemperature(-10.6, 'celsius')).toBe('-11 °C');
  });

  it.each([
    undefined,
    Number.NaN,
    Infinity,
    -Infinity,
  ])('identifica temperatura indisponível: %s', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(value, 'fahrenheit')).toBe('Indisponível');
  });
});
