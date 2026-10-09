import { describe, it, expect, vi } from 'vitest';
import {
  processDailyClosures,
  buildClosureEmailPayload
} from '../src/services/dailyClosureCronService.js';

describe('dailyClosureCron Logic & Email Dispatch', () => {
  const businesses = [
    {
      id: 'b-1',
      cuit: '20301234567',
      fantasy_name: 'Supermercado Sol',
      accountantEmail: 'contador@estudio.com',
      pendingSales: [
        { id: 's1', amount: 5000, date: '2026-10-09' },
        { id: 's2', amount: 15000, date: '2026-10-09' }
      ]
    },
    {
      id: 'b-2',
      cuit: '27251112223',
      fantasy_name: 'Farmacia San Juan',
      accountantEmail: 'contador@estudio.com',
      pendingSales: [] // Sin ventas hoy
    }
  ];

  it('procesa comercios con ventas abiertas y omite comercios sin ventas', async () => {
    const mockSaveBatch = vi.fn().mockImplementation((batch) => Promise.resolve(batch));
    const mockSendEmail = vi.fn().mockResolvedValue({ success: true });

    const results = await processDailyClosures({
      businesses,
      date: '2026-10-09',
      saveBatchFn: mockSaveBatch,
      sendEmailFn: mockSendEmail
    });

    expect(results.processedCount).toBe(1);
    expect(mockSaveBatch).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('arma correctamente el payload de correo con adjunto base64 para Resend', () => {
    const payload = buildClosureEmailPayload({
      toEmail: 'contador@estudio.com',
      businessName: 'Supermercado Sol',
      cuit: '20301234567',
      date: '2026-10-09',
      totalAmount: 20000,
      salesCount: 2,
      csvContent: 'Fecha;TipoCbte...\n20261009;011...',
      filename: 'comprobantes_arca_20301234567_20261009.csv'
    });

    expect(payload.to).toBe('contador@estudio.com');
    expect(payload.subject).toContain('[AutoARCA] Cierre Diario - Supermercado Sol');
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments[0].filename).toBe('comprobantes_arca_20301234567_20261009.csv');
    expect(payload.attachments[0].content).toBeDefined();
  });
});
