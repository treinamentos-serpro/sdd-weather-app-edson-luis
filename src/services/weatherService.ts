import type { City, ForecastDay, ServiceError, WeatherData } from '../types/weather';

export class WeatherServiceError extends Error implements ServiceError {
  constructor(
    public readonly kind: ServiceError['kind'],
    message: string,
    public readonly statusCode?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbortError(value: unknown): boolean {
  return isRecord(value) && value.name === 'AbortError';
}

async function fetchWithTimeout<T>(
  url: string,
  readResponse: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await readResponse(response);
  } catch (cause) {
    if (cause instanceof WeatherServiceError) throw cause;
    if (controller.signal.aborted || isAbortError(cause)) {
      throw new WeatherServiceError('timeout', 'A requisição demorou demais.', undefined, {
        cause,
      });
    }
    throw new WeatherServiceError('network', 'Falha de rede.', undefined, { cause });
  } finally {
    clearTimeout(timeout);
  }
}

function isCity(value: unknown): value is City {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    (value.country === undefined || typeof value.country === 'string') &&
    (value.admin1 === undefined || typeof value.admin1 === 'string')
  );
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const data: unknown = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`,
    async (response) => {
      if (!response.ok) {
        throw new WeatherServiceError(
          'api',
          'Não foi possível pesquisar cidades.',
          response.status,
        );
      }

      try {
        return await response.json();
      } catch (cause) {
        if (isAbortError(cause)) throw cause;
        throw new WeatherServiceError(
          'invalid-response',
          'Resposta inválida ao pesquisar cidades.',
          undefined,
          { cause },
        );
      }
    },
  );

  if (!isRecord(data)) {
    throw new WeatherServiceError('invalid-response', 'Resposta inválida ao pesquisar cidades.');
  }
  if (!('results' in data)) return [];

  const results: unknown = data.results;
  if (!Array.isArray(results) || !results.every(isCity)) {
    throw new WeatherServiceError('invalid-response', 'Resposta inválida ao pesquisar cidades.');
  }

  return results.slice(0, 10).map(({ id, name, latitude, longitude, country, admin1 }) => ({
    id,
    name,
    latitude,
    longitude,
    country,
    admin1,
  }));
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeWeather(data: unknown, city: City): WeatherData {
  const invalidResponse = () =>
    new WeatherServiceError('invalid-response', 'Resposta meteorológica incompleta ou inválida.');

  if (
    !isRecord(data) ||
    !isTimezone(data.timezone) ||
    !isRecord(data.current) ||
    !isRecord(data.daily)
  ) {
    throw invalidResponse();
  }

  const { current, daily } = data;
  const temperatureC = optionalNumber(current.temperature_2m);
  if (temperatureC === undefined || !Array.isArray(daily.time)) throw invalidResponse();

  const dates: unknown[] = daily.time.slice(0, 5);
  if (dates.length !== 5 || !dates.every(isCalendarDate)) throw invalidResponse();
  if (
    dates.some(
      (date, index) =>
        index > 0 &&
        Date.parse(`${date}T00:00:00Z`) - Date.parse(`${dates[index - 1]}T00:00:00Z`) !==
          86_400_000,
    )
  ) {
    throw invalidResponse();
  }

  const referenceTime = current.time;
  if (
    referenceTime !== undefined &&
    referenceTime !== null &&
    (typeof referenceTime !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(referenceTime) ||
      referenceTime.slice(0, 10) !== dates[0])
  ) {
    throw invalidResponse();
  }

  const dailyFields = [
    'temperature_2m_min',
    'temperature_2m_max',
    'weather_code',
    'precipitation_probability_max',
    'wind_speed_10m_max',
  ];
  for (const field of dailyFields) {
    const values = daily[field];
    if (values != null && (!Array.isArray(values) || values.length !== daily.time.length)) {
      throw invalidResponse();
    }
  }

  function dailyNumber(field: string, index: number): number | undefined {
    const values = daily[field];
    return Array.isArray(values) ? optionalNumber(values[index]) : undefined;
  }

  const days: ForecastDay[] = dates.map((date, index) => ({
    date,
    minimumC: dailyNumber('temperature_2m_min', index),
    maximumC: dailyNumber('temperature_2m_max', index),
    weatherCode: dailyNumber('weather_code', index),
    precipitationProbabilityMax: dailyNumber('precipitation_probability_max', index),
    windSpeedMaxKmh: dailyNumber('wind_speed_10m_max', index),
  }));

  return {
    city,
    timezone: data.timezone,
    current: {
      temperatureC,
      apparentTemperatureC: optionalNumber(current.apparent_temperature),
      relativeHumidity: optionalNumber(current.relative_humidity_2m),
      weatherCode: optionalNumber(current.weather_code),
      windSpeedKmh: optionalNumber(current.wind_speed_10m),
      precipitationMm: optionalNumber(current.precipitation),
      pressureHpa: optionalNumber(current.pressure_msl),
      referenceTime: typeof referenceTime === 'string' ? referenceTime : undefined,
    },
    days,
  };
}

export async function getWeather(city: City): Promise<WeatherData> {
  if (!isCity(city) || Math.abs(city.latitude) > 90 || Math.abs(city.longitude) > 180) {
    throw new WeatherServiceError(
      'invalid-response',
      'Localização inválida para consultar o clima.',
    );
  }

  const data: unknown = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&forecast_days=5&timezone=auto`,
    async (response) => {
      if (!response.ok) {
        throw new WeatherServiceError(
          'api',
          'Não foi possível consultar o clima.',
          response.status,
        );
      }

      try {
        return await response.json();
      } catch (cause) {
        if (isAbortError(cause)) throw cause;
        throw new WeatherServiceError(
          'invalid-response',
          'Resposta meteorológica inválida.',
          undefined,
          {
            cause,
          },
        );
      }
    },
  );
  return normalizeWeather(data, city);
}
