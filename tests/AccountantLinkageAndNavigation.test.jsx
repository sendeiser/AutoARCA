import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../src/components/Header.jsx';
import Navbar from '../src/components/Navbar.jsx';
import AccountantLinkModal from '../src/components/AccountantLinkModal.jsx';
import { authService } from '../src/services/authService.js';

describe('Sistema de Registro de Contadores y Vinculación de Clientes', () => {
  it('registra un contador generando un código de vinculación profesional único', () => {
    const accountant = authService.register({
      fullName: 'Estudio Contable Bianchi & Asociados',
      email: `bianchi_${Date.now()}@estudio.com`,
      password: 'testpassword',
      role: 'accountant',
      phone: '+54 11 4444 5555',
      cuit: '30799887766',
      matricula: 'T° 150 F° 42',
      jurisdiccion: 'CPCECABA'
    });

    expect(accountant.role).toBe('accountant');
    expect(accountant.link_code).toMatch(/^CONT-[A-Z]+-\d{4}$/);
    expect(accountant.matricula).toBe('T° 150 F° 42');
    expect(accountant.jurisdiccion).toBe('CPCECABA');
  });

  it('permite vincular y desvincular clientes a un contador registrado', () => {
    const accountant = authService.register({
      fullName: 'Estudio Perez Contable',
      email: `perez_${Date.now()}@estudio.com`,
      role: 'accountant',
      cuit: '30711223344'
    });

    const client = authService.register({
      fullName: 'Ferretería El Tornillo',
      email: `tornillo_${Date.now()}@comercio.com`,
      role: 'client',
      cuit: '20251112223',
      razonSocial: 'El Tornillo SRL',
      fantasyName: 'Ferretería El Tornillo'
    });

    // Vincular cliente
    const result = authService.linkClientToAccountant(client.id, accountant.id);
    expect(result.client.accountant_id).toBe(accountant.id);

    // Verificar que aparece en la cartera del contador
    const clients = authService.getClientsForAccountant(accountant.id);
    expect(clients.some((c) => c.userId === client.id)).toBe(true);

    // Desvincular cliente
    const unlinked = authService.unlinkClientFromAccountant(client.id);
    expect(unlinked.accountant_id).toBeNull();
  });

  it('renderiza Header profesional con badge de rol oficial para cliente', () => {
    const handleToggleSound = vi.fn();

    render(
      <Header
        role="client"
        currentUser={{ full_name: 'Martín González', role: 'client' }}
        soundEnabled={true}
        onToggleSound={handleToggleSound}
      />
    );

    expect(screen.getByText(/AutoARCA/i)).toBeInTheDocument();
    expect(screen.getByText('Martín González')).toBeInTheDocument();
    expect(screen.queryByTestId('header-role-badge')).not.toBeInTheDocument();
  });

  it('renderiza Navbar con pestañas adaptativas para cliente', () => {
    const handleTabChange = vi.fn();
    render(
      <Navbar
        role="client"
        activeTab="pos"
        onTabChange={handleTabChange}
        badges={{ posSalesCount: 5, taxTrafficColor: 'green' }}
      />
    );

    expect(screen.getByText('Terminal POS')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Fiscal')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Badge de ventas

    fireEvent.click(screen.getByText('Dashboard Fiscal'));
    expect(handleTabChange).toHaveBeenCalledWith('dashboard');
  });

  it('renderiza AccountantLinkModal permitiendo visualizar el código de vinculación y pestañas', () => {
    const mockAccountant = {
      id: 'acc-test',
      full_name: 'Estudio Méndez & Asoc.',
      link_code: 'CONT-MENDEZ-9876',
      matricula: 'T° 142 F° 89'
    };

    render(
      <AccountantLinkModal
        isOpen={true}
        onClose={vi.fn()}
        accountantUser={mockAccountant}
      />
    );

    expect(screen.getByText(/Vinculación de Clientes/i)).toBeInTheDocument();
    expect(screen.getByText(/Vincular por CUIT \/ Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Código de Invitación/i)).toBeInTheDocument();
  });
});
