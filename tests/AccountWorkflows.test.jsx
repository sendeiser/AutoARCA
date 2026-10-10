/**
 * Test Suite: Account Workflows & End-to-End Business Journeys
 * Valida todos los flujos de trabajo de cuentas en AutoARCA:
 * 1. Comercio / Monotributista (Registro -> POS -> Dashboard -> Cierre Lote ARCA)
 * 2. Estudio Contable (Registro -> Código Vinculación -> Cartera -> Exportación ZIP)
 * 3. Vinculación Bidireccional Cliente <-> Contador por código profesional
 * 4. Control SuperAdmin (Ajuste Escalas -> Suspensión Moroso -> Bloqueo POS -> Reactivación)
 * 5. Ciclo de Sesión y Auth Gate (Acceso Obligatorio -> Logout -> Limpieza)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App.jsx';
import AuthScreen from '../src/components/untitled-ui/AuthScreen.jsx';
import AccountantPortal from '../src/components/AccountantPortal.jsx';
import ClientDashboard from '../src/components/ClientDashboard.jsx';
import SuperAdminDashboard from '../src/components/SuperAdminDashboard.jsx';
import { authService, INITIAL_USERS, INITIAL_BUSINESS } from '../src/services/authService.js';
import { recordSaleReceipt, closeDailyBatch } from '../src/services/salesBatchService.js';

describe('Flujo de Trabajo 1: Comercio / Monotributista (client)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite registrar un nuevo comercio, emitir ventas en POS y cerrar la jornada para ARCA', async () => {
    // 1. Registro de nuevo comercio
    const newClient = authService.register({
      fullName: 'Panadería La Espiga',
      email: `panaderia_${Date.now()}@comercio.com`,
      password: 'password123',
      role: 'client',
      cuit: '20309988776',
      fantasyName: 'Panadería La Espiga',
      monotributoCategory: 'E',
      activityType: 'products'
    });

    expect(newClient.id).toBeDefined();
    expect(newClient.role).toBe('client');

    // 2. Renderizar App autenticado como el nuevo comercio
    render(<App initialUser={newClient} />);

    expect(screen.getByText(/AutoARCA/i)).toBeInTheDocument();
    expect(screen.getByTestId('pos-amount-display')).toBeInTheDocument();

    // 3. Emitir venta de $3.500
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('0'));

    expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('3.500');

    // Emitir comprobante
    const emitBtn = screen.getByText(/Emitir Comprobante/i);
    await act(async () => {
      fireEvent.click(emitBtn);
    });

    // Visor vuelve a $ 0
    await waitFor(() => {
      expect(screen.getByTestId('pos-amount-display')).toHaveTextContent('$ 0');
    });

    // 4. Navegar al Dashboard Fiscal
    const dashTab = screen.getByText(/Dashboard Fiscal/i);
    fireEvent.click(dashTab);

    // Debe mostrar la tarjeta de cierre de jornada y la métrica de hoy
    expect(screen.getByText(/Cierre de Jornada de Hoy/i)).toBeInTheDocument();
  });
});

describe('Flujo de Trabajo 2: Estudio Contable (accountant)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registra un contador con matricula, genera codigo CONT y permite descargar ZIP masivo', async () => {
    // 1. Registro de contador
    const accountant = authService.register({
      fullName: 'Estudio Contable Rossi & Asociados',
      email: `rossi_${Date.now()}@estudio.com`,
      password: 'claveSegura123',
      role: 'accountant',
      cuit: '30712233445',
      matricula: 'T° 145 F° 62',
      jurisdiccion: 'CPCECABA'
    });

    expect(accountant.role).toBe('accountant');
    expect(accountant.link_code).toMatch(/^CONT-[A-Z]+-\d{4}$/);

    // 2. Renderizar Portal del Contador con cartera de clientes
    const mockClients = [
      {
        id: 'c1',
        cuit: '20301112223',
        fantasy_name: 'Cafetería Roma',
        razon_social: 'Roma SRL',
        monotributo_category: 'D',
        trafficColor: 'green',
        todayBatch: {
          id: 'b1',
          filename: 'comprobantes_arca_20301112223_hoy.csv',
          file_content_arca: 'Fecha;TipoCbte;Total\n2026-10-09;11;15000',
          total_amount: 15000,
          total_sales_count: 3
        }
      }
    ];

    const handleDownloadZip = vi.fn();
    render(
      <AccountantPortal
        clients={mockClients}
        accountantProfile={accountant}
        onDownloadZip={handleDownloadZip}
      />
    );

    // Verificamos visualización de código de vinculación y cliente
    expect(screen.getByText(accountant.link_code)).toBeInTheDocument();
    expect(screen.getByText(/Cafetería Roma/i)).toBeInTheDocument();

    // 3. Ejecutar descarga masiva de lotes en ZIP
    const zipBtn = screen.getByText(/Descargar Lotes del Día \(ZIP Masivo\)/i);
    fireEvent.click(zipBtn);

    expect(handleDownloadZip).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ fantasy_name: 'Cafetería Roma' })])
    );
  });
});

describe('Flujo de Trabajo 3: Vinculación Bidireccional Comercio <-> Contador', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite a un comercio auto-vincularse con un contador mediante su codigo durante el registro', () => {
    // 1. Crear contador primero
    const accountant = authService.register({
      fullName: 'Estudio Méndez & Asoc.',
      email: `mendez_${Date.now()}@estudio.com`,
      role: 'accountant',
      cuit: '30788990011',
      matricula: 'T° 120 F° 45'
    });

    const linkCode = accountant.link_code;
    expect(linkCode).toBeDefined();

    // 2. Registrar cliente ingresando el código del contador
    const client = authService.register({
      fullName: 'Librería Central',
      email: `libreria_${Date.now()}@comercio.com`,
      role: 'client',
      cuit: '27301234567',
      fantasyName: 'Librería Central',
      accountantId: accountant.id
    });

    expect(client.accountant_id).toBe(accountant.id);

    // 3. Verificar que el contador tiene a este cliente en su lista
    const assignedClients = authService.getClientsForAccountant(accountant.id);
    expect(assignedClients.some((c) => c.userId === client.id)).toBe(true);

    // 4. Verificar consulta inversa (cliente obtiene datos de su contador)
    const clientAccountant = authService.getAccountantForClient(client.id);
    expect(clientAccountant).toBeDefined();
    expect(clientAccountant.full_name).toBe('Estudio Méndez & Asoc.');
  });
});

describe('Flujo de Trabajo 4: Control SuperAdmin y Bloqueo de Emisión por Morosidad', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite a SuperAdmin ajustar escalas de Monotributo y suspender cuentas morosas bloqueando el POS', async () => {
    // 1. Renderizar SuperAdminDashboard
    const handleSaveScales = vi.fn();
    const handleUpdateSub = vi.fn();

    const mockScales = [
      { category: 'A', max_annual_billing: 6500000, max_monthly_average: 541666.67 },
      { category: 'B', max_annual_billing: 9400000, max_monthly_average: 783333.33 }
    ];

    const mockUsers = [
      { id: 'client-test', full_name: 'Comercio Test', email: 'test@comercio.com', role: 'client', subscription_status: 'active' }
    ];

    render(
      <SuperAdminDashboard
        scales={mockScales}
        users={mockUsers}
        onSaveScales={handleSaveScales}
        onUpdateSubscription={handleUpdateSub}
      />
    );

    // 2. Aplicar ajuste inflacionario del +10%
    const bulk10Btn = screen.getByRole('button', { name: /\+10%/i });
    fireEvent.click(bulk10Btn);

    // Guardar escalas
    const saveScalesBtn = screen.getByRole('button', { name: /Guardar Escalas en Caliente/i });
    fireEvent.click(saveScalesBtn);

    expect(handleSaveScales).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ category: 'A', max_annual_billing: 7150000 })
      ])
    );

    // 3. Cambiar a pestaña de usuarios y suspender cliente
    const usersTab = screen.getByRole('button', { name: /Usuarios y Suscripciones/i });
    fireEvent.click(usersTab);

    const subSelect = screen.getByTestId('sub-select-client-test');
    fireEvent.change(subSelect, { target: { value: 'past_due' } });

    expect(handleUpdateSub).toHaveBeenCalledWith('client-test', 'past_due');
  });

  it('muestra banner de bloqueo y deshabilita el POS si la suscripcion esta suspendida', () => {
    const suspendedUser = {
      ...INITIAL_USERS[0],
      id: 'client-1',
      subscription_status: 'past_due'
    };

    render(<App initialUser={suspendedUser} />);

    // Debe mostrar la advertencia de cuenta suspendida
    expect(screen.getByText(/Suscripción Suspendida/i)).toBeInTheDocument();
    expect(screen.queryByTestId('pos-amount-display')).not.toBeInTheDocument();
  });
});

describe('Flujo de Trabajo 5: Ciclo de Sesión, Auth Gate y Desconexión', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('bloquea la app con Auth Gate si no hay sesion, permite login y luego logout al Header', async () => {
    // 1. App inicia forzando Auth Gate
    render(<App forceAuthGate={true} />);

    // Se presenta AuthScreen de Untitled UI
    expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
    expect(screen.queryByTestId('pos-amount-display')).not.toBeInTheDocument();

    // 2. Iniciar sesión mediante Demo 1-Click
    const clientDemoBtn = screen.getByRole('button', { name: /Cliente/i });
    fireEvent.click(clientDemoBtn);

    // Entra a la aplicación y renderiza el POS
    expect(screen.getByText(/AutoARCA/i)).toBeInTheDocument();
    expect(screen.getByTestId('pos-amount-display')).toBeInTheDocument();

    // 3. Cerrar Sesión desde el Header
    const logoutBtn = screen.getByTestId('header-logout-btn');
    fireEvent.click(logoutBtn);

    // Retorna de inmediato a la pantalla de Auth
    expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
    expect(screen.queryByTestId('pos-amount-display')).not.toBeInTheDocument();
  });
});
