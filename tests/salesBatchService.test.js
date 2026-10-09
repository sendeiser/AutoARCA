import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordSaleReceipt,
  getDailyPendingSales,
  closeDailyBatch,
  getBatchHistory,
  checkSubscriptionActive,
  createMockDataStore
} from '../src/services/salesBatchService.js';

describe('salesBatchService', () => {
  let store;
  const mockBusiness = {
    id: 'biz-123',
    user_id: 'user-1',
    cuit: '20301234567',
    pos_number: 1,
    activity_type: 'products'
  };

  const activeProfile = {
    id: 'user-1',
    role: 'client',
    subscription_status: 'active'
  };

  const pastDueProfile = {
    id: 'user-1',
    role: 'client',
    subscription_status: 'past_due'
  };

  beforeEach(() => {
    store = createMockDataStore();
  });

  it('verifica correctamente el estado de suscripcion', () => {
    expect(checkSubscriptionActive(activeProfile)).toBe(true);
    expect(checkSubscriptionActive(pastDueProfile)).toBe(false);
    expect(checkSubscriptionActive({ subscription_status: 'trial' })).toBe(true);
  });

  it('bloquea el registro de ventas si la suscripcion esta vencida', async () => {
    await expect(
      recordSaleReceipt(
        { business_id: mockBusiness.id, amount: 1500 },
        { profile: pastDueProfile, store, businessProfile: mockBusiness }
      )
    ).rejects.toThrow(/suscripción.*vencida|suspendida/i);
  });

  it('registra un comprobante valido e incrementa la numeracion', async () => {
    const receipt1 = await recordSaleReceipt(
      { business_id: mockBusiness.id, amount: 2500, payment_method: 'cash' },
      { profile: activeProfile, store, businessProfile: mockBusiness }
    );

    const receipt2 = await recordSaleReceipt(
      { business_id: mockBusiness.id, amount: 3500, payment_method: 'transfer' },
      { profile: activeProfile, store, businessProfile: mockBusiness }
    );

    expect(receipt1.receipt_number).toBe(1);
    expect(receipt2.receipt_number).toBe(2);
    expect(receipt1.amount).toBe(2500);

    const pending = await getDailyPendingSales(mockBusiness.id, receipt1.date, { store });
    expect(pending.length).toBe(2);
  });

  it('cierra el lote diario, genera el archivo ARCA y asocia los comprobantes', async () => {
    const today = '2026-10-09';
    await recordSaleReceipt(
      { business_id: mockBusiness.id, amount: 1000, date: today },
      { profile: activeProfile, store, businessProfile: mockBusiness }
    );
    await recordSaleReceipt(
      { business_id: mockBusiness.id, amount: 2000, date: today },
      { profile: activeProfile, store, businessProfile: mockBusiness }
    );

    const batch = await closeDailyBatch(mockBusiness.id, today, 'manual', {
      store,
      businessProfile: mockBusiness
    });

    expect(batch.total_sales_count).toBe(2);
    expect(batch.total_amount).toBe(3000);
    expect(batch.filename).toContain('comprobantes_arca');
    expect(batch.file_content_arca).toContain('Fecha;TipoCbte;PuntoVenta');
    expect(batch.closed_by).toBe('manual');

    // Despues del cierre no quedan ventas pendientes para ese lote
    const pendingAfter = await getDailyPendingSales(mockBusiness.id, today, { store });
    expect(pendingAfter.length).toBe(0);
  });

  it('es idempotente: no duplica el cierre si se llama dos veces en el mismo dia', async () => {
    const today = '2026-10-09';
    await recordSaleReceipt(
      { business_id: mockBusiness.id, amount: 1500, date: today },
      { profile: activeProfile, store, businessProfile: mockBusiness }
    );

    const batch1 = await closeDailyBatch(mockBusiness.id, today, 'manual', { store, businessProfile: mockBusiness });
    const batch2 = await closeDailyBatch(mockBusiness.id, today, 'cron', { store, businessProfile: mockBusiness });

    expect(batch1.id).toBe(batch2.id);
    const history = await getBatchHistory(mockBusiness.id, 10, { store });
    expect(history.length).toBe(1);
  });
});
