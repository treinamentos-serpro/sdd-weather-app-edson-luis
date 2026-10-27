import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('apresenta região de busca e campo com label acessível', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it.each(['São Paulo', '  São Paulo  '])(
    'envia o termo %j somente ao buscar, sem espaços nas extremidades',
    async (value) => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), value);
      expect(onSearch).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Buscar' }));
      expect(onSearch).toHaveBeenCalledExactlyOnceWith('São Paulo');
    },
  );

  it('permite envio por teclado com dois caracteres', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await user.keyboard('It{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('It');
  });

  it.each(['', '   ', ' A '])('rejeita entrada inválida %j com aviso acessível', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox');
    if (value) await user.type(input, value);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite pelo menos dois caracteres');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Digite pelo menos dois caracteres para buscar uma cidade.',
    );
  });

  it('remove o aviso ao editar e permite corrigir a consulta', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await user.type(screen.getByRole('searchbox'), 'Recife');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'false');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('preserva o foco e bloqueia a edição e o envio enquanto carrega', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'Recife');
    input.focus();

    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} disabled={false} />);
    expect(input).not.toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });
});
