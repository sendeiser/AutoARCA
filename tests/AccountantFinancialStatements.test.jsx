import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountantFinancialStatements from '../src/components/AccountantFinancialStatements.jsx';
import { calculateCommercialBalance } from '../src/services/financialBalanceService.js';
import { reportPdfService } from '../src/services/reportPdfService.js';

describe('Accountant Financial Statements & Balances Suite', () => {
  const mockClients = [
    {
      id: 'cli-1',
      cuit: '20301234567',
      razon_social: 'Kiosco El Sol SRL',
      fantasy_name: 'Kiosco El Sol',
      monotributo_category: 'D',
      trafficColor: 'green',
      rolling12mSales: 9600000
    },
    {
      id: 'cli-2',
      cuit: '27289876543',
      razon_social: 'Dra. María Gómez',
      fantasy_name: 'Consultorio Odontológico',
      monotributo_category: 'H',
      trafficColor: 'yellow',
      rolling12mSales: 18500000
    }
  ];

  const mockProfile = {
    full_name: 'Cr. Juan Pérez',
    cuit: '20-25896321-4',
    cpce_registration: 'T° 142 F° 88 CPCECABA'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. financialBalanceService calcula con precisión la partida doble, resultados y ratios', () => {
    const balance = calculateCommercialBalance({
      client: mockClients[0],
      annualSales: 10000000,
      rubro: 'comercio'
    });

    const is = balance.financialStatements.incomeStatement;
    const bs = balance.financialStatements.balanceSheet;
    const ratios = balance.ratios;

    // Estado de Resultados
    expect(is.annualSales).toBe(10000000);
    expect(is.costOfSales).toBe(5800000); // 58% para comercio
    expect(is.grossProfit).toBe(4200000);
    expect(is.operatingExpenses).toBe(2200000); // 22%
    expect(is.netOperatingIncome).toBe(2000000);
    expect(is.monthlyNetIncome).toBe(Math.round(2000000 / 12));

    // Estado de Situación Patrimonial
    expect(bs.assets.totalAssets).toBeGreaterThan(0);
    expect(bs.liabilities.totalLiabilities).toBeGreaterThan(0);
    expect(bs.netWorth).toBe(bs.assets.totalAssets - bs.liabilities.totalLiabilities);

    // Ratios Bancarios
    expect(ratios.currentRatio).toBeGreaterThan(1.0);
    expect(ratios.solvencyRatio).toBeGreaterThan(1.0);
    expect(ratios.maxCreditInstallmentMonthly).toBe(Math.round((2000000 / 12) * 0.30));
  });

  it('2. AccountantFinancialStatements renderiza el dashboard contable, ratios y cascada de resultados', () => {
    render(
      <AccountantFinancialStatements
        clients={mockClients}
        accountantProfile={mockProfile}
      />
    );

    expect(screen.getByText(/Balances Comerciales y Estados Contables para Créditos/i)).toBeInTheDocument();
    expect(screen.getByText(/Normas FACPCE & Criterios de Riesgo Crediticio BCRA/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Estado de Situación Patrimonial/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rendición Operativa/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/PATRIMONIO NETO CONSOLIDADO/i)).toBeInTheDocument();
    expect(screen.getByText(/Descargar Balance PDF \(Bancos\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Enviar por WhatsApp/i)).toBeInTheDocument();
  });

  it('3. Permite alternar de cliente y calibrar sliders en tiempo real', () => {
    render(
      <AccountantFinancialStatements
        clients={mockClients}
        accountantProfile={mockProfile}
      />
    );

    // Seleccionar cliente 2
    const select = screen.getByLabelText(/Cliente a Auditar/i);
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'cli-2' } });

    // Alternar rubro a Gastronomía
    const gastroBtn = screen.getByRole('button', { name: /Gastronomía/i });
    expect(gastroBtn).toBeInTheDocument();
    fireEvent.click(gastroBtn);

    // Debe mostrar la actualización de resultados
    expect(screen.getByText(/Calibrador Rápido de Balance/i)).toBeInTheDocument();
  });

  it('4. Generador de PDF de balance invoca reportPdfService.generateCommercialBalancePdf sin fallas', () => {
    const spy = vi.spyOn(reportPdfService, 'generateCommercialBalancePdf').mockImplementation(() => 'test.pdf');

    render(
      <AccountantFinancialStatements
        clients={mockClients}
        accountantProfile={mockProfile}
      />
    );

    const pdfBtn = screen.getByRole('button', { name: /Descargar Balance PDF \(Bancos\)/i });
    fireEvent.click(pdfBtn);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.any(Object),
        balanceData: expect.any(Object)
      })
    );
  });
});
