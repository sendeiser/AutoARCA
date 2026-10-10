import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App.jsx';
import { INITIAL_USERS } from '../src/services/authService.js';

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

  it('renderiza el portal del contador cuando el usuario autenticado es Contador', () => {
    const accountantUser = INITIAL_USERS.find(u => u.role === 'accountant') || { role: 'accountant' };
    render(<App initialUser={accountantUser} />);

    expect(screen.getByText(/Panel de Control del Contador/i)).toBeInTheDocument();
  });

  it('renderiza el panel de escalas cuando el usuario autenticado es SuperAdmin', () => {
    const adminUser = INITIAL_USERS.find(u => u.role === 'superadmin') || { role: 'superadmin' };
    render(<App initialUser={adminUser} />);

    expect(screen.getByText(/Escalas Oficiales de Monotributo/i)).toBeInTheDocument();
  });

  it('bloquea la emision en el POS si la suscripcion pasa a suspendida', () => {
    const suspendedClient = {
      ...INITIAL_USERS[0],
      subscription_status: 'past_due'
    };
    render(<App initialUser={suspendedClient} />);

    expect(screen.getByText(/Suscripción Suspendida/i)).toBeInTheDocument();
  });
});
