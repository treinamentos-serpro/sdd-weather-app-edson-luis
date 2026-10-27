import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { formatDayLabel } from '../../src/lib/format';
import { formatTemperature } from '../../src/lib/temperature';
import { mockWeatherData } from '../../src/mocks/weather';

describe('ForecastList', () => {
  it('exibe as cinco datas na ordem recebida com os valores correspondentes (CA-02.3)', () => {
    render(<ForecastList days={mockWeatherData.days} unit="celsius" />);

    const region = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(5);
    expect(within(region).getAllByRole('article')).toHaveLength(5);
    expect(
      within(region)
        .getAllByRole('heading', { level: 3 })
        .map((node) => node.textContent),
    ).toEqual(mockWeatherData.days.map((day) => formatDayLabel(day.date)));
    for (const day of mockWeatherData.days) {
      const card = within(region).getByRole('article', { name: formatDayLabel(day.date) });
      expect(within(card).getByText(formatTemperature(day.maximumC, 'celsius'))).toBeVisible();
      expect(within(card).getByText(`${day.precipitationProbabilityMax} %`)).toBeVisible();
    }
  });

  it('atualiza todos os cards quando a unidade muda (CA-04.4)', () => {
    const { rerender } = render(<ForecastList days={mockWeatherData.days} unit="celsius" />);
    rerender(<ForecastList days={mockWeatherData.days} unit="fahrenheit" />);

    for (const day of mockWeatherData.days) {
      const card = screen.getByRole('article', { name: formatDayLabel(day.date) });
      expect(within(card).getByText(formatTemperature(day.maximumC, 'fahrenheit'))).toBeVisible();
      expect(within(card).getByText(formatTemperature(day.minimumC, 'fahrenheit'))).toBeVisible();
    }
  });

  it('preserva dias sem métricas sem ocultar os demais (CA-02.5)', () => {
    const days = mockWeatherData.days.map((day, index) => (index === 2 ? { date: day.date } : day));
    render(<ForecastList days={days} unit="celsius" />);

    expect(screen.getAllByRole('article')).toHaveLength(5);
    const unavailableDay = screen.getByRole('article', { name: 'qui., 29/10' });
    expect(within(unavailableDay).getByText('Condição indisponível')).toBeVisible();
    expect(within(unavailableDay).getAllByText('Indisponível')).toHaveLength(4);
    expect(screen.getByRole('article', { name: 'sex., 30/10' })).toBeVisible();
  });

  it('informa previsão indisponível para uma lista vazia sem fabricar datas', () => {
    render(<ForecastList days={[]} unit="celsius" />);

    expect(screen.getByRole('status')).toHaveTextContent('Previsão indisponível.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
