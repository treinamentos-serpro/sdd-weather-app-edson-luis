import { useRef, type KeyboardEvent } from 'react';
import type { TemperatureUnit } from '../types/weather';

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

const units = [
  { value: 'celsius', symbol: '°C', label: 'Celsius' },
  { value: 'fahrenheit', symbol: '°F', label: 'Fahrenheit' },
] as const;

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const nextIndex = (index + 1) % units.length;
    buttonRefs.current[nextIndex]?.focus();
    onChange(units[nextIndex].value);
  }

  return (
    <div role="group" aria-label="Unidade de temperatura" className="inline-flex gap-1">
      {units.map((option, index) => {
        const selected = unit === option.value;

        return (
          <button
            key={option.value}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            type="button"
            aria-label={option.label}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-h-11 min-w-11 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
              selected
                ? 'bg-accent-500 text-night-900'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {option.symbol}
          </button>
        );
      })}
    </div>
  );
}
