import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { formatTemperature } from '../../src/lib/temperature';
import { mockWeatherData } from '../../src/mocks/weather';

describe('App com dados de demonstração', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function setup() {
    const user = userEvent.setup();
    const view = render(<App />);
    return { user, ...view };
  }

  async function finishLoading() {
    await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false'));
  }

  it('inicia em idle, com marca, busca, Celsius e atribuição', () => {
    setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Weather App' })).toBeVisible();
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Como está o tempo?');
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();
  });

  it('carrega o mock por Enter e converte todas as temperaturas sem alterar os dados', async () => {
    const original = structuredClone(mockWeatherData);
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-readonly', 'true');
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    await finishLoading();

    const successAnnouncement = screen.getByText(
      'Dados de demonstração carregados para São Paulo.',
    );
    expect(successAnnouncement).toHaveAttribute('aria-live', 'polite');
    expect(successAnnouncement).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('72 °F');
    expect(screen.getByText('Sensação térmica: 74 °F')).toBeVisible();
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
    const dates = cards.map((card) => card.querySelector('time')?.dateTime);

    for (const unit of ['celsius', 'fahrenheit', 'celsius'] as const) {
      await user.click(
        screen.getByRole('button', { name: unit === 'celsius' ? 'Celsius' : 'Fahrenheit' }),
      );
      expect(screen.queryByText('Carregando dados de demonstração...')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(
        formatTemperature(original.current.temperatureC, unit),
      );
      expect(
        screen.getByText(
          `Sensação térmica: ${formatTemperature(original.current.apparentTemperatureC, unit)}`,
        ),
      ).toBeVisible();
      original.days.forEach((day, index) => {
        expect(within(cards[index]).getByText(formatTemperature(day.maximumC, unit))).toBeVisible();
        expect(within(cards[index]).getByText(formatTemperature(day.minimumC, unit))).toBeVisible();
      });
      expect(cards.map((card) => card.querySelector('time')?.dateTime)).toEqual(dates);
    }

    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(mockWeatherData).toEqual(original);
  });

  it('distingue vazio de erro e mantém a atribuição', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), ' VAZIO ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await finishLoading();

    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
  });

  it('remove o clima anterior, simula erro e permite repetir a consulta', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await finishLoading();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'erro{Enter}');

    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await finishLoading();
    expect(screen.getByRole('alert')).toHaveTextContent('falha simulada');
    expect(screen.getByRole('heading', { name: /São Paulo.*demonstração/ })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await finishLoading();
    expect(screen.getByRole('alert')).toHaveTextContent('falha simulada');
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await finishLoading();
    expect(screen.getByLabelText('Temperatura atual')).toBeVisible();
  });

  it('não inicia carregamento com busca inválida e cancela timers ao desmontar', async () => {
    const { user, unmount } = setup();
    await user.type(screen.getByRole('searchbox'), 'a{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('pelo menos dois caracteres');
    expect(screen.getByRole('status')).toHaveTextContent('Como está o tempo?');
    await user.type(screen.getByRole('searchbox'), 'b{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    const clearTimer = vi.spyOn(window, 'clearTimeout');
    unmount();
    expect(clearTimer).toHaveBeenCalledOnce();
  });
});
