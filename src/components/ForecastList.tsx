import { useId } from 'react';
import type { ForecastDay, TemperatureUnit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  days: ForecastDay[];
  unit: TemperatureUnit;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="min-w-0 text-white">
      <h2 id={headingId} className="mb-4 text-xl font-semibold">
        Previsão de 5 dias
      </h2>
      {days.length === 0 ? (
        <p role="status" className="text-slate-300">
          Previsão indisponível.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {days.map((day) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
