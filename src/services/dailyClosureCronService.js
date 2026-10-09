/**
 * Servicio de Automatización de Cierres Diarios y Despacho de Correos
 * Utilizado por las Edge Functions de Supabase y el cron nocturno.
 */

import { generateArcaBatchFile } from './arcaExportService.js';
import { formatCurrencyARS } from './taxAlertEngine.js';

/**
 * Codifica una cadena de texto a base64 de forma compatible entre Node y navegador
 */
export function toBase64(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Construye el payload HTML y adjuntos para la API de Resend / SMTP
 */
export function buildClosureEmailPayload({
  toEmail,
  businessName,
  cuit,
  date,
  totalAmount,
  salesCount,
  csvContent,
  filename
}) {
  const formattedTotal = formatCurrencyARS(totalAmount);
  const formattedDate = date || new Date().toISOString().slice(0, 10);
  const file = filename || `comprobantes_arca_${cuit}_${formattedDate}.csv`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
      <h2 style="color: #0f766e; margin-top: 0;">AutoARCA — Cierre Diario de Ventas</h2>
      <p>Estimado contador,</p>
      <p>Se ha generado el cierre de jornada automático para el cliente <strong>${businessName}</strong> (CUIT: <code>${cuit}</code>) correspondiente al día <strong>${formattedDate}</strong>.</p>
      
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Comprobantes Emitidos:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${salesCount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Total Facturado:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #059669; font-size: 16px;">${formattedTotal}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Archivo Adjunto:</td>
            <td style="padding: 6px 0; text-align: right;"><code>${file}</code></td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        El archivo CSV adjunto está formateado según las especificaciones de ARCA para su importación masiva directa en <em>Comprobantes en Línea / Facturador</em>.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <small style="color: #94a3b8;">Mensaje generado automáticamente por la plataforma AutoARCA SaaS.</small>
    </div>
  `;

  return {
    from: 'AutoARCA Notificaciones <notificaciones@autoarca.com>',
    to: toEmail,
    subject: `[AutoARCA] Cierre Diario - ${businessName} (CUIT ${cuit}) - ${formattedDate}`,
    html,
    attachments: [
      {
        filename: file,
        content: toBase64(csvContent)
      }
    ]
  };
}

/**
 * Ejecuta el lote de cortes automáticos para todos los comercios elegibles
 */
export async function processDailyClosures({
  businesses = [],
  date,
  saveBatchFn,
  sendEmailFn
}) {
  const targetDate = date || new Date().toISOString().slice(0, 10);
  let processedCount = 0;
  let totalAmountAccum = 0;
  const details = [];

  for (const b of businesses) {
    const pendingSales = b.pendingSales || [];
    if (pendingSales.length === 0) {
      continue;
    }

    const arcaFile = generateArcaBatchFile(pendingSales, b, { date: targetDate });

    const batchRecord = {
      id: `batch-${b.id}-${targetDate}`,
      business_id: b.id,
      batch_date: targetDate,
      closed_by: 'cron',
      total_sales_count: arcaFile.rowCount,
      total_amount: arcaFile.totalAmount,
      file_format: 'CSV',
      file_content_arca: arcaFile.content,
      filename: arcaFile.filename,
      status: 'generated',
      sent_to_email: b.accountantEmail || null
    };

    if (saveBatchFn) {
      await saveBatchFn(batchRecord);
    }

    // Despacho de correo si tiene contador asignado
    if (b.accountantEmail && sendEmailFn) {
      const emailPayload = buildClosureEmailPayload({
        toEmail: b.accountantEmail,
        businessName: b.fantasy_name || b.razon_social || 'Comercio',
        cuit: b.cuit || '00000000000',
        date: targetDate,
        totalAmount: arcaFile.totalAmount,
        salesCount: arcaFile.rowCount,
        csvContent: arcaFile.content,
        filename: arcaFile.filename
      });

      try {
        await sendEmailFn(emailPayload);
        batchRecord.status = 'sent_email';
      } catch (err) {
        batchRecord.status = 'error_email';
      }
    }

    processedCount++;
    totalAmountAccum += arcaFile.totalAmount;
    details.push(batchRecord);
  }

  return {
    targetDate,
    processedCount,
    totalAmount: Number(totalAmountAccum.toFixed(2)),
    details
  };
}
