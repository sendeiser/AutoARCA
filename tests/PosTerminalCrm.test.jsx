import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PosTerminal from '../src/components/PosTerminal.jsx';
import { crmService } from '../src/services/crmService.js';

describe('PosTerminal — Integración CRM y Venta A Cuenta (Fiado)', () => {
  beforeEach(() => {
    crmService.resetToDefaults();
  });

  const defaultBusiness = {
    cuit: '20301234567',
    fantasy_name: 'Comercio San Martin',
    pos_number: 1,
    activity_type: 'products'
  };

  it('muestra la opción de pago "A Cuenta" en el selector de medios de pago', () => {
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={vi.fn()} />);

    const aCuentaBtn = screen.getByText(/A Cuenta/i);
    expect(aCuentaBtn).toBeInTheDocument();

    fireEvent.click(aCuentaBtn);
    expect(aCuentaBtn).toHaveClass('active');
  });

  it('permite abrir el modal de clientes y seleccionar un cliente del CRM', async () => {
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={vi.fn()} />);

    // Abrir modal de cliente
    const linkBtn = screen.getByText(/\+ Identificar Cliente/i);
    fireEvent.click(linkBtn);

    expect(screen.getByText(/Identificación de Cliente & Cuenta Corriente/i)).toBeInTheDocument();
    expect(screen.getByText('Clientes Frecuentes (CRM)')).toBeInTheDocument();

    // Seleccionar Juan Carlos Pérez
    const juanItem = screen.getByText('Juan Carlos Pérez');
    fireEvent.click(juanItem);

    // Modal se cierra y el badge muestra su nombre y saldo
    await waitFor(() => {
      expect(screen.getByText(/Juan Carlos Pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/Deuda: \$24\.500/i)).toBeInTheDocument();
    });
  });

  it('imputa la venta en la cuenta corriente del CRM cuando se vende A Cuenta', async () => {
    const handleRecordSale = vi.fn().mockResolvedValue({ id: 'sale-test-crm' });
    render(<PosTerminal businessProfile={defaultBusiness} onRecordSale={handleRecordSale} />);

    // 1. Ingresar $3.000
    fireEvent.click(screen.getByText('+ $1.000'));
    fireEvent.click(screen.getByText('+ $2.000'));

    // 2. Seleccionar A Cuenta
    fireEvent.click(screen.getByText(/A Cuenta/i));

    // 3. Seleccionar cliente en el modal
    const juanItem = screen.getByText('Juan Carlos Pérez');
    fireEvent.click(juanItem);

    // 4. Emitir comprobante
    const initialJuanDebt = crmService.getCustomerById('cust-1').current_debt;
    const emitBtn = screen.getByText(/Emitir Comprobante/i);

    await act(async () => {
      fireEvent.click(emitBtn);
    });

    expect(handleRecordSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3000,
        payment_method: 'account',
        customer_name: 'Juan Carlos Pérez'
      })
    );

    // 5. Verificar que el CRM incrementó su saldo en $3.000
    const updatedJuan = crmService.getCustomerById('cust-1');
    expect(updatedJuan.current_debt).toBe(initialJuanDebt + 3000);
  });
});
