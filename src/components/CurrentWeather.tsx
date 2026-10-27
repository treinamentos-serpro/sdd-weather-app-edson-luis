import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, TemperatureUnit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: TemperatureUnit;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatMetric(value: number | undefined, unit: string): string {
  return value === undefined || !Number.isFinite(value)
    ? 'Indisponível'
    : `${numberFormatter.format(value)} ${unit}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);
  const location = [city.admin1, city.country].filter(Boolean).join(', ');
  const [referenceDate, referenceTime] = current.referenceTime?.split('T') ?? [];
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.relativeHumidity, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão ao nível do mar', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <header className="min-w-0">
        <p className="text-sm text-slate-300">Clima atual</p>
        <h2 id={headingId} className="break-words text-2xl font-semibold sm:text-3xl">
          {city.name}
        </h2>
        {location && <p className="break-words text-sm text-slate-300">{location}</p>}
      </header>

      <div className="my-8 flex flex-wrap items-center gap-6 sm:gap-10">
        <span aria-hidden="true" className="text-7xl text-sun sm:text-8xl">
          {condition.icon}
        </span>
        <div className="min-w-0">
          <output
            aria-label="Temperatura atual"
            className="block text-5xl font-bold tracking-tight sm:text-7xl"
          >
            {formatTemperature(current.temperatureC, unit)}
          </output>
          <p className="mt-2 text-lg">{condition.label}</p>
          <p className="mt-1 text-sm text-slate-300">
            Sensação térmica: {formatTemperature(current.apparentTemperatureC, unit)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <dt className="text-sm text-slate-300">{metric.label}</dt>
            <dd className="mt-1 break-words text-lg font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-sm text-slate-300">
        Referência dos dados:{' '}
        {referenceDate && referenceTime ? (
          <time dateTime={current.referenceTime}>
            {referenceDate.split('-').reverse().join('/')} às {referenceTime} (hora local da cidade)
          </time>
        ) : (
          'Indisponível'
        )}
      </p>
    </section>
  );
}
