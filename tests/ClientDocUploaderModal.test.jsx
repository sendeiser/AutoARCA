import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientDocUploaderModal from '../src/components/ClientDocUploaderModal.jsx';
import { accountantDocService } from '../src/services/accountantDocService.js';

describe('ClientDocUploaderModal Component', () => {
  beforeEach(() => {
    accountantDocService.resetToDefaults();
  });

  const mockBusiness = {
    cuit: '20301234567',
    fantasy_name: 'Comercio San Martín',
    razon_social: 'Roberto Gómez'
  };

  it('renderiza requerimientos del cliente y zona de carga', () => {
    render(<ClientDocUploaderModal isOpen={true} onClose={vi.fn()} businessProfile={mockBusiness} />);

    expect(screen.getByText(/Documentación Solicitada por tu Estudio Contable/i)).toBeInTheDocument();
    expect(screen.getByText(/Extracto Banco Galicia/i)).toBeInTheDocument();
    expect(screen.getByText(/Subir Comprobante o Extracto/i)).toBeInTheDocument();
  });

  it('permite al cliente adjuntar un archivo y entregarlo al estudio', async () => {
    render(<ClientDocUploaderModal isOpen={true} onClose={vi.fn()} businessProfile={mockBusiness} />);

    const fileInput = screen.getByPlaceholderText(/ej\. extracto_banco_galicia_octubre\.pdf/i);
    fireEvent.change(fileInput, { target: { value: 'factura_proveedor_lacteos.pdf' } });

    const sendBtn = screen.getByRole('button', { name: /Enviar Archivo al Estudio/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/¡Archivo "factura_proveedor_lacteos.pdf" entregado al estudio/i)).toBeInTheDocument();
      expect(screen.getByText('factura_proveedor_lacteos.pdf')).toBeInTheDocument();
    });
  });

  it('no se renderiza si isOpen es false', () => {
    const { container } = render(<ClientDocUploaderModal isOpen={false} onClose={vi.fn()} businessProfile={mockBusiness} />);
    expect(container).toBeEmptyDOMElement();
  });
});
