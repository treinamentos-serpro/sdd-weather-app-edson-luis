import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, RequestStatus, ServiceError, WeatherData } from '../types/weather';

type RequestError = Error & Partial<Pick<ServiceError, 'kind' | 'statusCode'>>;

interface SearchState {
  status: RequestStatus;
  cities: City[];
  error: RequestError | null;
  query: string;
}

interface WeatherState {
  status: RequestStatus;
  selectedCity: City | null;
  data: WeatherData | null;
  error: RequestError | null;
}

export default function useWeather() {
  const [searchState, setSearchState] = useState<SearchState>({
    status: 'idle',
    cities: [],
    error: null,
    query: '',
  });
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: 'idle',
    selectedCity: null,
    data: null,
    error: null,
  });
  const searchOperationId = useRef(0);
  const weatherOperationId = useRef(0);
  const lastSearch = useRef<string | null>(null);
  const lastCity = useRef<City | null>(null);

  useEffect(() => {
    return () => {
      searchOperationId.current += 1;
      weatherOperationId.current += 1;
    };
  }, []);

  const search = useCallback(async (name: string) => {
    const query = name.trim();
    if (query.length < 2) {
      searchOperationId.current += 1;
      setSearchState((previous) => ({
        ...previous,
        status: 'idle',
        cities: [],
        error: null,
      }));
      return;
    }

    const id = ++searchOperationId.current;
    lastSearch.current = query;
    setSearchState({ status: 'loading', cities: [], error: null, query });
    try {
      const cities = await searchCities(query);
      if (id !== searchOperationId.current) return;
      setSearchState({
        status: cities.length ? 'success' : 'empty',
        cities: cities.slice(0, 10),
        error: null,
        query,
      });
    } catch (cause) {
      if (id !== searchOperationId.current) return;
      const error =
        cause instanceof WeatherServiceError
          ? cause
          : new Error('Não foi possível pesquisar cidades. Tente novamente.', { cause });
      setSearchState({ status: 'error', cities: [], error, query });
    }
  }, []);

  const selectCity = useCallback(async (city: City) => {
    const id = ++weatherOperationId.current;
    lastCity.current = city;
    setWeatherState({ status: 'loading', selectedCity: city, data: null, error: null });
    try {
      const data = await getWeather(city);
      if (id !== weatherOperationId.current) return;
      setWeatherState({ status: 'success', selectedCity: city, data, error: null });
    } catch (cause) {
      if (id !== weatherOperationId.current) return;
      const error =
        cause instanceof WeatherServiceError
          ? cause
          : new Error('Não foi possível consultar o clima. Tente novamente.', { cause });
      setWeatherState({ status: 'error', selectedCity: city, data: null, error });
    }
  }, []);

  const retrySearch = useCallback(() => {
    if (lastSearch.current) return search(lastSearch.current);
  }, [search]);

  const retryWeather = useCallback(() => {
    if (lastCity.current) return selectCity(lastCity.current);
  }, [selectCity]);

  return {
    searchStatus: searchState.status,
    cities: searchState.cities,
    searchError: searchState.error,
    query: searchState.query,
    search,
    retrySearch,
    weatherStatus: weatherState.status,
    selectedCity: weatherState.selectedCity,
    data: weatherState.data,
    weatherError: weatherState.error,
    selectCity,
    retryWeather,
  };
}
