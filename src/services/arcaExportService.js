/**
 * Servicio de Generación y Formateo de Comprobantes para ARCA (ex AFIP)
 * Compatible con la importación masiva en "Comprobantes en Línea" / Facturador
 */

/**
 * Mapeo de códigos oficiales de documento según tablas del sistema ARCA
 */
export function getArcaDocTypeCode(docType) {
  switch (docType?.toUpperCase()) {
    case 'CUIT':
      return '80';
    case 'DNI':
      return '96';
    case 'SIN_IDENTIFICAR':
    default:
      return '99'; // Consumidor Final / Sin identificar
  }
}

/**
 * Mapeo de conceptos fiscales según actividad comercial
 */
export function getArcaConceptCode(activityType) {
  switch (activityType?.toLowerCase()) {
    case 'services':
      return '2'; // Servicios
    case 'both':
      return '3'; // Productos y Servicios
    case 'products':
    default:
      return '1'; // Productos
  }
}

/**
 * Convierte fecha YYYY-MM-DD a formato ARCA YYYYMMDD
 */
export function formatArcaDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

/**
 * Formatea un número con ceros a la izquierda
 */
export function padZero(num, length) {
  return String(num || 0).padStart(length, '0');
}

/**
 * Sanitiza campos de texto para evitar roturas en archivos delimitados
 */
export function sanitizeText(text) {
  if (!text) return '';
  return String(text).replace(/[;\r\n]/g, ' ').trim();
}

/**
 * Valida un comprobante antes de incorporarlo a un lote para ARCA
 */
export function validateReceiptForArca(receipt, anonymousMaxLimit = 250000) {
  const errors = [];

  if (!receipt || typeof receipt.amount !== 'number' || receipt.amount <= 0) {
    errors.push('El importe del comprobante debe ser mayor a cero.');
  }

  const isAnonymous = !receipt.customer_doc_type || receipt.customer_doc_type === 'SIN_IDENTIFICAR';
  if (isAnonymous && receipt.amount > anonymousMaxLimit) {
    errors.push(
      `Para ventas superiores a $${anonymousMaxLimit.toLocaleString('es-AR')}, ARCA exige identificar al cliente con DNI o CUIT.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Formatea una línea individual de Factura C para el archivo delimitado de ARCA
 * Formato estándar: Fecha;TipoCbte;PuntoVenta;NroCbte;Concepto;DocTipo;DocNro;Nombre;Total;NoGravado;Exento
 */
export function formatArcaReceiptLine(receipt, businessProfile) {
  const dateFormatted = formatArcaDate(receipt.date);
  const cbteCode = '011'; // Factura C (código 011 en tablas de ARCA)
  const posNumber = padZero(receipt.pos_number || businessProfile?.pos_number || 1, 5);
  const receiptNumber = padZero(receipt.receipt_number || 1, 8);
  const concept = getArcaConceptCode(businessProfile?.activity_type);
  const docType = getArcaDocTypeCode(receipt.customer_doc_type);
  const docNumber = receipt.customer_doc_number || '0';
  const customerName = sanitizeText(receipt.customer_name || 'Consumidor Final');
  const amountStr = Number(receipt.amount || 0).toFixed(2);
  const noGravado = '0.00';
  const exento = amountStr; // En Monotributo no discrimina IVA

  return [
    dateFormatted,
    cbteCode,
    posNumber,
    receiptNumber,
    concept,
    docType,
    docNumber,
    customerName,
    amountStr,
    noGravado,
    exento
  ].join(';');
}

/**
 * Genera el archivo consolidado de lote diario para ARCA
 */
export function generateArcaBatchFile(receipts = [], businessProfile = {}, options = {}) {
  const cuit = businessProfile.cuit || '00000000000';
  const batchDate = formatArcaDate(options.date || new Date().toISOString().slice(0, 10));
  const filename = `comprobantes_arca_${cuit}_${batchDate}.csv`;

  // Cabecera descriptiva compatible con importador
  const header = 'Fecha;TipoCbte;PuntoVenta;NroCbte;Concepto;DocTipo;DocNro;NombreReceptor;Total;NoGravado;Exento';
  
  let totalAmount = 0;
  const lines = receipts.map(r => {
    totalAmount += Number(r.amount || 0);
    return formatArcaReceiptLine(r, businessProfile);
  });

  const content = [header, ...lines].join('\n');

  return {
    filename,
    content,
    rowCount: receipts.length,
    totalAmount: Number(totalAmount.toFixed(2))
  };
}
