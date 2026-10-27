import { useEffect, useRef } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  selectedCity: City | null;
  onSelect: (city: City) => void;
}

function cityContext(city: City): string {
  return [city.admin1, city.country].filter(Boolean).join(', ') || 'Localização';
}

export default function CityResults({ cities, selectedCity, onSelect }: CityResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (cities.length === 0) return;

    const activeElement = document.activeElement;
    if (activeElement === document.body || activeElement?.closest('form[role="search"]')) {
      headingRef.current?.focus();
    }
  }, [cities]);

  if (cities.length === 0) return null;

  return (
    <section
      aria-label="Resultados da busca"
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-3 rounded text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Selecione uma cidade
      </h2>
      <ul className="space-y-2">
        {cities.slice(0, 10).map((city) => {
          const selected = selectedCity?.id === city.id;
          return (
            <li key={`${city.id}-${city.latitude}-${city.longitude}`}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(city)}
                className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-night-900/40 px-4 py-3 text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                <span className="min-w-0">
                  <span className="block break-words font-semibold">{city.name}</span>
                  <span className="block break-words text-sm text-slate-300">
                    {cityContext(city)}
                  </span>
                </span>
                {selected && <span className="shrink-0 text-sm text-accent-400">Selecionada</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
