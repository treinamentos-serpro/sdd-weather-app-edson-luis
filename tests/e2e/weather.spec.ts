import { expect, test } from '@playwright/test';

test('busca cidade, exibe cinco dias e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  const city = {
    id: 3448439,
    name: 'São Paulo',
    latitude: -23.55,
    longitude: -46.63,
    admin1: 'São Paulo',
    country: 'Brasil',
  };
  let forecastRequests = 0;

  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('name')).toBe('São Paulo');
    await route.fulfill({ json: { results: [city] } });
  });

  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    forecastRequests += 1;
    const url = new URL(route.request().url());
    expect(url.searchParams.get('latitude')).toBe(String(city.latitude));
    expect(url.searchParams.get('longitude')).toBe(String(city.longitude));
    await route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: {
          time: '2026-10-27T12:00',
          temperature_2m: 20,
          apparent_temperature: 19,
          relative_humidity_2m: 60,
          weather_code: 2,
          wind_speed_10m: 10,
          precipitation: 0,
          pressure_msl: 1013,
        },
        daily: {
          time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
          temperature_2m_min: [10, 11, 12, 13, 14],
          temperature_2m_max: [20, 21, 22, 23, 24],
          weather_code: [2, 3, 61, 2, 1],
          precipitation_probability_max: [0, 20, 70, 15, 5],
          wind_speed_10m_max: [18, 20, 22, 17, 16],
        },
      },
    });
  });

  await page.clock.install({ time: new Date('2026-10-27T15:00:00Z') });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade', exact: true }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page
    .getByRole('region', { name: 'Resultados da busca' })
    .getByRole('button', { name: 'São Paulo São Paulo, Brasil', exact: true })
    .click();

  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(currentWeather.getByLabel('Temperatura atual')).toHaveText('20 °C');

  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias', exact: true });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('article')).toHaveCount(5);

  const fahrenheit = page.getByRole('button', { name: 'Fahrenheit', exact: true });
  await fahrenheit.click();
  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  await expect(currentWeather.getByLabel('Temperatura atual')).toHaveText('68 °F');
  await expect(currentWeather.getByText('Sensação térmica: 66 °F', { exact: true })).toBeVisible();
  await expect(
    forecast.getByRole('article').first().getByText('68 °F', { exact: true }),
  ).toBeVisible();
  await expect(
    forecast.getByRole('article').first().getByText('50 °F', { exact: true }),
  ).toBeVisible();
  expect(forecastRequests).toBe(1);
});
