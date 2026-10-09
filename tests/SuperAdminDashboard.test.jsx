import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuperAdminDashboard from '../src/components/SuperAdminDashboard.jsx';

describe('SuperAdminDashboard Component', () => {
  const initialScales = [
    { category: 'A', max_annual_billing: 6450000, max_monthly_average: 537500 },
    { category: 'B', max_annual_billing: 9450000, max_monthly_average: 787500 }
  ];

  const initialUsers = [
    { id: 'u-1', full_name: 'Carlos Comerciante', email: 'carlos@tienda.com', role: 'client', subscription_status: 'active' },
    { id: 'u-2', full_name: 'Dra. Laura', email: 'laura@med.com', role: 'client', subscription_status: 'past_due' }
  ];

  it('renderiza la tabla de escalas de Monotributo y listado de usuarios al cambiar de pestaña', () => {
    render(
      <SuperAdminDashboard
        scales={initialScales}
        users={initialUsers}
        onSaveScales={vi.fn()}
        onUpdateSubscription={vi.fn()}
      />
    );

    expect(screen.getByText(/Escalas Oficiales de Monotributo/i)).toBeInTheDocument();

    // Cambiar a la pestaña de usuarios
    fireEvent.click(screen.getByText(/Usuarios y Suscripciones/i));
    expect(screen.getByText(/Carlos Comerciante/i)).toBeInTheDocument();
    expect(screen.getByText(/laura@med.com/i)).toBeInTheDocument();
  });

  it('permite modificar topes de facturacion y guardar las escalas actualizadas', () => {
    const handleSaveScales = vi.fn();
    render(
      <SuperAdminDashboard
        scales={initialScales}
        users={initialUsers}
        onSaveScales={handleSaveScales}
        onUpdateSubscription={vi.fn()}
      />
    );

    const inputCatA = screen.getByTestId('scale-input-A');
    fireEvent.change(inputCatA, { target: { value: '7000000' } });

    const saveBtn = screen.getByText(/Guardar Escalas en Caliente/i);
    fireEvent.click(saveBtn);

    expect(handleSaveScales).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ category: 'A', max_annual_billing: 7000000 })
      ])
    );
  });

  it('permite cambiar el estado de suscripcion de un cliente', () => {
    const handleUpdateSub = vi.fn();
    render(
      <SuperAdminDashboard
        scales={initialScales}
        users={initialUsers}
        onSaveScales={vi.fn()}
        onUpdateSubscription={handleUpdateSub}
      />
    );

    // Cambiar a pestaña de usuarios
    fireEvent.click(screen.getByText(/Usuarios y Suscripciones/i));

    const selectUser1 = screen.getByTestId('sub-select-u-1');
    fireEvent.change(selectUser1, { target: { value: 'past_due' } });

    expect(handleUpdateSub).toHaveBeenCalledWith('u-1', 'past_due');
  });
});
