import type { TemperatureUnit } from '../types/weather';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
}

export function unitLabel(unit: TemperatureUnit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(
  celsius: number | null | undefined,
  unit: TemperatureUnit,
): string {
  if (celsius === null || celsius === undefined || !Number.isFinite(celsius)) {
    return 'Indisponível';
  }

  const temperature = convertTemperature(celsius, unit);
  const rounded = Math.round(temperature);

  return `${Object.is(rounded, -0) ? 0 : rounded} ${unitLabel(unit)}`;
}
