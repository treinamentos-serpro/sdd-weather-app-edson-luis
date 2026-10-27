import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

const city = {
  id: 3448439,
  name: 'São Paulo',
  latitude: -23.5475,
  longitude: -46.63611,
  country: 'Brasil',
  admin1: 'São Paulo',
};

function mockResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function forecastResponse() {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      time: '2026-10-27T13:00',
      temperature_2m: 22.4,
      apparent_temperature: 23.1,
      relative_humidity_2m: 65,
      weather_code: 2,
      wind_speed_10m: 12.5,
      precipitation: 0.2,
      pressure_msl: 1013.2,
    },
    daily: {
      time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
      temperature_2m_min: [17.1, 18, 17.5, 16.8, 17.2],
      temperature_2m_max: [25, 26.2, 23.4, 24.7, 27.1],
      weather_code: [2, 3, 61, 2, 1],
      precipitation_probability_max: [10, 20, 70, 15, 5],
      wind_speed_10m_max: [18, 20.5, 22, 17.2, 16],
    },
  };
}

describe('getWeather', () => {
  it('solicita current e daily com coordenadas, unidades e período do contrato', async () => {
    const fetchMock = mockResponse(forecastResponse());

    await getWeather(city);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://api.open-meteo.com/v1/forecast?latitude=-23.5475&longitude=-46.63611&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&forecast_days=5&timezone=auto',
      { signal: expect.any(AbortSignal) },
    );
  });

  it('mapeia todos os campos atuais e os arrays paralelos para cinco dias', async () => {
    mockResponse(forecastResponse());

    const result = await getWeather(city);

    expect(result.city).toBe(city);
    expect(result.timezone).toBe('America/Sao_Paulo');
    expect(result.current).toEqual({
      temperatureC: 22.4,
      apparentTemperatureC: 23.1,
      relativeHumidity: 65,
      weatherCode: 2,
      windSpeedKmh: 12.5,
      precipitationMm: 0.2,
      pressureHpa: 1013.2,
      referenceTime: '2026-10-27T13:00',
    });
    expect(result.days).toEqual([
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
    ]);
  });

  it.each([
    null,
    undefined,
  ])('mantém precipitação %j como indisponível, sem substituir por zero', async (precipitation) => {
    const body = forecastResponse();
    mockResponse({
      ...body,
      current: { ...body.current, precipitation },
    });

    const result = await getWeather(city);

    expect(result.current.precipitationMm).toBeUndefined();
  });

  it('normaliza todos os campos opcionais ausentes ou nulos sem alterar datas', async () => {
    const body = forecastResponse();
    mockResponse({
      timezone: body.timezone,
      current: {
        temperature_2m: body.current.temperature_2m,
        time: null,
        apparent_temperature: null,
        relative_humidity_2m: undefined,
        weather_code: null,
        wind_speed_10m: undefined,
        precipitation: null,
        pressure_msl: undefined,
      },
      daily: {
        time: body.daily.time,
        temperature_2m_min: [null, undefined, null, undefined, null],
        temperature_2m_max: undefined,
        weather_code: null,
        precipitation_probability_max: [undefined, null, undefined, null, undefined],
        wind_speed_10m_max: undefined,
      },
    });

    const result = await getWeather(city);

    expect(result.current).toEqual({ temperatureC: body.current.temperature_2m });
    expect(result.days).toEqual(
      body.daily.time.map((date) => ({
        date,
        minimumC: undefined,
        maximumC: undefined,
        weatherCode: undefined,
        precipitationProbabilityMax: undefined,
        windSpeedMaxKmh: undefined,
      })),
    );
  });

  it('preserva zero e datas mesmo quando faltam métricas opcionais', async () => {
    mockResponse({
      timezone: 'America/Sao_Paulo',
      current: { temperature_2m: 0, weather_code: 0, precipitation: 0, wind_speed_10m: null },
      daily: {
        time: forecastResponse().daily.time,
        temperature_2m_min: [0, null, -2, null, 3],
      },
    });

    const result = await getWeather(city);

    expect(result.current.temperatureC).toBe(0);
    expect(result.current.weatherCode).toBe(0);
    expect(result.current.precipitationMm).toBe(0);
    expect(result.current.windSpeedKmh).toBeUndefined();
    expect(result.current.referenceTime).toBeUndefined();
    expect(result.current.apparentTemperatureC).toBeUndefined();
    expect(result.days).toHaveLength(5);
    expect(result.days.map((day) => day.minimumC)).toEqual([0, undefined, -2, undefined, 3]);
    expect(result.days.every((day) => day.maximumC === undefined)).toBe(true);
  });

  it.each([
    'Pacific/Kiritimati',
    'Pacific/Honolulu',
  ])('preserva datas locais em %s inclusive na virada do ano e limita a cinco itens', async (timezone) => {
    const time = [
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
    ];
    mockResponse({
      timezone,
      current: { temperature_2m: 20, time: '2026-12-30T23:15' },
      daily: { time },
    });

    const result = await getWeather(city);

    expect(result.timezone).toBe(timezone);
    expect(result.days.map((day) => day.date)).toEqual(time.slice(0, 5));
  });

  it.each([
    null,
    {},
    { ...forecastResponse(), current: undefined },
    { ...forecastResponse(), daily: undefined },
    { ...forecastResponse(), current: null },
    { ...forecastResponse(), daily: null },
    { ...forecastResponse(), current: [] },
    { ...forecastResponse(), daily: [] },
    { ...forecastResponse(), timezone: undefined },
    { ...forecastResponse(), timezone: 'Invalid/Timezone' },
    { ...forecastResponse(), current: {} },
    { ...forecastResponse(), current: { temperature_2m: null } },
    { ...forecastResponse(), current: { temperature_2m: '20' } },
    { ...forecastResponse(), current: { temperature_2m: 20, time: '2026-10-26T23:00' } },
    { ...forecastResponse(), current: { temperature_2m: 20, time: '2026-10-27T25:00' } },
    { ...forecastResponse(), daily: {} },
    { ...forecastResponse(), daily: { time: [] } },
    { ...forecastResponse(), daily: { time: forecastResponse().daily.time.slice(0, 4) } },
    {
      ...forecastResponse(),
      daily: { time: ['2026-02-29', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'] },
    },
    { ...forecastResponse(), daily: { time: Array(5).fill('2026-10-27') } },
    {
      ...forecastResponse(),
      daily: { time: ['2026-10-27', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'] },
    },
    { ...forecastResponse(), daily: { ...forecastResponse().daily, temperature_2m_min: [10] } },
    { ...forecastResponse(), daily: { ...forecastResponse().daily, weather_code: {} } },
  ])('rejeita resposta incompleta ou inválida: %j', async (body) => {
    mockResponse(body);

    const result = getWeather(city);

    await expect(result).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(result).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([400, 429, 500, 503])('classifica HTTP %i como erro de API sem retry', async (status) => {
    const fetchMock = mockResponse({}, status);

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'api', statusCode: status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('classifica falhas de rede e preserva a causa', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'network', cause });
  });

  it('classifica JSON ilegível como resposta inválida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('aborta após dez segundos e classifica timeout sem retry', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, { signal }: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = getWeather(city);
    const assertion = expect(result).rejects.toMatchObject({ kind: 'timeout' });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('remove o timer ao terminar a consulta', async () => {
    vi.useFakeTimers();
    mockResponse(forecastResponse());

    await getWeather(city);

    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { ...city, latitude: Number.NaN },
    { ...city, latitude: 91 },
    { ...city, longitude: -181 },
  ])('rejeita localização inválida sem acessar a rede: %j', async (invalidCity) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather(invalidCity)).rejects.toMatchObject({ kind: 'invalid-response' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna vazio sem acessar a rede para %j', async (name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normaliza e codifica o nome sem permitir parâmetros adicionais', async () => {
    const fetchMock = mockResponse({});
    const name = 'São Paulo &count=100/?#';

    await searchCities(`  ${name}  `);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  describe.each([
    ['geocodificação', () => searchCities('São Paulo'), {}],
    ['previsão', () => getWeather(city), forecastResponse()],
  ] as const)('timeout e transporte: %s', (_name, request, body) => {
    it.each([
      [
        new DOMException('Aborted', 'AbortError'),
        'timeout',
        'A consulta demorou mais de 10 segundos. Tente novamente.',
      ],
      [
        new TypeError('Failed to fetch'),
        'network',
        'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
      ],
    ])('converte %s em WeatherServiceError e limpa o timer', async (cause, kind, message) => {
      vi.useFakeTimers();
      const fetchMock = vi.fn().mockRejectedValue(cause);
      vi.stubGlobal('fetch', fetchMock);

      const result = request();

      await expect(result).rejects.toBeInstanceOf(WeatherServiceError);
      await expect(result).rejects.toMatchObject({ kind, message, cause });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['fetch', 'json'])('aborta em exatamente dez segundos durante %s', async (stage) => {
      vi.useFakeTimers();
      const fetchMock = vi.fn((_url: string, { signal }: RequestInit) => {
        const pendingResponse = () =>
          new Promise<Response>((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
          });
        return stage === 'fetch'
          ? pendingResponse()
          : Promise.resolve({ ok: true, json: pendingResponse });
      });
      vi.stubGlobal('fetch', fetchMock);
      const result = request();
      const assertion = expect(result).rejects.toMatchObject({
        name: 'WeatherServiceError',
        kind: 'timeout',
        message: 'A consulta demorou mais de 10 segundos. Tente novamente.',
      });

      await vi.advanceTimersByTimeAsync(9_999);
      expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(false);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(1);

      await assertion;
      expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('classifica desconexão durante a leitura do corpo como falha de rede', async () => {
      vi.useFakeTimers();
      const cause = new TypeError('Failed to fetch');
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(cause),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(request()).rejects.toMatchObject({
        kind: 'network',
        message: 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
        cause,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
      [200, body],
      [503, {}],
      [200, null],
    ])('limpa o timer para status %i e corpo %j', async (status, responseBody) => {
      vi.useFakeTimers();
      const fetchMock = mockResponse(responseBody, status);
      const result = request();

      if (status !== 200) {
        await expect(result).rejects.toMatchObject({ kind: 'api', statusCode: status });
      } else if (responseBody === null) {
        await expect(result).rejects.toMatchObject({ kind: 'invalid-response' });
      } else {
        await result;
      }

      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    });
  });

  it('mapeia apenas os campos de City, preservando a ordem e campos opcionais ausentes', async () => {
    const otherCity = { id: 2, name: 'Outra cidade', latitude: 0, longitude: 0 };
    mockResponse({ results: [{ ...city, timezone: 'America/Sao_Paulo' }, otherCity] });

    const cities = await searchCities('São Paulo');

    expect(cities).toEqual([city, otherCity]);
    expect(cities[0]).not.toHaveProperty('timezone');
  });

  it('limita os resultados a dez cidades na ordem da fonte', async () => {
    const cities = Array.from({ length: 12 }, (_, id) => ({ ...city, id }));
    mockResponse({ results: cities });

    await expect(searchCities('São Paulo')).resolves.toEqual(cities.slice(0, 10));
  });

  it.each([{}, { results: [] }])('retorna vazio para busca sem resultados: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it.each([400, 429, 500, 503])('lança WeatherServiceError para HTTP %i', async (status) => {
    mockResponse({}, status);

    const result = searchCities('São Paulo');

    await expect(result).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(result).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'api',
      statusCode: status,
    });
  });

  it('classifica falhas de rede e preserva a causa', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      kind: 'network',
      cause,
    });
  });

  it('rejeita JSON ilegível como resposta inválida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([
    null,
    [],
    { results: null },
    { results: {} },
    { results: [null] },
    { results: [{ ...city, id: '1' }] },
    { results: [{ ...city, name: '' }] },
    { results: [{ ...city, latitude: null }] },
    { results: [{ ...city, longitude: '0' }] },
    { results: [{ ...city, country: 123 }] },
  ])('rejeita estrutura incompatível sem mascarar a falha como busca vazia: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('São Paulo')).rejects.toMatchObject({ kind: 'invalid-response' });
  });
});
