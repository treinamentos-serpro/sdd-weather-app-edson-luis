import { expect, test, type Browser, type Page } from '@playwright/test';

declare global {
  interface Window {
    __geolocationCalls: number;
  }
}

const cities = [
  {
    id: 1,
    name: 'Springfield',
    latitude: -23.5,
    longitude: -46.6,
    country: 'Brasil',
    admin1: 'São Paulo',
  },
  {
    id: 2,
    name: 'Springfield',
    latitude: -30,
    longitude: -51,
    country: 'Brasil',
    admin1: 'Rio Grande do Sul',
  },
];

const forecastDates = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'];

interface RouteOptions {
  search?: (name: string, count: number) => { status?: number; body: unknown };
  forecast?: (latitude: number, count: number) => { status?: number; body: unknown };
}

function forecastResponse(partial = false, timezone = 'Pacific/Kiritimati') {
  const current: Record<string, unknown> = {
    temperature_2m: 20,
    weather_code: partial ? 999 : 2,
  };
  if (!partial) {
    current.time = '2026-12-30T00:15';
    current.apparent_temperature = 19;
    current.relative_humidity_2m = 50;
    current.wind_speed_10m = 10;
    current.precipitation = 0;
    current.pressure_msl = 1013;
  }

  const daily: Record<string, unknown> = { time: forecastDates };
  if (!partial) {
    daily.weather_code = [2, 3, 61, 2, 1];
    daily.temperature_2m_min = [10, 11, 12, 13, 14];
    daily.temperature_2m_max = [20, 21, 22, 23, 24];
    daily.precipitation_probability_max = [0, 20, 70, 15, 5];
    daily.wind_speed_10m_max = [18, 20, 22, 17, 16];
  }

  return { timezone, current, daily };
}

async function installApiRoutes(page: Page, options: RouteOptions = {}) {
  const weatherRequests: URL[] = [];
  const searchRequests: URL[] = [];

  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const url = new URL(route.request().url());
    searchRequests.push(url);
    const result = options.search?.(url.searchParams.get('name') ?? '', searchRequests.length) ?? {
      body: { results: cities },
    };
    await route.fulfill({
      status: result.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    });
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    const url = new URL(route.request().url());
    weatherRequests.push(url);
    const latitude = Number(url.searchParams.get('latitude'));
    const result = options.forecast?.(latitude, weatherRequests.length) ?? {
      body: forecastResponse(),
    };
    await route.fulfill({
      status: result.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    });
  });

  return { searchRequests, weatherRequests };
}

async function startAppWithTimezone(browser: Browser, timezoneId: string) {
  const context = await browser.newContext({ timezoneId });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-12-30T11:30:00Z') });
  await installApiRoutes(page);
  await page.goto('http://localhost:5173');
  return { context, page };
}

async function searchSpringfield(page: Page, method: 'enter' | 'button' = 'enter') {
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Springfield');
  if (method === 'enter') await page.getByRole('searchbox').press('Enter');
  else await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('region', { name: 'Resultados da busca' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-30T11:30:00Z') });
});

test('jornada de busca, seleção de homônimo, previsão e unidade', async ({ page }, testInfo) => {
  const { weatherRequests } = await installApiRoutes(page);
  await page.goto('/');
  const isMobile = testInfo.project.name.startsWith('mobile-');
  if (isMobile) await page.setViewportSize({ width: 320, height: 900 });
  await searchSpringfield(page);

  const cityButtons = page.getByRole('region', { name: 'Resultados da busca' }).getByRole('button');
  await expect(cityButtons).toHaveCount(2);
  await expect(cityButtons.nth(0)).toContainText('São Paulo, Brasil');
  await expect(cityButtons.nth(1)).toContainText('Rio Grande do Sul, Brasil');
  expect(weatherRequests).toHaveLength(0);

  if (isMobile) await cityButtons.nth(1).tap();
  else await cityButtons.nth(1).click();
  await expect(page.getByRole('heading', { name: 'Springfield' })).toBeVisible();
  await expect(page.getByText('Rio Grande do Sul, Brasil').last()).toBeVisible();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('20 °C');
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();

  const dates = await page
    .getByRole('article')
    .locator('time')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLTimeElement).dateTime));
  const fahrenheit = page.getByRole('button', { name: 'Fahrenheit' });
  if (isMobile) await fahrenheit.tap();
  else await fahrenheit.click();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('68 °F');
  await expect(
    page
      .getByRole('article')
      .locator('time')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLTimeElement).dateTime)),
  ).resolves.toEqual(dates);
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(weatherRequests).toHaveLength(1);
  expect(weatherRequests[0].searchParams.get('latitude')).toBe('-30');
  expect(weatherRequests[0].searchParams.get('forecast_days')).toBe('5');
  expect(weatherRequests[0].searchParams.get('timezone')).toBe('auto');
});

