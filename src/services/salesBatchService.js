/**
 * Servicio del Ciclo de Vida de Comprobantes de Venta y Lotes Diarios
 * Orquesta la persistencia local y remota, validación de suscripción y generación de lotes ARCA.
 */

import { generateArcaBatchFile, validateReceiptForArca } from './arcaExportService.js';

/**
 * Crea un almacén de datos en memoria para pruebas y modo local-first
 */
export function createMockDataStore() {
  return {
    receipts: [],
    batches: []
  };
}

// Almacén compartido en runtime para modo navegador sin backend activo
const runtimeStore = createMockDataStore();

/**
 * Verifica si el perfil de usuario tiene la suscripción habilitada para operar
 */
export function checkSubscriptionActive(profile) {
  if (!profile) return false;
  const status = profile.subscription_status;
  return status === 'active' || status === 'trial';
}

/**
 * Registra un comprobante individual de venta en el sistema
 */
export async function recordSaleReceipt(receiptData, options = {}) {
  const profile = options.profile;
  const store = options.store || runtimeStore;
  const businessProfile = options.businessProfile || {};

  // Control de suscripción activa
  if (profile && !checkSubscriptionActive(profile)) {
    throw new Error('La suscripción del comercio se encuentra suspendida o vencida.');
  }

  // Validación ARCA
  const validation = validateReceiptForArca(receiptData, options.anonymousMaxLimit || 250000);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  const businessId = receiptData.business_id || businessProfile.id || 'default-biz';
  const today = receiptData.date || new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toTimeString().slice(0, 8);

  // Calcular siguiente número correlativo para este comercio
  const existingForBusiness = store.receipts.filter(r => r.business_id === businessId);
  const nextNumber = existingForBusiness.length + 1;

  const newReceipt = {
    id: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    business_id: businessId,
    batch_id: null,
    receipt_type: receiptData.receipt_type || 'FC',
    pos_number: receiptData.pos_number || businessProfile.pos_number || 1,
    receipt_number: nextNumber,
    date: today,
    time: currentTime,
    amount: Number(Number(receiptData.amount).toFixed(2)),
    payment_method: receiptData.payment_method || 'cash',
    customer_doc_type: receiptData.customer_doc_type || 'SIN_IDENTIFICAR',
    customer_doc_number: receiptData.customer_doc_number || '0',
    customer_name: receiptData.customer_name || 'Consumidor Final',
    notes: receiptData.notes || '',
    created_at: new Date().toISOString()
  };

  store.receipts.push(newReceipt);
  return newReceipt;
}

/**
 * Obtiene los comprobantes de un día que aún no fueron incluidos en un lote
 */
export async function getDailyPendingSales(businessId, date, options = {}) {
  const store = options.store || runtimeStore;
  const targetDate = date || new Date().toISOString().slice(0, 10);

  return store.receipts.filter(
    r => r.business_id === businessId && r.date === targetDate && !r.batch_id
  );
}

/**
 * Cierra la jornada diaria y genera el lote ARCA consolidado (Idempotente)
 */
export async function closeDailyBatch(businessId, date, closedBy = 'manual', options = {}) {
  const store = options.store || runtimeStore;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const businessProfile = options.businessProfile || { id: businessId };

  // Verificación de idempotencia: si ya existe lote para esta fecha, devolverlo
  const existingBatch = store.batches.find(
    b => b.business_id === businessId && b.batch_date === targetDate
  );
  if (existingBatch) {
    return existingBatch;
  }

  // Obtener ventas pendientes del día
  const pendingSales = await getDailyPendingSales(businessId, targetDate, { store });

  // Generar archivo ARCA
  const arcaBatch = generateArcaBatchFile(pendingSales, businessProfile, { date: targetDate });

  const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newBatch = {
    id: batchId,
    business_id: businessId,
    batch_date: targetDate,
    closed_at: new Date().toISOString(),
    closed_by: closedBy,
    total_sales_count: arcaBatch.rowCount,
    total_amount: arcaBatch.totalAmount,
    file_format: 'CSV',
    file_content_arca: arcaBatch.content,
    filename: arcaBatch.filename,
    status: 'generated',
    sent_to_email: options.accountantEmail || null,
    sent_at: null,
    created_at: new Date().toISOString()
  };

  // Marcar los comprobantes con el ID de lote asignado
  pendingSales.forEach(r => {
    r.batch_id = batchId;
  });

  store.batches.push(newBatch);
  return newBatch;
}

/**
 * Retorna el historial de lotes emitidos de un comercio
 */
export async function getBatchHistory(businessId, limit = 30, options = {}) {
  const store = options.store || runtimeStore;
  return store.batches
    .filter(b => b.business_id === businessId)
    .sort((a, b) => new Date(b.batch_date) - new Date(a.batch_date))
    .slice(0, limit);
}
