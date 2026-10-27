import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weather';
import type { TemperatureUnit } from '../../src/types/weather';

describe('UnitToggle', () => {
  it('exibe 32 °F no clima atual ao trocar a unidade de uma temperatura de 0 °C', async () => {
    const user = userEvent.setup();

    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<TemperatureUnit>('celsius');

      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather
            city={mockWeatherData.city}
            current={{ ...mockWeatherData.current, temperatureC: 0 }}
            unit={unit}
          />
        </>
      );
    }

    render(<WeatherWithUnitToggle />);

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(/^0 °C$/);
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(/^32 °F$/);
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('identifies the unit group and indicates the selected unit', () => {
    render(<UnitToggle unit="celsius" onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('changes the selected unit when a button is activated', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
  });

  it('moves focus and changes unit with the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    const celsiusButton = screen.getByRole('button', { name: 'Celsius' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit' });

    celsiusButton.focus();
    await user.keyboard('{ArrowRight}');

    expect(fahrenheitButton).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('fahrenheit');

    await user.keyboard('{ArrowLeft}');

    expect(celsiusButton).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('celsius');
  });
});
