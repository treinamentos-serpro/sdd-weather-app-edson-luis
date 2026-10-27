import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import useMockWeather from './hooks/useMockWeather';
import { mockWeatherData } from './mocks/weather';
import type { TemperatureUnit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const { status, search, retry } = useMockWeather();

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 font-sans text-white">
      <a
        href="#weather-content"
        className="sr-only rounded-lg bg-accent-500 p-3 text-night-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">
              <span aria-hidden="true" className="mr-2 text-sun">
                ☀
              </span>
              Weather App
            </h1>
            <p className="mt-1 text-sm text-slate-300">O tempo para os seus próximos dias</p>
          </div>
          <div className="min-w-0 flex-1">
            <SearchBar onSearch={search} disabled={status === 'loading'} />
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>

        <aside
          aria-label="Modo de demonstração"
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
        >
          <p>
            Demonstração com dados fictícios de São Paulo, de 27 a 31 de outubro de 2026. Não são
            condições em tempo real e nenhuma busca é enviada à API.
          </p>
          <p className="mt-2">
            Busque qualquer cidade para ver o exemplo, ou digite <strong>vazio</strong> ou{' '}
            <strong>erro</strong> para testar os estados. A nova tentativa repete a mesma simulação.
          </p>
        </aside>

        <main
          id="weather-content"
          tabIndex={-1}
          aria-label="Consulta meteorológica"
          aria-busy={status === 'loading'}
          className="min-w-0 flex-1 space-y-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {status === 'success'
              ? `Dados de demonstração carregados para ${mockWeatherData.city.name}.`
              : ''}
          </p>
          {status === 'idle' && (
            <EmptyState
              title="Como está o tempo?"
              hint="Busque uma cidade para explorar o exemplo de clima atual e a previsão de cinco dias."
            />
          )}
          {(status === 'loading' || status === 'error') && (
            <h2 className="break-words text-xl font-semibold">
              {mockWeatherData.city.name} — {mockWeatherData.city.country} (demonstração)
            </h2>
          )}
          {status === 'loading' && <LoadingState message="Carregando dados de demonstração..." />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada"
              hint="Tente buscar outro nome de cidade para ver os dados de demonstração."
            />
          )}
          {status === 'error' && (
            <ErrorState
              message="Não foi possível carregar o clima. Esta é uma falha simulada."
              onRetry={retry}
            />
          )}
          {status === 'success' && (
            <>
              <CurrentWeather
                city={mockWeatherData.city}
                current={mockWeatherData.current}
                unit={unit}
              />
              <ForecastList days={mockWeatherData.days} unit={unit} />
            </>
          )}
        </main>

        <footer className="border-t border-white/10 pt-5 text-sm text-slate-300">
          Weather App · Dados fictícios para demonstração. Fonte prevista na versão integrada:{' '}
          <a
            href="https://open-meteo.com/"
            className="rounded text-accent-400 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Open-Meteo
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
