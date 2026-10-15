import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CrmAccountView from '../src/components/CrmAccountView.jsx';
import { crmService } from '../src/services/crmService.js';

describe('CrmAccountView Component', () => {
  beforeEach(() => {
    crmService.resetToDefaults();
  });

  const defaultBusiness = {
    cuit: '20301234567',
    fantasy_name: 'Autoservicio El Sol',
    razon_social: 'Roberto Gómez'
  };

  it('renderiza el encabezado, estadísticas ejecutivas y tabla de clientes', () => {
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={vi.fn()} />);

    expect(screen.getByText(/Cuentas Corrientes & Clientes \(CRM\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Total por Cobrar \(En la Calle\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Cartera de Clientes/i)).toBeInTheDocument();
    expect(screen.getByText('Juan Carlos Pérez')).toBeInTheDocument();
    expect(screen.getByText('María Elena Gómez')).toBeInTheDocument();
  });

  it('permite buscar clientes por nombre o documento en tiempo real', () => {
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por cliente, CUIT\/DNI o teléfono/i);
    fireEvent.change(searchInput, { target: { value: 'Batakis' } });

    expect(screen.getByText('Dra. Silvina Batakis')).toBeInTheDocument();
    expect(screen.queryByText('Juan Carlos Pérez')).not.toBeInTheDocument();
  });

  it('filtra clientes según saldo deudor o al día', () => {
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={vi.fn()} />);

    // Click en pestaña "Al Día"
    const clearedTab = screen.getByRole('button', { name: /Al Día/i });
    fireEvent.click(clearedTab);

    // Panadería San Cayetano está al día (saldo 0)
    expect(screen.getByText(/Panadería San Cayetano/i)).toBeInTheDocument();
    // Juan Carlos Pérez tiene deuda
    expect(screen.queryByText('Juan Carlos Pérez')).not.toBeInTheDocument();
  });

  it('abre el modal de cobro y registra un pago exitosamente', async () => {
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={vi.fn()} />);

    // Buscar los botones "Cobrar" y hacer clic en el primero
    const cobrarButtons = screen.getAllByRole('button', { name: /Cobrar/i });
    expect(cobrarButtons.length).toBeGreaterThan(0);
    fireEvent.click(cobrarButtons[0]);

    // Debe abrirse el modal de registrar cobro
    expect(screen.getByText(/Registrar Cobro:/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmar Cobro/i)).toBeInTheDocument();

    // Confirmar cobro
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Cobro/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Registrar Cobro:/i)).not.toBeInTheDocument();
    });
  });

  it('abre el libro mayor de cuenta corriente y muestra los movimientos', () => {
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={vi.fn()} />);

    const cuentaButtons = screen.getAllByRole('button', { name: /Cuenta/i });
    fireEvent.click(cuentaButtons[0]);

    expect(screen.getByText(/Cuenta Corriente:/i)).toBeInTheDocument();
    expect(screen.getByText(/Enviar Resumen por WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText('Concepto')).toBeInTheDocument();
    expect(screen.getByText('Saldo')).toBeInTheDocument();
  });

  it('permite registrar un nuevo cliente desde el modal', async () => {
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={vi.fn()} />);

    const nuevoBtn = screen.getByRole('button', { name: /Nuevo Cliente/i });
    fireEvent.click(nuevoBtn);

    expect(screen.getByText(/Registrar Nuevo Cliente/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Ej\. Juan Carlos Pérez/i);
    fireEvent.change(nameInput, { target: { value: 'Esteban Quito' } });

    const guardarBtn = screen.getByRole('button', { name: /Guardar Cliente/i });
    fireEvent.click(guardarBtn);

    await waitFor(() => {
      expect(screen.getByText('Esteban Quito')).toBeInTheDocument();
    });
  });

  it('navega al terminal POS cuando se hace clic en el botón de acceso directo', () => {
    const handleNavPos = vi.fn();
    render(<CrmAccountView businessProfile={defaultBusiness} onNavigateToPos={handleNavPos} />);

    const posBtn = screen.getByRole('button', { name: /Terminal POS/i });
    fireEvent.click(posBtn);

    expect(handleNavPos).toHaveBeenCalled();
  });
});
