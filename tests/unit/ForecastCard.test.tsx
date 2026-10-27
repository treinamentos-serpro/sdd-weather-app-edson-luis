import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import type { ForecastDay } from '../../src/types/weather';

const day: ForecastDay = {
  date: '2026-10-27',
  minimumC: 0,
  maximumC: 20,
  weatherCode: 61,
  precipitationProbabilityMax: 70,
  windSpeedMaxKmh: 12.5,
};

function expectMetric(label: string, value: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  expect(term.nextElementSibling).toHaveTextContent(value);
}

describe('ForecastCard', () => {
  it('exibe data local, condição e métricas com unidades (CA-02.1–CA-02.3)', () => {
    render(<ForecastCard day={day} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'ter., 27/10' })).toBeVisible();
    expect(screen.getByText('ter., 27/10')).toHaveAttribute('datetime', day.date);
    expect(screen.getByText('Chuva leve')).toBeVisible();
    expect(screen.getByText('🌧️')).toHaveAttribute('aria-hidden', 'true');
    expectMetric('Máxima', '20 °C');
    expectMetric('Mínima', '0 °C');
    expectMetric('Probabilidade de chuva', '70 %');
    expectMetric('Vento máximo', '12,5 km/h');
  });

  it('converte máxima e mínima sem alterar os dados ou outras métricas (CA-04.2–CA-04.3)', () => {
    const original = structuredClone(day);
    const { rerender } = render(<ForecastCard day={day} unit="celsius" />);

    for (let count = 0; count < 3; count += 1) {
      rerender(<ForecastCard day={day} unit="fahrenheit" />);
      expectMetric('Máxima', '68 °F');
      expectMetric('Mínima', '32 °F');
      expectMetric('Probabilidade de chuva', '70 %');
      expectMetric('Vento máximo', '12,5 km/h');

      rerender(<ForecastCard day={day} unit="celsius" />);
      expectMetric('Máxima', '20 °C');
      expectMetric('Mínima', '0 °C');
    }

    expect(day).toEqual(original);
  });

  it('mantém a data e identifica todas as métricas ausentes (CA-02.4–CA-02.5)', () => {
    render(<ForecastCard day={{ date: day.date }} unit="fahrenheit" />);

    expect(screen.getByRole('heading', { name: 'ter., 27/10' })).toBeVisible();
    expect(screen.getByText('Condição indisponível')).toBeVisible();
    for (const label of ['Máxima', 'Mínima', 'Probabilidade de chuva', 'Vento máximo']) {
      expectMetric(label, 'Indisponível');
    }
  });

  it('preserva probabilidades e vento iguais a zero', () => {
    render(
      <ForecastCard
        day={{ ...day, precipitationProbabilityMax: 0, windSpeedMaxKmh: 0 }}
        unit="celsius"
      />,
    );

    expectMetric('Probabilidade de chuva', '0 %');
    expectMetric('Vento máximo', '0 km/h');
  });

  it.each([
    Number.NaN,
    Infinity,
    -1,
    101,
  ])('identifica probabilidade inválida %s sem apresentá-la como dado válido', (probability) => {
    render(
      <ForecastCard
        day={{
          ...day,
          maximumC: Number.NaN,
          minimumC: Infinity,
          weatherCode: 999,
          precipitationProbabilityMax: probability,
          windSpeedMaxKmh: -1,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Condição indisponível')).toBeVisible();
    for (const label of ['Máxima', 'Mínima', 'Probabilidade de chuva', 'Vento máximo']) {
      expectMetric(label, 'Indisponível');
    }
  });
});
