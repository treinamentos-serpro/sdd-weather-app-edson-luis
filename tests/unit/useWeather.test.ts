import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const city = mockWeatherData.city;
const otherCity: City = { ...city, id: 2, name: 'Outra cidade', latitude: 10 };
const otherWeather: WeatherData = { ...mockWeatherData, city: otherCity };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([city, otherCity]);
  vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
});

describe('useWeather', () => {
  it('inicia em idle sem consultar serviços e ignora retry sem operação', async () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current).toMatchObject({
      searchStatus: 'idle',
      weatherStatus: 'idle',
      cities: [],
      selectedCity: null,
      data: null,
    });
    await act(async () => {
      await result.current.retrySearch();
      await result.current.retryWeather();
    });
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('normaliza a consulta e disponibiliza até dez cidades sem escolher uma automaticamente', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('  São Paulo  ');
    });

    expect(result.current).toMatchObject({
      searchStatus: 'success',
      cities: [city, otherCity],
      query: 'São Paulo',
      weatherStatus: 'idle',
      selectedCity: null,
      data: null,
    });
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('busca vazia não altera a cidade nem os dados meteorológicos selecionados', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.selectCity(city);
    });

    vi.mocked(searchCities).mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.search('Desconhecida');
    });

    expect(result.current).toMatchObject({
      searchStatus: 'empty',
      weatherStatus: 'success',
      selectedCity: city,
      data: mockWeatherData,
    });
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
  });

  it('retry de busca repete a consulta normalizada sem selecionar uma cidade', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(
      new WeatherServiceError('network', 'Falha de rede.'),
    );
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('  São Paulo ');
    });
    expect(result.current.searchError).toMatchObject({ kind: 'network' });
    expect(result.current.searchStatus).toBe('error');

    await act(async () => {
      await result.current.retrySearch();
    });

    expect(searchCities).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(result.current.searchStatus).toBe('success');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it.each([new TypeError('Failed to fetch'), 'erro interno'])(
    'apresenta mensagens amigáveis e preserva a causa inesperada: %s',
    async (cause) => {
      vi.mocked(searchCities).mockRejectedValueOnce(cause);
      vi.mocked(getWeather).mockRejectedValueOnce(cause);
      const { result } = renderHook(() => useWeather());

      await act(async () => {
        await result.current.search(city.name);
        await result.current.selectCity(city);
      });

      expect(result.current.searchError).toMatchObject({
        message: 'Não foi possível pesquisar cidades. Tente novamente.',
        cause,
      });
      expect(result.current.weatherError).toMatchObject({
        message: 'Não foi possível consultar o clima. Tente novamente.',
        cause,
      });
      expect(result.current.searchStatus).toBe('error');
      expect(result.current.weatherStatus).toBe('error');
      expect(result.current.selectedCity).toBe(city);
      expect(result.current.data).toBeNull();
    },
  );

  it.each(['network', 'timeout'] as const)(
    'preserva o erro %s e repete somente a última operação de cada tipo',
    async (kind) => {
      const error = new WeatherServiceError(kind, 'Verifique sua conexão e tente novamente.');
      const { result } = renderHook(() => useWeather());
      await act(async () => {
        await result.current.search(city.name);
        await result.current.selectCity(city);
      });
      vi.mocked(searchCities).mockRejectedValueOnce(error);
      vi.mocked(getWeather).mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.search(`  ${otherCity.name}  `);
        await result.current.selectCity(otherCity);
      });
      expect(result.current.searchError).toBe(error);
      expect(result.current.weatherError).toBe(error);
      expect(result.current.data).toBeNull();
      expect(searchCities).toHaveBeenCalledTimes(2);
      expect(getWeather).toHaveBeenCalledTimes(2);

      await act(async () => {
        await result.current.retrySearch();
      });
      expect(searchCities).toHaveBeenLastCalledWith(otherCity.name);
      expect(getWeather).toHaveBeenCalledTimes(2);
      expect(result.current.searchError).toBeNull();
      expect(result.current.weatherError).toBe(error);

      vi.mocked(getWeather).mockResolvedValueOnce(otherWeather);
      await act(async () => {
        await result.current.retryWeather();
      });
      expect(getWeather).toHaveBeenLastCalledWith(otherCity);
      expect(searchCities).toHaveBeenCalledTimes(3);
      expect(getWeather).toHaveBeenCalledTimes(3);
      expect(result.current.weatherError).toBeNull();
      expect(result.current.data).toBe(otherWeather);
    },
  );

  it('seleção limpa dados anteriores de imediato e mantém a cidade durante loading', async () => {
    const forecast = deferred<WeatherData>();
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.selectCity(city);
    });
    vi.mocked(getWeather).mockReturnValueOnce(forecast.promise);

    let request!: Promise<void>;
    act(() => {
      request = result.current.selectCity(otherCity);
    });

    expect(result.current).toMatchObject({
      weatherStatus: 'loading',
      selectedCity: otherCity,
      data: null,
    });
    await act(async () => {
      forecast.resolve(otherWeather);
      await request;
    });
    expect(result.current).toMatchObject({
      weatherStatus: 'success',
      selectedCity: otherCity,
      data: otherWeather,
    });
  });

  it('erro meteorológico preserva a cidade e retry consulta apenas essa cidade', async () => {
    const error = new WeatherServiceError('api', 'Serviço indisponível.', 503);
    vi.mocked(getWeather).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    expect(result.current).toMatchObject({
      weatherStatus: 'error',
      selectedCity: otherCity,
      weatherError: error,
      data: null,
    });

    vi.mocked(getWeather).mockResolvedValueOnce(otherWeather);
    await act(async () => {
      await result.current.retryWeather();
    });

    expect(getWeather).toHaveBeenNthCalledWith(2, otherCity);
    expect(searchCities).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      weatherStatus: 'success',
      selectedCity: otherCity,
      data: otherWeather,
    });
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('ignora resposta meteorológica obsoleta que termina com %s', async (outcome) => {
    const oldForecast = deferred<WeatherData>();
    vi.mocked(getWeather)
      .mockReturnValueOnce(oldForecast.promise)
      .mockResolvedValueOnce(otherWeather);
    const { result } = renderHook(() => useWeather());
    let oldRequest!: Promise<void>;

    act(() => {
      oldRequest = result.current.selectCity(city);
    });
    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    await act(async () => {
      if (outcome === 'resolve') oldForecast.resolve(mockWeatherData);
      else oldForecast.reject(new Error('Erro tardio'));
      await oldRequest;
    });

    expect(result.current).toMatchObject({
      weatherStatus: 'success',
      selectedCity: otherCity,
      data: otherWeather,
    });
  });

  it('ignora respostas de busca obsoletas', async () => {
    const oldLookup = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(oldLookup.promise).mockResolvedValueOnce([city]);
    const { result } = renderHook(() => useWeather());
    let oldRequest!: Promise<void>;

    act(() => {
      oldRequest = result.current.search('Antiga');
    });
    await act(async () => {
      await result.current.search(city.name);
    });
    await act(async () => {
      oldLookup.resolve([otherCity]);
      await oldRequest;
    });

    expect(result.current.cities).toEqual([city]);
    expect(result.current.query).toBe(city.name);
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('entrada inválida não chama a API', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search(' a ');
    });
    expect(result.current.searchStatus).toBe('idle');
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('entrada inválida invalida uma busca anterior ainda em andamento', async () => {
    const pendingLookup = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pendingLookup.promise);
    const { result } = renderHook(() => useWeather());
    let request!: Promise<void>;

    act(() => {
      request = result.current.search('São Paulo');
    });
    await act(async () => {
      await result.current.search('a');
    });
    await act(async () => {
      pendingLookup.resolve([city]);
      await request;
    });

    expect(result.current.searchStatus).toBe('idle');
    expect(result.current.cities).toEqual([]);
    expect(getWeather).not.toHaveBeenCalled();
  });
});
