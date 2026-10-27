import { type SubmitEvent, useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [city, setCity] = useState('');
  const [error, setError] = useState(false);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const query = city.trim();
    if (query.length < 2) {
      setError(true);
      return;
    }

    setError(false);
    onSearch(query);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="city"
          type="search"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setError(false);
          }}
          readOnly={disabled}
          aria-readonly={disabled}
          aria-invalid={error}
          aria-describedby={error ? errorId : undefined}
          placeholder="Digite o nome da cidade"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-night-900/50 px-4 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 read-only:cursor-wait read-only:opacity-70"
        />
        <button
          type="submit"
          aria-disabled={disabled}
          className="rounded-xl bg-accent-500 px-5 py-3 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-rose-300">
          Digite pelo menos dois caracteres para buscar uma cidade.
        </p>
      )}
    </form>
  );
}
