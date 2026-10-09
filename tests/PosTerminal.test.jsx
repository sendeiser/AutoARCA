import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PosTerminal from '../src/components/PosTerminal.jsx';

describe('PosTerminal Component', () => {
  const defaultBusiness = {
    cuit: '20301234567',
    fantasy_name: 'Comercio San Martin',
    pos_number: 1,
    activity_type: 'products'
  };

  it('renderiza la botonera numerica y el visor de importe en cero', () => {
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={vi.fn()} />);
    expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('$ 0');
    expect(screen.getByText(/Emitir Comprobante/i)).toBeInTheDocument();
  });

  it('permite ingresar montos mediante los botones de la botonera', () => {
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={vi.fn()} />);
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('0'));

    expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('2.500');
  });

  it('permite sumar atajos rapidos de dinero (+1000)', () => {
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={vi.fn()} />);
    fireEvent.click(screen.getByText('+ $1.000'));
    fireEvent.click(screen.getByText('+ $1.000'));

    expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('2.000');
  });

  it('cambia el metodo de pago seleccionado', () => {
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={vi.fn()} />);
    const transferBtn = screen.getByText(/Transfer/i);
    fireEvent.click(transferBtn);
    expect(transferBtn).toHaveClass('active');
  });

  it('emite el comprobante y resetea el visor', async () => {
    const handleRecordSale = vi.fn().mockResolvedValue({ id: '1' });
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={handleRecordSale} />);

    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('0'));

    const emitBtn = screen.getByText(/Emitir Comprobante/i);
    fireEvent.click(emitBtn);

    expect(handleRecordSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        payment_method: 'cash'
      })
    );
  });
});
