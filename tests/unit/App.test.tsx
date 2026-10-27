import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { formatTemperature } from '../../src/lib/temperature';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const weather: WeatherData = {
  ...mockWeatherData,
  city: { ...mockWeatherData.city, id: 1, name: 'Curitiba' },
  current: { ...mockWeatherData.current, temperatureC: 10, apparentTemperatureC: 8 },
};
const homonym: City = {
  ...weather.city,
  id: 2,
  name: 'Curitiba',
  admin1: 'Paraná',
  country: 'Brasil',
};

describe('App integrado ao useWeather', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchCities).mockResolvedValue([weather.city, homonym]);
    vi.mocked(getWeather).mockResolvedValue(weather);
  });

  afterEach(cleanup);

  function setup() {
    const user = userEvent.setup();
    return { user, ...render(<App />) };
  }

  function cityButton(context: string) {
    return screen.getByRole('button', { name: new RegExp(context) });
  }

  function expectAttribution() {
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    );
    expect(screen.getByText(/Dados adaptados para exibição/)).toBeVisible();
  }

  it('inicia em idle, com busca, Celsius e atribuição, sem consultar serviços', () => {
    setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Weather App' })).toBeVisible();
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Como está o tempo?');
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
    expectAttribution();
  });

  it('permite escolher a cidade homônima e apresenta clima e previsão', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), ' Curitiba {Enter}');

    expect(await screen.findByRole('region', { name: 'Resultados da busca' })).toBeVisible();
    expect(cityButton('Paraná')).toHaveTextContent('Curitiba');
    expect(cityButton('São Paulo')).toBeVisible();
    expect(getWeather).not.toHaveBeenCalled();
    await user.click(cityButton('Paraná'));

    expect(await screen.findByLabelText('Temperatura atual')).toHaveTextContent('10 °C');
    expect(screen.getByRole('heading', { name: 'Curitiba' })).toBeVisible();
    expect(cityButton('Paraná')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('Curitiba');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(homonym);
    expectAttribution();
  });

  it('mantém a cidade selecionada durante uma nova busca vazia', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));
    await screen.findByLabelText('Temperatura atual');
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Desconhecida');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByText('Nenhuma cidade encontrada')).toBeVisible();
    expect(screen.getByLabelText('Temperatura atual')).toBeVisible();
    expect(getWeather).toHaveBeenCalledTimes(1);
    expectAttribution();
  });

  it('repete a busca após erro sem mudar a cidade ou o clima selecionado', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));
    await screen.findByLabelText('Temperatura atual');
    vi.mocked(searchCities).mockRejectedValueOnce(
      new Error('Serviço temporariamente indisponível.'),
    );
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), ' Curitiba {Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Serviço temporariamente indisponível.',
    );
    expect(screen.getByLabelText('Temperatura atual')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('region', { name: 'Resultados da busca' })).toBeVisible();
    expect(searchCities).toHaveBeenCalledTimes(3);
    expect(searchCities).toHaveBeenLastCalledWith('Curitiba');
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('retry meteorológico mantém a cidade selecionada e respeita a unidade atual', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Clima indisponível.'));

    await user.click(cityButton('São Paulo'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Clima indisponível.');
    expect(screen.getByText('Cidade selecionada: Curitiba')).toBeVisible();
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'texto não enviado');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByLabelText('Temperatura atual')).toHaveTextContent('50 °F');
    expect(getWeather).toHaveBeenCalledTimes(3);
    expect(getWeather).toHaveBeenLastCalledWith(weather.city);
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('Curitiba');
  });

  it('alterna unidades sem alterar datas nem fazer chamadas extras', async () => {
    const original = structuredClone(weather);
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));
    const cards = await screen.findAllByRole('article');
    const dates = cards.map((card) => within(card).getByRole('time').getAttribute('datetime'));

    for (const unit of ['fahrenheit', 'celsius'] as const) {
      await user.click(
        screen.getByRole('button', { name: unit === 'celsius' ? 'Celsius' : 'Fahrenheit' }),
      );
      expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(
        formatTemperature(original.current.temperatureC, unit),
      );
      original.days.forEach((day, index) => {
        expect(within(cards[index]).getByText(formatTemperature(day.maximumC, unit))).toBeVisible();
      });
      expect(cards.map((card) => within(card).getByRole('time').getAttribute('datetime'))).toEqual(
        dates,
      );
    }

    expect(getWeather).toHaveBeenCalledExactlyOnceWith(weather.city);
    expect(weather).toEqual(original);
  });

  it('não chama serviços com busca inválida', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('searchbox'), 'a{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('pelo menos dois caracteres');
    expect(screen.getByRole('status')).toHaveTextContent('Como está o tempo?');
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });
});
