import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

const city = mockWeatherData.city;
const current: CurrentWeatherData = {
  ...mockWeatherData.current,
  precipitationMm: 0.2,
  pressureHpa: 1013.2,
};

function expectMetric(label: string, value: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  expect(term.nextElementSibling).toHaveTextContent(value);
}

describe('CurrentWeather', () => {
  it('exibe cidade, condição WMO, temperaturas e métricas em pt-BR', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    const hero = screen.getByRole('region', { name: 'São Paulo' });
    expect(within(hero).getByRole('heading', { name: city.name })).toBeVisible();
    expect(within(hero).getByText('São Paulo, Brasil')).toBeVisible();
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('22 °C');
    expect(screen.getByText('Sensação térmica: 23 °C')).toBeVisible();
    expect(screen.getByText('Parcialmente nublado')).toBeVisible();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expectMetric('Umidade', '65 %');
    expectMetric('Vento', '12,5 km/h');
    expectMetric('Precipitação', '0,2 mm');
    expectMetric('Pressão ao nível do mar', '1.013,2 hPa');
    expect(screen.getByText(/27\/10\/2026 às 13:00/)).toHaveAttribute(
      'datetime',
      current.referenceTime,
    );
  });

  it('converte temperatura e sensação sem alterar métricas ou dados canônicos', () => {
    const original = structuredClone(current);
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);

    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('72 °F');
    expect(screen.getByText('Sensação térmica: 74 °F')).toBeVisible();
    expectMetric('Vento', '12,5 km/h');
    expectMetric('Precipitação', '0,2 mm');
    expectMetric('Pressão ao nível do mar', '1.013,2 hPa');

    rerender(<CurrentWeather city={city} current={current} unit="celsius" />);
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('22 °C');
    expect(current).toEqual(original);
  });

  it('identifica dados ausentes e código desconhecido sem inventar valores', () => {
    render(
      <CurrentWeather
        city={{ id: 1, name: 'Exemplo', latitude: 0, longitude: 0 }}
        current={{ temperatureC: 0, weatherCode: 999 }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('32 °F');
    expect(screen.getByText('Condição indisponível')).toBeVisible();
    expect(screen.getByText('Sensação térmica: Indisponível')).toBeVisible();
    for (const label of ['Umidade', 'Vento', 'Precipitação', 'Pressão ao nível do mar']) {
      expectMetric(label, 'Indisponível');
    }
    expect(screen.getByText('Referência dos dados: Indisponível')).toBeVisible();
  });

  it('preserva zero em todas as métricas opcionais', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          temperatureC: 0,
          apparentTemperatureC: 0,
          relativeHumidity: 0,
          windSpeedKmh: 0,
          precipitationMm: 0,
          pressureHpa: 0,
          weatherCode: 0,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Céu limpo')).toBeVisible();
    expect(screen.getByText('Sensação térmica: 0 °C')).toBeVisible();
    expectMetric('Umidade', '0 %');
    expectMetric('Vento', '0 km/h');
    expectMetric('Precipitação', '0 mm');
    expectMetric('Pressão ao nível do mar', '0 hPa');
  });

  it('não apresenta métricas não finitas como dados válidos', () => {
    render(
      <CurrentWeather
        city={city}
        current={{ temperatureC: 20, relativeHumidity: Number.NaN, pressureHpa: Infinity }}
        unit="celsius"
      />,
    );

    expectMetric('Umidade', 'Indisponível');
    expectMetric('Pressão ao nível do mar', 'Indisponível');
  });
});
