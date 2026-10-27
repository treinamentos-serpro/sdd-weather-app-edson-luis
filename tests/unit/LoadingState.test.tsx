import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingState from '../../src/components/states/LoadingState';

describe('LoadingState', () => {
  it('announces loading without requiring focus', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('displays the message for the corresponding operation', () => {
    render(<LoadingState message="Buscando cidades..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades...');
  });
});
