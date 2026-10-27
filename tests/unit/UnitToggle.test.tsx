import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';

describe('UnitToggle', () => {
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
