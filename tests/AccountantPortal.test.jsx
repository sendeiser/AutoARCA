import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountantPortal from '../src/components/AccountantPortal.jsx';

describe('AccountantPortal Component', () => {
  const mockClients = [
    {
      id: 'biz-1',
      cuit: '20301234567',
      razon_social: 'Kiosco Central SRL',
      fantasy_name: 'Kiosco Central',
      monotributo_category: 'C',
      trafficColor: 'green',
      todayBatch: {
        id: 'b-1',
        filename: 'comprobantes_arca_20301234567_20261009.csv',
        file_content_arca: 'Fecha;TipoCbte...',
        total_amount: 45000,
        total_sales_count: 15
      }
    },
    {
      id: 'biz-2',
      cuit: '27289876543',
      razon_social: 'Dra. Gomez Odontologia',
      fantasy_name: 'Consultorio Gomez',
      monotributo_category: 'E',
      trafficColor: 'red',
      todayBatch: null
    }
  ];

  it('renderiza la lista de clientes asignados y sus semaforos fiscales', () => {
    render(<AccountantPortal clients={mockClients} onDownloadZip={vi.fn()} />);
    expect(screen.getAllByText(/Kiosco Central/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Consultorio Gomez/i)).toBeInTheDocument();
    expect(screen.getByText('20301234567')).toBeInTheDocument();
    expect(screen.getByText(/Descargar Lotes del Día \(ZIP Masivo\)/i)).toBeInTheDocument();
  });

  it('filtra clientes por CUIT o nombre en el buscador', () => {
    render(<AccountantPortal clients={mockClients} onDownloadZip={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/Buscar por CUIT o Razón Social/i);

    fireEvent.change(searchInput, { target: { value: 'Gomez' } });
    expect(screen.getByText(/Consultorio Gomez/i)).toBeInTheDocument();
    expect(screen.queryByText(/Kiosco Central/i)).not.toBeInTheDocument();
  });

  it('permite accionar la descarga masiva en ZIP', () => {
    const handleDownloadZip = vi.fn();
    render(<AccountantPortal clients={mockClients} onDownloadZip={handleDownloadZip} />);

    const zipBtn = screen.getByText(/Descargar Lotes del Día \(ZIP Masivo\)/i);
    fireEvent.click(zipBtn);
    expect(handleDownloadZip).toHaveBeenCalled();
  });
});
