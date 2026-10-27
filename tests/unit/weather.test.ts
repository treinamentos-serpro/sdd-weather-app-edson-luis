import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  TemperatureUnit,
  Unit,
  WeatherData,
} from '../../src/types/weather';

describe('Contratos meteorológicos', () => {
  it('mantém Unit compatível com as unidades do plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<Unit>().toEqualTypeOf<TemperatureUnit>();
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
  });

  it('permite dados parciais sem inventar métricas opcionais', () => {
    const city: City = { id: 1, name: 'Exemplo', latitude: 0, longitude: 0 };
    const current: CurrentWeather = { temperatureC: 0 };
    const day: ForecastDay = { date: '2026-10-27' };

    expect(city.country).toBeUndefined();
    expect(city.admin1).toBeUndefined();
    expect(current.temperatureC).toBe(0);
    expect(current.apparentTemperatureC).toBeUndefined();
    expect(current.referenceTime).toBeUndefined();
    expect(day.minimumC).toBeUndefined();
    expect(day.maximumC).toBeUndefined();
  });
});

describe('mockWeatherData', () => {
  it('fornece cidade, fuso e condições atuais para desenvolver a UI', () => {
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.timezone).toBe('America/Sao_Paulo');
    expect(mockWeatherData.current).toEqual({
      temperatureC: 22.4,
      apparentTemperatureC: 23.1,
      relativeHumidity: 65,
      weatherCode: 2,
      windSpeedKmh: 12.5,
      referenceTime: '2026-10-27T13:00',
    });
  });

  it('contém exatamente cinco datas consecutivas alinhadas à referência atual', () => {
    expect(mockWeatherData.days.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(mockWeatherData.current.referenceTime?.slice(0, 10)).toBe(mockWeatherData.days[0].date);
  });

  it('fornece métricas diárias coerentes em Celsius, porcentagem e km/h', () => {
    for (const day of mockWeatherData.days) {
      expect(day.minimumC).toEqual(expect.any(Number));
      expect(day.maximumC).toEqual(expect.any(Number));
      expect(day.minimumC).toBeLessThanOrEqual(day.maximumC!);
      expect(day.weatherCode).toEqual(expect.any(Number));
      expect(day.precipitationProbabilityMax).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbabilityMax).toBeLessThanOrEqual(100);
      expect(day.windSpeedMaxKmh).toBeGreaterThanOrEqual(0);
    }
  });
});
