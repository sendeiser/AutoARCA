import { describe, it, expect } from 'vitest';
import {
  formatArcaReceiptLine,
  generateArcaBatchFile,
  validateReceiptForArca,
  getArcaDocTypeCode,
  getArcaConceptCode
} from '../src/services/arcaExportService.js';

describe('arcaExportService', () => {
  const mockBusiness = {
    cuit: '20301234567',
    pos_number: 1,
    activity_type: 'products'
  };

  it('asigna los códigos oficiales de documento ARCA correctamente', () => {
    expect(getArcaDocTypeCode('SIN_IDENTIFICAR')).toBe('99');
    expect(getArcaDocTypeCode('DNI')).toBe('96');
    expect(getArcaDocTypeCode('CUIT')).toBe('80');
    expect(getArcaDocTypeCode('OTRO')).toBe('99');
  });

  it('asigna el código de concepto fiscal según actividad', () => {
    expect(getArcaConceptCode('products')).toBe('1');
    expect(getArcaConceptCode('services')).toBe('2');
    expect(getArcaConceptCode('both')).toBe('3');
  });

  it('formatea una linea de Factura C a Consumidor Final anónimo con ceros a la izquierda y fecha YYYYMMDD', () => {
    const receipt = {
      receipt_type: 'FC',
      pos_number: 1,
      receipt_number: 45,
      date: '2026-10-09',
      amount: 4500.50,
      customer_doc_type: 'SIN_IDENTIFICAR',
      customer_doc_number: '0',
      customer_name: 'Consumidor Final'
    };

    const line = formatArcaReceiptLine(receipt, mockBusiness);
    // Columnas esperadas: Fecha, TipoCbte, PV, NroCbte, Concepto, DocTipo, DocNro, Nombre, Total, NoGravado, Exento
    const parts = line.split(';');
    expect(parts[0]).toBe('20261009'); // Fecha YYYYMMDD
    expect(parts[1]).toBe('011');      // Factura C
    expect(parts[2]).toBe('00001');    // PV 5 digitos
    expect(parts[3]).toBe('00000045'); // Nro Cbte 8 digitos
    expect(parts[4]).toBe('1');        // Concepto Productos
    expect(parts[5]).toBe('99');       // DocTipo Consumidor Final
    expect(parts[6]).toBe('0');        // DocNro
    expect(parts[7]).toBe('Consumidor Final');
    expect(parts[8]).toBe('4500.50');  // Total
    expect(parts[9]).toBe('0.00');     // No gravado
    expect(parts[10]).toBe('4500.50'); // Operaciones exentas/Monotributo
  });

  it('formatea comprobante a cliente identificado con CUIT', () => {
    const receipt = {
      receipt_type: 'FC',
      pos_number: 2,
      receipt_number: 120,
      date: '2026-10-09',
      amount: 150000.00,
      customer_doc_type: 'CUIT',
      customer_doc_number: '30712345678',
      customer_name: 'Empresa SA'
    };

    const line = formatArcaReceiptLine(receipt, { ...mockBusiness, pos_number: 2, activity_type: 'services' });
    const parts = line.split(';');
    expect(parts[1]).toBe('011');
    expect(parts[2]).toBe('00002');
    expect(parts[3]).toBe('00000120');
    expect(parts[4]).toBe('2'); // Servicios
    expect(parts[5]).toBe('80'); // CUIT
    expect(parts[6]).toBe('30712345678');
    expect(parts[7]).toBe('Empresa SA');
    expect(parts[8]).toBe('150000.00');
  });

  it('valida que ventas superiores al tope legal anónimo exijan DNI o CUIT', () => {
    const anonymousBigSale = {
      amount: 400000,
      customer_doc_type: 'SIN_IDENTIFICAR',
      customer_doc_number: '0'
    };
    const validation = validateReceiptForArca(anonymousBigSale, 250000);
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toMatch(/identificar|DNI|CUIT/i);
  });

  it('valida que comprobantes con monto cero o negativo sean rechazados', () => {
    const invalidReceipt = { amount: -50, customer_doc_type: 'SIN_IDENTIFICAR' };
    const validation = validateReceiptForArca(invalidReceipt, 250000);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('mayor a cero'))).toBe(true);
  });

  it('genera archivo de lote consolidado con metadatos y nombre oficial', () => {
    const receipts = [
      { receipt_type: 'FC', pos_number: 1, receipt_number: 1, date: '2026-10-09', amount: 1000, customer_doc_type: 'SIN_IDENTIFICAR', customer_doc_number: '0', customer_name: 'Consumidor Final' },
      { receipt_type: 'FC', pos_number: 1, receipt_number: 2, date: '2026-10-09', amount: 2500, customer_doc_type: 'SIN_IDENTIFICAR', customer_doc_number: '0', customer_name: 'Consumidor Final' }
    ];

    const batch = generateArcaBatchFile(receipts, mockBusiness, { date: '2026-10-09' });
    expect(batch.filename).toBe('comprobantes_arca_20301234567_20261009.csv');
    expect(batch.rowCount).toBe(2);
    expect(batch.totalAmount).toBe(3500);
    expect(batch.content.split('\n').filter(Boolean).length).toBe(3); // Cabecera + 2 filas
  });
});