test('busca pode ser enviada por botão e vazio não é confundido com erro', async ({ page }) => {
  await installApiRoutes(page, {
    search: (name) => ({ body: { results: name === 'Ausente' ? [] : cities } }),
  });
  await page.goto('/');
  await page.getByRole('searchbox').fill('Ausente');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
});

test('geocoding sem results mostra Nenhuma cidade encontrada sem erro', async ({ page }) => {
  const { searchRequests, weatherRequests } = await installApiRoutes(page, {
    search: () => ({ body: {} }),
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Ausente');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Resultados da busca' })).toHaveCount(0);
  expect(searchRequests).toHaveLength(1);
  expect(weatherRequests).toHaveLength(0);
});

test('busca em viewport mobile 375x812 renderiza o clima corretamente', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { weatherRequests } = await installApiRoutes(page);
  await page.goto('/');
  await searchSpringfield(page, 'button');
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button', { name: 'Springfield São Paulo, Brasil', exact: true })
    .click();

  const currentWeather = page.getByRole('region', { name: 'Springfield', exact: true });
  await expect(currentWeather.getByRole('heading', { name: 'Springfield' })).toBeVisible();
  await expect(currentWeather.getByText('São Paulo, Brasil', { exact: true })).toBeVisible();
  await expect(currentWeather.getByLabel('Temperatura atual')).toHaveText('20 °C');
  await expect(currentWeather.getByText('Sensação térmica: 19 °C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias', exact: true });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('article')).toHaveCount(5);
  await expect(
    forecast.getByRole('article').first().getByText('10 °C', { exact: true }),
  ).toBeVisible();
  await expect(
    forecast.getByRole('article').first().getByText('20 °C', { exact: true }),
  ).toBeVisible();
  expect(weatherRequests).toHaveLength(1);
  expect(weatherRequests[0].searchParams.get('latitude')).toBe(String(cities[0].latitude));
  expect(weatherRequests[0].searchParams.get('longitude')).toBe(String(cities[0].longitude));
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test('erro de busca pode ser repetido sem reenviar a consulta', async ({ page }) => {
  await installApiRoutes(page, {
    search: (_name, count) =>
      count === 1
        ? { status: 503, body: { reason: 'unavailable' } }
        : { body: { results: cities } },
  });
  await page.goto('/');
  await page.getByRole('searchbox').fill('Springfield');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toContainText('Não foi possível pesquisar cidades.');
  const retry = page.getByRole('button', { name: 'Tentar novamente' });
  await retry.focus();
  await expect(retry).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Resultados da busca' })).toBeVisible();
  await expect(page.getByRole('searchbox')).toHaveValue('Springfield');
});

test('seleção preserva a cidade e retry do clima consulta novamente sem retry automático', async ({
  page,
}) => {
  const { weatherRequests } = await installApiRoutes(page, {
    forecast: (_latitude, count) =>
      count === 1 ? { status: 503, body: { reason: 'unavailable' } } : { body: forecastResponse() },
  });
  await page.goto('/');
  await searchSpringfield(page);
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button')
    .first()
    .click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível consultar o clima.');
  await expect(page.getByText('Cidade selecionada: Springfield')).toBeVisible();
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);
  await expect.poll(() => weatherRequests.length).toBe(1);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('20 °C');
  expect(weatherRequests).toHaveLength(2);
  expect(weatherRequests[0].searchParams.get('latitude')).toBe('-23.5');
  expect(weatherRequests[1].searchParams.get('latitude')).toBe('-23.5');
});

