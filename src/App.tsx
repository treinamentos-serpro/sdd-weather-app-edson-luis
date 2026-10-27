import { useState } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { TemperatureUnit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const {
    searchStatus,
    cities,
    searchError,
    query,
    search,
    retrySearch,
    weatherStatus,
    selectedCity,
    data,
    weatherError,
    selectCity,
    retryWeather,
  } = useWeather();

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
            <SearchBar onSearch={search} disabled={searchStatus === 'loading'} />
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>

        <main
          id="weather-content"
          tabIndex={-1}
          aria-label="Consulta meteorológica"
          aria-busy={searchStatus === 'loading' || weatherStatus === 'loading'}
          className="min-w-0 flex-1 space-y-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {searchStatus === 'success'
              ? `${cities.length} cidades encontradas para ${query}.`
              : weatherStatus === 'success' && data
                ? `Dados meteorológicos carregados para ${data.city.name}.`
                : ''}
          </p>
          {searchStatus === 'idle' && weatherStatus === 'idle' && (
            <EmptyState
              title="Como está o tempo?"
              hint="Busque uma cidade para consultar o clima atual e a previsão de cinco dias."
            />
          )}
          {searchStatus === 'loading' && <LoadingState message="Buscando cidades..." />}
          {searchStatus === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada"
              hint="Tente buscar outro nome de cidade."
            />
          )}
          {searchStatus === 'error' && searchError && (
            <ErrorState message={searchError.message} onRetry={retrySearch} />
          )}
          {searchStatus === 'success' && (
            <CityResults cities={cities} selectedCity={selectedCity} onSelect={selectCity} />
          )}
          {weatherStatus === 'loading' && selectedCity && (
            <div aria-live="polite">
              <LoadingState
                message={`Carregando dados meteorológicos de ${selectedCity.name}...`}
              />
            </div>
          )}
          {weatherStatus === 'error' && selectedCity && weatherError && (
            <div>
              <p className="mb-2 text-sm text-slate-300">Cidade selecionada: {selectedCity.name}</p>
              <ErrorState message={weatherError.message} onRetry={retryWeather} />
            </div>
          )}
          {weatherStatus === 'success' && data && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList days={data.days} unit={unit} />
            </>
          )}
        </main>

        <footer className="border-t border-white/10 pt-5 text-sm text-slate-300">
          Dados meteorológicos por{' '}
          <a
            href="https://open-meteo.com/"
            className="rounded text-accent-400 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Open-Meteo
          </a>
          {' · Dados adaptados para exibição · Licença '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="rounded text-accent-400 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            CC BY 4.0
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
