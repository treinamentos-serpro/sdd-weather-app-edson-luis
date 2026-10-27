import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';

describe('EmptyState', () => {
  it('announces the title and hint without presenting an error or retry', () => {
    render(
      <EmptyState
        title="Nenhuma cidade encontrada"
        hint="Confira o nome ou tente buscar outra cidade."
      />,
    );

    const status = screen.getByRole('status');
    expect(
      within(status).getByRole('heading', { name: 'Nenhuma cidade encontrada', level: 2 }),
    ).toBeInTheDocument();
    expect(status).toHaveTextContent('Confira o nome ou tente buscar outra cidade.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
