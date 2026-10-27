import type { TemperatureUnit } from '../types/weather';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export function formatTemperature(celsius: number | undefined, unit: TemperatureUnit): string {
  if (celsius === undefined || !Number.isFinite(celsius)) return 'Indisponível';

  const temperature = unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
  const rounded = Math.round(temperature);

  return `${Object.is(rounded, -0) ? 0 : rounded} ${unit === 'fahrenheit' ? '°F' : '°C'}`;
}
