import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../src/components/Header.jsx';
import SystemOverviewModal from '../src/components/SystemOverviewModal.jsx';

describe('System Overview & Guide Suite', () => {
  it('1. El componente Header renderiza el botón de "¿Cómo funciona?" y dispara onOpenSystemOverview', () => {
    const handleOpen = vi.fn();
    render(<Header currentUser={{ full_name: 'Martín Méndez' }} onOpenSystemOverview={handleOpen} />);

    const guideBtn = screen.getByTestId('system-guide-btn');
    expect(guideBtn).toBeInTheDocument();
    expect(screen.getByText(/¿Cómo funciona\?/i)).toBeInTheDocument();

    fireEvent.click(guideBtn);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('2. SystemOverviewModal renderiza la guía para Comercios / Monotributistas por defecto', () => {
    const handleClose = vi.fn();
    render(
      <SystemOverviewModal
        isOpen={true}
        onClose={handleClose}
        currentRole="client"
        currentUser={{ full_name: 'Kiosco Central' }}
      />
    );

    // Título general del modal
    expect(screen.getByText(/Guía Integral de AutoARCA PRO/i)).toBeInTheDocument();

    // Contenido exclusivo del Comercio
    expect(screen.getByText(/Módulos para Comercios y Profesionales Monotributistas/i)).toBeInTheDocument();
    expect(screen.getByText(/El Ciclo del Comercio/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminal Punto de Venta \(POS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Semáforo Fiscal & Consumo/i)).toBeInTheDocument();
    expect(screen.getByText(/Cruce Bancario & Billeteras/i)).toBeInTheDocument();
    expect(screen.getByText(/Buzón DFE \(E-Ventanilla\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Monitor de Cuota VEP con QR/i)).toBeInTheDocument();
  });

  it('3. SystemOverviewModal renderiza la guía personalizada para el Contador Público / Estudio Contable', () => {
    const handleClose = vi.fn();
    render(
      <SystemOverviewModal
        isOpen={true}
        onClose={handleClose}
        currentRole="accountant"
        currentUser={{ full_name: 'Cr. Martín Méndez' }}
      />
    );

    // Contenido exclusivo del Contador
    expect(screen.getByText(/Módulos del Portal Profesional Contable/i)).toBeInTheDocument();
    expect(screen.getByText(/Flujo Operativo/i)).toBeInTheDocument();
    expect(screen.getByText(/Cartera & Lotes Diarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Matriz de Recategorización Semestral/i)).toBeInTheDocument();
    expect(screen.getByText(/Central Unificada DFE E-Ventanilla/i)).toBeInTheDocument();
    expect(screen.getByText(/Riesgo & Brecha Bancaria/i)).toBeInTheDocument();
    expect(screen.getByText(/Calendario CUIT & Vencimientos/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificaciones de Ingresos FACPCE/i)).toBeInTheDocument();
    expect(screen.getByText(/Exportador Multi-Software/i)).toBeInTheDocument();
    expect(screen.getByText(/Honorarios del Estudio Contable/i)).toBeInTheDocument();
  });

  it('4. SystemOverviewModal renderiza la guía para el Super Administrador SaaS', () => {
    const handleClose = vi.fn();
    render(
      <SystemOverviewModal
        isOpen={true}
        onClose={handleClose}
        currentRole="superadmin"
        currentUser={{ full_name: 'Admin Global' }}
      />
    );

    // Contenido exclusivo del SuperAdmin
    expect(screen.getByText(/Módulos de Gobernanza & Super Administrador/i)).toBeInTheDocument();
    expect(screen.getByText(/Métricas Globales SaaS \(MRR\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Editor de Escalas ARCA/i)).toBeInTheDocument();
    expect(screen.getByText(/Usuarios & Control de Suscripciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico Supabase & Base de Datos/i)).toBeInTheDocument();
  });

  it('5. Permite conmutar interactivamente entre los tres roles dentro del modal', () => {
    const handleClose = vi.fn();
    render(
      <SystemOverviewModal
        isOpen={true}
        onClose={handleClose}
        currentRole="client"
      />
    );

    // Inicia en cliente
    expect(screen.getByText(/Módulos para Comercios y Profesionales Monotributistas/i)).toBeInTheDocument();

    // Cambiar a Contador
    const accountantTab = screen.getByRole('button', { name: /Estudio Contable \/ Contador/i });
    fireEvent.click(accountantTab);
    expect(screen.getByText(/Módulos del Portal Profesional Contable/i)).toBeInTheDocument();

    // Cambiar a Super Administrador
    const superadminTab = screen.getByRole('button', { name: /Super Administrador SaaS/i });
    fireEvent.click(superadminTab);
    expect(screen.getByText(/Módulos de Gobernanza & Super Administrador/i)).toBeInTheDocument();

    // Botón de cierre
    const closeBtn = screen.getByRole('button', { name: /Entendido, Continuar/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
