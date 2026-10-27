import { useId } from 'react';
import { formatDayLabel } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, TemperatureUnit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: TemperatureUnit;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const headingId = useId();
  const condition = getWeatherCondition(day.weatherCode);
  const probability = day.precipitationProbabilityMax;
  const wind = day.windSpeedMaxKmh;
  const metrics = [
    { label: 'Máxima', value: formatTemperature(day.maximumC, unit) },
    { label: 'Mínima', value: formatTemperature(day.minimumC, unit) },
    {
      label: 'Probabilidade de chuva',
      value:
        probability !== null &&
        probability !== undefined &&
        Number.isFinite(probability) &&
        probability >= 0 &&
        probability <= 100
          ? `${numberFormatter.format(probability)} %`
          : 'Indisponível',
    },
    {
      label: 'Vento máximo',
      value:
        wind !== null && wind !== undefined && Number.isFinite(wind) && wind >= 0
          ? `${numberFormatter.format(wind)} km/h`
          : 'Indisponível',
    },
  ];

  return (
    <article
      aria-labelledby={headingId}
      className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h3 id={headingId} className="break-words text-base font-semibold">
        <time dateTime={day.date}>{formatDayLabel(day.date)}</time>
      </h3>
      <span aria-hidden="true" className="my-4 block text-4xl text-sun">
        {condition.icon}
      </span>
      <p className="mb-4 break-words text-sm text-slate-300">{condition.label}</p>
      <dl className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="break-words text-sm text-slate-300">{metric.label}</dt>
            <dd className="break-words font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
