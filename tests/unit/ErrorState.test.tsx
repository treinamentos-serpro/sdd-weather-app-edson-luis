import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ErrorState from '../../src/components/states/ErrorState';

describe('ErrorState', () => {
  it('announces the provided error without retrying automatically', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível buscar o clima." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível buscar o clima.');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveAttribute(
      'type',
      'button',
    );
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('retries when the button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Serviço indisponível." onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(['{Enter}', ' '])('supports keyboard retry with %s', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Serviço indisponível." onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
