import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountantDocPortal from '../src/components/AccountantDocPortal.jsx';
import { accountantDocService } from '../src/services/accountantDocService.js';

describe('AccountantDocPortal Component', () => {
  beforeEach(() => {
    accountantDocService.resetToDefaults();
  });

  const mockClients = [
    {
      id: 'c1',
      cuit: '20301234567',
      fantasy_name: 'Comercio San Martín',
      razon_social: 'Roberto Gómez'
    },
    {
      id: 'c2',
      cuit: '27289876543',
      fantasy_name: 'Consultorio Odontológico',
      razon_social: 'Dra. Laura Gomez'
    }
  ];

  const mockProfile = {
    full_name: 'Cr. Marcos Méndez',
    fantasy_name: 'Estudio Méndez & Asociados'
  };

  it('renderiza encabezado, estadísticas y tabla de requerimientos', () => {
    render(<AccountantDocPortal clients={mockClients} accountantProfile={mockProfile} />);

    expect(screen.getByText(/Portal Documental & Requerimientos/i)).toBeInTheDocument();
    expect(screen.getByText(/Requerimientos Totales/i)).toBeInTheDocument();
    expect(screen.getByText(/Documentos Recibidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Extracto Banco Galicia/i)).toBeInTheDocument();
  });

  it('permite cambiar entre pestañas de vista (Requerimientos, Archivos, Simulador)', () => {
    render(<AccountantDocPortal clients={mockClients} accountantProfile={mockProfile} />);

    // Click en "Archivos Entregados"
    const filesTab = screen.getByRole('button', { name: /Archivos Entregados/i });
    fireEvent.click(filesTab);

    expect(screen.getByText(/Archivos y Documentos Recibidos/i)).toBeInTheDocument();
    expect(screen.getByText('extracto_galicia_octubre_2026.pdf')).toBeInTheDocument();

    // Click en "Simulador Portal Cliente"
    const simTab = screen.getByRole('button', { name: /Simulador Portal Cliente/i });
    fireEvent.click(simTab);

    expect(screen.getByText(/Simulador: Experiencia del Cliente/i)).toBeInTheDocument();
  });

  it('permite filtrar requerimientos por CUIT de cliente', () => {
    render(<AccountantDocPortal clients={mockClients} accountantProfile={mockProfile} />);

    // Seleccionar cliente Dra. Laura Gomez en el dropdown
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '27289876543' } });

    expect(screen.getAllByText(/Dra\. Laura Gomez/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Extracto Banco Galicia (Octubre 2026)')).not.toBeInTheDocument();
  });

  it('permite aprobar un requerimiento entregado', async () => {
    render(<AccountantDocPortal clients={mockClients} accountantProfile={mockProfile} />);

    // Buscar botón Aprobar
    const aprobarBtns = screen.getAllByRole('button', { name: /Aprobar/i });
    expect(aprobarBtns.length).toBeGreaterThan(0);

    fireEvent.click(aprobarBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/¡Requerimiento aprobado!/i)).toBeInTheDocument();
    });
  });

  it('permite crear un nuevo requerimiento desde el modal', async () => {
    render(<AccountantDocPortal clients={mockClients} accountantProfile={mockProfile} />);

    const nuevoBtn = screen.getByRole('button', { name: /Nuevo Requerimiento/i });
    fireEvent.click(nuevoBtn);

    expect(screen.getByText(/Crear Requerimiento de Documentación/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Ej\. Extracto Bancario Banco Galicia/i);
    fireEvent.change(titleInput, { target: { value: 'Resumen Tarjeta Galicia Visa' } });

    const crearBtn = screen.getByRole('button', { name: /Crear Requerimiento/i });
    fireEvent.click(crearBtn);

    await waitFor(() => {
      expect(screen.getByText('Resumen Tarjeta Galicia Visa')).toBeInTheDocument();
    });
  });

  it('permite simular una subida de cliente y notificar al estudio', async () => {
    render(<AccountantDocPortal clients={mockClients} accountantProfile={mockProfile} />);

    // Ir a simulador
    const simTab = screen.getByRole('button', { name: /Simulador Portal Cliente/i });
    fireEvent.click(simTab);

    const nameInput = screen.getByPlaceholderText(/ej\. resumen_bancario_galicia/i);
    fireEvent.change(nameInput, { target: { value: 'extracto_bbva_test.pdf' } });

    const submitBtn = screen.getByRole('button', { name: /Subir y Enviar al Estudio/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/extracto_bbva_test\.pdf/i)).toBeInTheDocument();
    });
  });
});
