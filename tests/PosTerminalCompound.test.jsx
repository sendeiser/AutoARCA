import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PosTerminal from '../src/components/PosTerminal.jsx';

describe('PosTerminal Vercel Compound Component Pattern', () => {
  const defaultBusiness = {
    cuit: '20301234567',
    fantasy_name: 'Comercio San Martin',
    pos_number: 1,
    activity_type: 'products'
  };

  it('permite componer subcomponentes de manera declarativa con PosTerminal.Provider', () => {
    render(
      <PosTerminal.Provider businessProfile={defaultBusiness} onRecordSale={vi.fn()}>
        <PosTerminal.Display />
        <PosTerminal.Keypad />
        <PosTerminal.SubmitButton />
      </PosTerminal.Provider>
    );

    expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('$ 0');
    expect(screen.getByText(/Emitir Comprobante/i)).toBeInTheDocument();
  });

  it('los subcomponentes comparten estado reactivo a traves del contexto sin prop drilling', async () => {
    const handleRecordSale = vi.fn().mockResolvedValue({ id: 'comp-1' });
    render(
      <PosTerminal.Provider businessProfile={defaultBusiness} onRecordSale={handleRecordSale}>
        <PosTerminal.Display />
        <PosTerminal.QuickAmounts />
        <PosTerminal.SubmitButton />
        <PosTerminal.Toast />
      </PosTerminal.Provider>
    );

    fireEvent.click(screen.getByText('+ $1.000'));
    expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('1.000');

    await act(async () => {
      fireEvent.click(screen.getByText(/Emitir Comprobante/i));
    });

    expect(handleRecordSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('$ 0');
    });
  });
});
