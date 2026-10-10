import { describe, it, expect, vi } from 'vitest';
import { reportPdfService } from '../src/services/reportPdfService.js';

describe('reportPdfService — Exportación de Informes PDF para Contadores', () => {
  it('genera el informe fiscal individual de un cliente con semáforo y comprobantes', () => {
    const mockSave = vi.fn();
    // En jsPDF, .save() guarda el documento
    const client = {
      fullName: 'Martín Comercio',
      cuit: '20301234567',
      monotributoCategory: 'D',
      trafficColor: 'green'
    };
    const businessProfile = {
      razon_social: 'Martín Comercio SRL',
      fantasy_name: 'Café Martínez',
      cuit: '20301234567',
      monotributo_category: 'D'
    };
    const metrics = {
      trafficLight: { color: 'green' },
      rolling12mSales: 6850000,
      projectedMonthlyAvg: 570833,
      consumptionPercentage: 41.6,
      remainingAllowance: 9600000,
      categoryScale: { max_annual_billing: 16450000 }
    };
    const sales = [
      { receipt_number: 1, amount: 4500, payment_method: 'cash', customer_name: 'Consumidor Final', date: '2026-10-10' },
      { receipt_number: 2, amount: 12500, payment_method: 'transfer', customer_name: 'Juan Pérez', customer_doc_number: '20123456789', date: '2026-10-10' }
    ];
    const accountantProfile = {
      full_name: 'Estudio Contable Méndez & Asoc.',
      matricula: 'T° 142 F° 89',
      jurisdiccion: 'CPCELR (La Rioja)'
    };

    const filename = reportPdfService.generateClientFiscalReport({
      client,
      businessProfile,
      metrics,
      sales,
      accountantProfile
    });

    expect(filename).toContain('Reporte_Fiscal_ARCA_20301234567');
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('genera el reporte consolidado de toda la cartera para el contador', () => {
    const clients = [
      {
        id: 'client-1',
        fullName: 'Martín González',
        razon_social: 'Martín González',
        cuit: '20301234567',
        monotributo_category: 'D',
        trafficColor: 'green',
        todayBatch: { total_sales_count: 5, total_amount: 45000 }
      },
      {
        id: 'client-2',
        fullName: 'Supermercado Central',
        razon_social: 'Supermercado Central',
        cuit: '30712345678',
        monotributo_category: 'K',
        trafficColor: 'red',
        todayBatch: { total_sales_count: 14, total_amount: 185000 }
      }
    ];

    const accountantProfile = {
      full_name: 'Estudio Contable Méndez & Asoc.',
      matricula: 'T° 142 F° 89',
      jurisdiccion: 'CPCELR (La Rioja)'
    };

    const filename = reportPdfService.generateAccountantPortfolioReport({
      clients,
      accountantProfile
    });

    expect(filename).toContain('Cartera_Clientes_Estudio');
    expect(filename.endsWith('.pdf')).toBe(true);
  });
});
