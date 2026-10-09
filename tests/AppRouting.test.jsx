import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App.jsx';

describe('App Shell & Role Routing', () => {
  it('renderiza la barra superior de navegacion y el modo cliente por defecto', () => {
    render(<App />);
    expect(screen.getByText(/AutoARCA/i)).toBeInTheDocument();
    expect(screen.getByTestId('pos-amount-display')).toBeInTheDocument();
  });

  it('permite alternar entre la vista POS y el Dashboard impositivo para clientes', () => {
    render(<App />);
    const dashNavBtn = screen.getByText(/Dashboard Fiscal/i);
    fireEvent.click(dashNavBtn);

    expect(screen.getByText(/Cierre de Jornada de Hoy/i)).toBeInTheDocument();
  });

  it('permite cambiar al rol Contador y renderiza el portal del contador', () => {
    render(<App />);
    const roleSelector = screen.getByTestId('role-switcher-select');
    fireEvent.change(roleSelector, { target: { value: 'accountant' } });

    expect(screen.getByText(/Panel de Control del Contador/i)).toBeInTheDocument();
  });

  it('permite cambiar al rol SuperAdmin y renderiza el panel de escalas', () => {
    render(<App />);
    const roleSelector = screen.getByTestId('role-switcher-select');
    fireEvent.change(roleSelector, { target: { value: 'superadmin' } });

    expect(screen.getByText(/Escalas Oficiales de Monotributo/i)).toBeInTheDocument();
  });

  it('bloquea la emision en el POS si la suscripcion pasa a suspendida', () => {
    render(<App />);
    // Cambiar a superadmin para suspender al cliente
    const roleSelector = screen.getByTestId('role-switcher-select');
    fireEvent.change(roleSelector, { target: { value: 'superadmin' } });
    fireEvent.click(screen.getByText(/Usuarios y Suscripciones/i));

    // Suspender el cliente
    const subSelect = screen.getByTestId('sub-select-client-1');
    fireEvent.change(subSelect, { target: { value: 'past_due' } });

    // Volver a rol cliente
    fireEvent.change(roleSelector, { target: { value: 'client' } });
    expect(screen.getByText(/Suscripción Suspendida/i)).toBeInTheDocument();
  });
});
