import { describe, it, expect, beforeEach } from 'vitest';
import { accountantDocService } from '../src/services/accountantDocService.js';

describe('accountantDocService — Gestión Documental y Requerimientos de Clientes', () => {
  beforeEach(() => {
    accountantDocService.resetToDefaults();
  });

  it('obtiene la lista inicial de requerimientos semilla', () => {
    const requests = accountantDocService.getAllRequests();
    expect(requests.length).toBeGreaterThanOrEqual(4);

    const galiciaReq = requests.find((r) => r.title.includes('Banco Galicia'));
    expect(galiciaReq).toBeDefined();
    expect(galiciaReq.cuit).toBe('20301234567');
  });

  it('filtra requerimientos por CUIT del cliente', () => {
    const lauraReqs = accountantDocService.getRequestsByCuit('27289876543');
    expect(lauraReqs.length).toBeGreaterThanOrEqual(2);
    expect(lauraReqs.every((r) => r.cuit === '27289876543')).toBe(true);
  });

  it('permite crear un nuevo requerimiento para un cliente', () => {
    const newReq = accountantDocService.createRequest({
      cuit: '20301234567',
      business_name: 'Comercio San Martín',
      title: 'Resumen Tarjeta Santander Black',
      category: 'bank_statements',
      description: 'Resumen de gastos con tarjeta corporativa'
    });

    expect(newReq.id).toBeDefined();
    expect(newReq.status).toBe('pending');

    const all = accountantDocService.getAllRequests();
    expect(all.some((r) => r.id === newReq.id)).toBe(true);
  });

  it('actualiza el estado de un requerimiento (submitted / approved)', () => {
    const requests = accountantDocService.getAllRequests();
    const target = requests[0];

    const updated = accountantDocService.updateRequestStatus(target.id, 'approved', 'Papeles validados');
    expect(updated.status).toBe('approved');
    expect(updated.feedback).toBe('Papeles validados');
  });

  it('permite subir un documento y marca el requerimiento como submitted', () => {
    const newDoc = accountantDocService.uploadDocument({
      cuit: '20301234567',
      request_id: 'req-2',
      file_name: 'resumen_mp_octubre.xlsx',
      file_size_formatted: '650 KB',
      category: 'bank_statements'
    });

    expect(newDoc.id).toBeDefined();
    expect(newDoc.status).toBe('review_pending');

    // El requerimiento req-2 debe pasar a 'submitted'
    const req2 = accountantDocService.getAllRequests().find((r) => r.id === 'req-2');
    expect(req2.status).toBe('submitted');
  });

  it('permite eliminar un documento subido', () => {
    const docsBefore = accountantDocService.getAllDocuments();
    const target = docsBefore[0];

    accountantDocService.deleteDocument(target.id);
    const docsAfter = accountantDocService.getAllDocuments();
    expect(docsAfter.length).toBe(docsBefore.length - 1);
  });

  it('genera un enlace seguro de carga único para el cliente', () => {
    const link = accountantDocService.generateClientUploadLink('20-30123456-7', '2026-10');
    expect(link).toContain('20301234567');
    expect(link).toContain('2026-10');
  });

  it('genera un mensaje de WhatsApp formateado con los pendientes', () => {
    const { text, url, uploadLink } = accountantDocService.generateWhatsAppDocRequestMessage(
      '20301234567',
      'Comercio San Martín',
      'Octubre 2026',
      { fantasy_name: 'Estudio Méndez' }
    );

    expect(text).toContain('Comercio San Martín');
    expect(text).toContain('Estudio Méndez');
    expect(text).toContain('Octubre 2026');
    expect(text).toContain(uploadLink);
    expect(url).toContain('https://wa.me/?text=');
  });

  it('calcula las métricas de cumplimiento documental del estudio', () => {
    const metrics = accountantDocService.getDocMetrics([
      { cuit: '20301234567' },
      { cuit: '27289876543' }
    ]);

    expect(metrics.totalRequests).toBeGreaterThanOrEqual(4);
    expect(metrics.totalDocuments).toBeGreaterThanOrEqual(3);
    expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
  });
});
