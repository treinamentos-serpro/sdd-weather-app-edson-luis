export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type Unit = TemperatureUnit;

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface CurrentWeather {
  temperatureC: number;
  apparentTemperatureC?: number;
  relativeHumidity?: number;
  weatherCode?: number;
  windSpeedKmh?: number;
  precipitationMm?: number;
  pressureHpa?: number;
  referenceTime?: string;
}

export interface ForecastDay {
  /** Data-calendário YYYY-MM-DD no fuso da cidade. */
  date: string;
  minimumC?: number;
  maximumC?: number;
  weatherCode?: number;
  precipitationProbabilityMax?: number;
  windSpeedMaxKmh?: number;
}

export interface WeatherData {
  city: City;
  timezone: string;
  current: CurrentWeather;
  days: ForecastDay[];
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface ServiceError {
  kind: 'network' | 'api' | 'timeout' | 'invalid-response';
  message: string;
  statusCode?: number;
}