test('resposta meteorológica atrasada não substitui a cidade selecionada mais recentemente', async ({
  page,
}) => {
  let releaseFirst!: () => void;
  let signalFirstStarted!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    signalFirstStarted = resolve;
  });
  const firstResponse = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ results: cities }),
    });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    const latitude = new URL(route.request().url()).searchParams.get('latitude');
    if (latitude === '-23.5') {
      signalFirstStarted();
      await firstResponse;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse()),
    });
  });
  await page.goto('/');
  await searchSpringfield(page);
  const buttons = page.getByRole('region', { name: 'Resultados da busca' }).getByRole('button');
  await buttons.nth(0).click();
  await firstStarted;
  await buttons.nth(1).click();
  await expect(page.getByRole('button', { name: /Rio Grande do Sul, Brasil/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Temperatura atual')).toBeVisible();
  const currentLocation = page.getByRole('heading', { name: 'Springfield' }).locator('..');
  await expect(currentLocation).toContainText('Rio Grande do Sul, Brasil');

  releaseFirst();
  await expect(currentLocation).toContainText('Rio Grande do Sul, Brasil');
  await expect(currentLocation).not.toContainText('São Paulo, Brasil');
});

test('busca, seleção e unidade funcionam por teclado com rótulos e foco visível', async ({
  page,
}) => {
  await installApiRoutes(page);
  await page.goto('/');
  const searchbox = page.getByRole('searchbox', { name: 'Cidade' });
  await searchbox.fill('Springfield');
  await searchbox.press('Enter');
  const cityButton = page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button')
    .first();
  await cityButton.focus();
  await expect(cityButton).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Temperatura atual')).toBeVisible();

  const celsius = page.getByRole('button', { name: 'Celsius' });
  await celsius.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Temperatura atual')).toHaveText('68 °F');
});

test('responsividade em 320, 768 e 1920 px com nome longo, loading, erro e retry', async ({
  page,
}) => {
  let releaseFirst!: () => void;
  let signalFirstStarted!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    signalFirstStarted = resolve;
  });
  const firstResponse = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  let forecastCount = 0;
  await installApiRoutes(page, {
    search: () => ({
      body: {
        results: [
          {
            ...cities[0],
            name: 'Nome de cidade excepcionalmente longo para teste de responsividade',
            admin1: 'Região administrativa com nome muito extenso',
          },
        ],
      },
    }),
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastCount += 1;
    if (forecastCount === 1) {
      signalFirstStarted();
      await firstResponse;
      await route.fulfill({ status: 503, body: 'unavailable' });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse()),
    });
  });
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole('searchbox').fill('Nome longo');
  await page.getByRole('searchbox').press('Enter');
  const resultButton = page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button');
  await expect(resultButton).toContainText('Nome de cidade excepcionalmente longo');
  await resultButton.click();
  await firstStarted;
  await expect(page.getByRole('status')).toContainText('Carregando dados meteorológicos');
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);

  releaseFirst();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);

  for (const width of [320, 768, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    await expect(page.getByRole('searchbox')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(5);
  }
});

test('timeout meteorológico termina em erro sem repetição automática', async ({ page }) => {
  await installApiRoutes(page);
  await page.route('https://api.open-meteo.com/**', async () => {
    await new Promise<void>(() => {});
  });
  await page.goto('/');
  await searchSpringfield(page);
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button')
    .first()
    .click();
  await page.clock.fastForward(10_000);
  await expect(page.getByRole('alert')).toContainText('A requisição demorou demais.');
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});

test('dados parciais, condição desconhecida e referência ausente são identificados', async ({
  page,
}) => {
  await installApiRoutes(page, {
    forecast: () => ({ body: forecastResponse(true) }),
  });
  await page.goto('/');
  await searchSpringfield(page);
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button')
    .first()
    .click();

  await expect(page.getByText('Condição indisponível').first()).toBeVisible();
  await expect(page.getByText('Referência dos dados: Indisponível')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByRole('article').first()).toContainText('Indisponível');
  await expect(page.getByRole('article').first().locator('time')).toHaveAttribute(
    'datetime',
    forecastDates[0],
  );
});

test('datas-calendário permanecem no fuso da cidade quando o navegador está à frente e atrás', async ({
  browser,
}) => {
  for (const timezoneId of ['Pacific/Kiritimati', 'Etc/GMT+12']) {
    const { context, page } = await startAppWithTimezone(browser, timezoneId);
    await searchSpringfield(page);
    await page
      .getByRole('region', { name: 'Resultados da busca' })
      .getByRole('button')
      .first()
      .click();
    await expect(page.getByRole('article')).toHaveCount(5);
    const dates = await page
      .getByRole('article')
      .locator('time')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLTimeElement).dateTime));
    expect(dates).toEqual(forecastDates);
    await context.close();
  }
});

test('não persiste consulta, coordenadas ou unidade e não solicita geolocalização/analytics', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(window, '__geolocationCalls', { value: 0, writable: true });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition() {
          window.__geolocationCalls += 1;
        },
        watchPosition() {
          window.__geolocationCalls += 1;
          return 0;
        },
      },
    });
  });
  page.on('request', (request) => requests.push(request.url()));
  await installApiRoutes(page);
  await page.goto('/');
  await searchSpringfield(page);
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button')
    .first()
    .click();
  await expect(page.getByLabel('Temperatura atual')).toBeVisible();
  await page.getByRole('button', { name: 'Fahrenheit' }).click();

  const inspectStorage = async () =>
    page.evaluate(async () => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      databases: (await indexedDB.databases()).map((database) => database.name),
      geolocationCalls: window.__geolocationCalls,
    }));
  expect(await inspectStorage()).toEqual({
    local: [],
    session: [],
    databases: [],
    geolocationCalls: 0,
  });
  expect(await page.context().cookies()).toEqual([]);
  await page.reload();
  expect(await inspectStorage()).toEqual({
    local: [],
    session: [],
    databases: [],
    geolocationCalls: 0,
  });
  expect(requests.some((url) => /analytics|google-analytics|googletagmanager/i.test(url))).toBe(
    false,
  );
  expect(requests.some((url) => url.includes('geocoding-api.open-meteo.com'))).toBe(true);
  expect(requests.some((url) => url.includes('api.open-meteo.com'))).toBe(true);
});
