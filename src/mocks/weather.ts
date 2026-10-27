import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    latitude: -23.5475,
    longitude: -46.63611,
    country: 'Brasil',
    admin1: 'São Paulo',
  },
  timezone: 'America/Sao_Paulo',
  current: {
    temperatureC: 22.4,
    apparentTemperatureC: 23.1,
    relativeHumidity: 65,
    weatherCode: 2,
    windSpeedKmh: 12.5,
    referenceTime: '2026-10-27T13:00',
  },
  days: [
    {
      date: '2026-10-27',
      minimumC: 17.1,
      maximumC: 25,
      weatherCode: 2,
      precipitationProbabilityMax: 10,
      windSpeedMaxKmh: 18,
    },
    {
      date: '2026-10-28',
      minimumC: 18,
      maximumC: 26.2,
      weatherCode: 3,
      precipitationProbabilityMax: 20,
      windSpeedMaxKmh: 20.5,
    },
    {
      date: '2026-10-29',
      minimumC: 17.5,
      maximumC: 23.4,
      weatherCode: 61,
      precipitationProbabilityMax: 70,
      windSpeedMaxKmh: 22,
    },
    {
      date: '2026-10-30',
      minimumC: 16.8,
      maximumC: 24.7,
      weatherCode: 2,
      precipitationProbabilityMax: 15,
      windSpeedMaxKmh: 17.2,
    },
    {
      date: '2026-10-31',
      minimumC: 17.2,
      maximumC: 27.1,
      weatherCode: 1,
      precipitationProbabilityMax: 5,
      windSpeedMaxKmh: 16,
    },
  ],
};
