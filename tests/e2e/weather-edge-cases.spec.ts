import { expect, test, type Page } from '@playwright/test';

const city = {
  id: 3448439,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  admin1: 'São Paulo',
  country: 'Brasil',
};

const dates = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'];

function partialForecast(temperature: number) {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      temperature_2m: temperature,
      relative_humidity_2m: null,
      weather_code: 0,
      wind_speed_10m: 0,
      precipitation: null,
    },
    daily: {
      time: dates,
      temperature_2m_min: [0, null, -1, 2, 3],
      weather_code: [0, null, 61, 2, 1],
      precipitation_probability_max: [0, null, 70, 15, 5],
    },
  };
}

async function mockCitySearch(page: Page) {
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({ json: { results: [city] } }),
  );
}

async function selectCity(page: Page) {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade', exact: true }).fill(city.name);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button', { name: 'São Paulo São Paulo, Brasil', exact: true })
    .click();
}

test('recupera erro HTTP do clima somente após retry explícito', async ({ page }) => {
  await mockCitySearch(page);
  let forecastRequests = 0;

  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      await route.fulfill({ status: 503, json: {} });
      return;
    }

    await route.fulfill({ json: partialForecast(20) });
  });

  await selectCity(page);

  await expect(page.getByRole('alert')).toHaveText('Não foi possível consultar o clima.');
  expect(forecastRequests).toBe(1);
  await expect(page.getByText('Cidade selecionada: São Paulo')).toBeVisible();

  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(page.getByLabel('Temperatura atual')).toHaveText('20 °C');
  expect(forecastRequests).toBe(2);
});

test('exibe dados parciais sem inventar métricas nem ocultar as datas', async ({ page }) => {
  await mockCitySearch(page);
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({ json: partialForecast(0) }),
  );

  await selectCity(page);

  const current = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(current.getByLabel('Temperatura atual')).toHaveText('0 °C');
  await expect(current.getByText('Sensação térmica: Indisponível')).toBeVisible();
  await expect(current.getByText('0 km/h')).toBeVisible();
  await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(3);

  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias', exact: true });
  await expect(forecast.getByRole('article')).toHaveCount(5);

  const firstDay = forecast.getByRole('article', { name: 'ter., 27/10' });
  await expect(firstDay.getByText('0 °C', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('0 %', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('Indisponível')).toHaveCount(2);

  const secondDay = forecast.getByRole('article', { name: 'qua., 28/10' });
  await expect(secondDay.getByRole('heading', { name: 'qua., 28/10' })).toBeVisible();
  await expect(secondDay.getByText('Condição indisponível')).toBeVisible();
  await expect(secondDay.getByText('Indisponível', { exact: true })).toHaveCount(4);
});

test('aplica a unidade escolhida enquanto a consulta meteorológica carrega', async ({ page }) => {
  await mockCitySearch(page);
  let releaseForecast: (() => void) | undefined;

  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    await new Promise<void>((resolve) => {
      releaseForecast = resolve;
    });
    await route.fulfill({ json: partialForecast(22.4) });
  });

  await selectCity(page);
  await expect(page.getByText('Carregando dados meteorológicos de São Paulo...')).toBeVisible();
  await expect.poll(() => releaseForecast).toBeDefined();

  await page.getByRole('button', { name: 'Fahrenheit', exact: true }).click();
  releaseForecast?.();

  await expect(page.getByLabel('Temperatura atual')).toHaveText('72 °F');
  const firstDay = page
    .getByRole('region', { name: 'Previsão de 5 dias', exact: true })
    .getByRole('article', { name: 'ter., 27/10' });
  await expect(firstDay.getByText('32 °F', { exact: true })).toBeVisible();
});
