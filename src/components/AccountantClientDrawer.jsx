import React from 'react';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import {
  FileTextIcon,
  FileSpreadsheetIcon,
  ShieldCheckIcon,
  DownloadIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  TrendingUpIcon,
  ExternalLinkIcon
} from './Icons.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import '../styles/accountantDrawer.css';

export default function AccountantClientDrawer({
  client,
  onClose,
  onDownloadPdf,
  onDownloadExcel,
  onOpenConstancia,
  onOpenCert,
  onOpenExport,
  onDownloadSingleBatch,
  accountantProfile = {}
}) {
  if (!client) return null;

  const color = client.trafficColor || 'green';
  const hasBatch = !!client.todayBatch;
  const rollingSales = client.rolling12mSales || (client.todayBatch?.total_amount ? client.todayBatch.total_amount * 12 : 6850000);
  const maxAnnual = client.maxAnnualBilling || 16450000;
  const consumptionPercent = Math.min(100, Math.round((rollingSales / maxAnnual) * 100));
  const remainingAllowance = Math.max(0, maxAnnual - rollingSales);

  // Mensaje para WhatsApp directo con el cliente
  const clientName = client.fantasy_name || client.razon_social || 'Estimado cliente';
  const waPhone = client.phone || client.telefono || '';
  const cleanPhone = waPhone.replace(/[^0-9]/g, '');
  const waText = encodeURIComponent(
    `Hola ${clientName}, te escribimos desde el ${accountantProfile.full_name || 'Estudio Contable'}. ` +
    `Te contactamos respecto al estado impositivo de tu Monotributo (Cat. ${client.monotributo_category || 'D'}). ` +
    `Por favor contáctanos ante cualquier consulta.`
  );
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;

  return (
    <div className="accountant-drawer-overlay" onClick={onClose}>
      <aside
        className="accountant-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Ficha 360° del Cliente"
      >
        {/* Cabecera del Drawer */}
        <div className="drawer-header">
          <div className="drawer-header-info">
            <div className="drawer-avatar">
              <UserIcon size={22} />
            </div>
            <div>
              <div className="drawer-badges-row">
                <span className="client-cat-badge">Cat. {client.monotributo_category || 'D'}</span>
                <span className={`dot-badge ${color}`}>
                  <span className={`status-dot-indicator dot-${color}`} />
                  <span style={{ textTransform: 'capitalize' }}>
                    {color === 'green' ? 'En orden' : color === 'yellow' ? 'Alerta' : 'Peligro'}
                  </span>
                </span>
              </div>
              <h2 className="drawer-title">{client.fantasy_name || client.razon_social}</h2>
              <p className="drawer-subtitle font-mono">
                {client.razon_social} · CUIT: {client.cuit}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => {
              soundService.playKeyTap();
              onClose();
            }}
            aria-label="Cerrar Ficha"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Drawer con Scroll */}
        <div className="drawer-body">
          {/* Tarjeta de Diagnóstico y Capacidad de Monotributo */}
          <div className="drawer-section-card fiscal-summary-card">
            <div className="drawer-card-header">
              <span className="drawer-card-tag">SITUACIÓN FISCAL ARCA</span>
              <span className="drawer-consumption-badge font-mono">{consumptionPercent}% de escala</span>
            </div>
            <div className="drawer-progress-track">
              <div
                className={`drawer-progress-fill fill-${color}`}
                style={{ width: `${consumptionPercent}%` }}
              />
            </div>
            <div className="drawer-kpis-grid">
              <div className="drawer-kpi-item">
                <span className="drawer-kpi-lbl">Facturación 12 Meses</span>
                <span className="drawer-kpi-val font-mono">{formatCurrencyARS(rollingSales)}</span>
              </div>
              <div className="drawer-kpi-item">
                <span className="drawer-kpi-lbl">Tope de Categoría</span>
                <span className="drawer-kpi-val font-mono">{formatCurrencyARS(maxAnnual)}</span>
              </div>
              <div className="drawer-kpi-item">
                <span className="drawer-kpi-lbl">Margen Disponible</span>
                <span className="drawer-kpi-val font-mono text-emerald">
                  {formatCurrencyARS(remainingAllowance)}
                </span>
              </div>
              <div className="drawer-kpi-item">
                <span className="drawer-kpi-lbl">Estado Operativo</span>
                <span className="drawer-kpi-val text-capitalize">
                  {color === 'green' ? '✅ En Rango' : color === 'yellow' ? '⚠️ Riesgo de Salto' : '🚨 Superando Límite'}
                </span>
              </div>
            </div>
          </div>

          {/* Sección de Cierre Diario de Ventas */}
          <div className="drawer-section-card">
            <div className="drawer-card-header">
              <span className="drawer-card-tag">CIERRE DE JORNADA & LOTE</span>
              {hasBatch ? (
                <Badge variant="success">Lote Listo</Badge>
              ) : (
                <Badge variant="gray">Sin Cierre Hoy</Badge>
              )}
            </div>
            {hasBatch ? (
              <div className="drawer-batch-box">
                <div className="drawer-batch-metrics">
                  <div>
                    <span className="drawer-batch-total font-mono">
                      {formatCurrencyARS(client.todayBatch.total_amount)}
                    </span>
                    <span className="drawer-batch-sub font-mono">
                      {client.todayBatch.total_sales_count} comprobantes fiscales emitidos
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onDownloadSingleBatch(client)}
                    iconLeading={<DownloadIcon size={14} />}
                  >
                    Descargar CSV ARCA
                  </Button>
                </div>
              </div>
            ) : (
              <div className="drawer-empty-batch">
                <p>El contribuyente se encuentra operando la jornada comercial sin haber emitido el cierre diario aún.</p>
              </div>
            )}
          </div>

          {/* Centro de Documentos & Exportaciones Contables */}
          <div className="drawer-section-card">
            <div className="drawer-card-header">
              <span className="drawer-card-tag">DOCUMENTACIÓN & EXPORTACIÓN</span>
            </div>
            <div className="drawer-actions-stack">
              <button
                type="button"
                className="drawer-action-btn btn-pdf"
                onClick={() => onDownloadPdf(client)}
              >
                <div className="action-btn-icon"><FileTextIcon size={18} /></div>
                <div className="action-btn-texts">
                  <strong>Informe Fiscal Integral en PDF</strong>
                  <span>Auditoría de facturación, semáforo y proyección para el cliente</span>
                </div>
                <DownloadIcon size={15} className="action-arrow" />
              </button>

              <button
                type="button"
                className="drawer-action-btn btn-excel"
                onClick={() => onDownloadExcel(client)}
              >
                <div className="action-btn-icon"><FileSpreadsheetIcon size={18} /></div>
                <div className="action-btn-texts">
                  <strong>Libro de Ventas Oficial (Excel / CSV)</strong>
                  <span>Formato compatible con hojas de cálculo y libros impositivos</span>
                </div>
                <DownloadIcon size={15} className="action-arrow" />
              </button>

              <button
                type="button"
                className="drawer-action-btn btn-constancia"
                onClick={() => {
                  soundService.playKeyTap();
                  onOpenConstancia(client);
                }}
              >
                <div className="action-btn-icon"><ShieldCheckIcon size={18} /></div>
                <div className="action-btn-texts">
                  <strong>Constancia de Inscripción & Credencial F.152</strong>
                  <span>Credencial de pago oficial con código QR verificador de ARCA</span>
                </div>
                <ExternalLinkIcon size={14} className="action-arrow" />
              </button>

              <button
                type="button"
                className="drawer-action-btn btn-cert"
                onClick={() => {
                  soundService.playKeyTap();
                  onOpenCert(client);
                }}
              >
                <div className="action-btn-icon"><FileTextIcon size={18} /></div>
                <div className="action-btn-texts">
                  <strong>Certificación de Ingresos (FACPCE Res. 37)</strong>
                  <span>Manifestación de ingresos con informe profesional para bancos</span>
                </div>
                <ExternalLinkIcon size={14} className="action-arrow" />
              </button>

              <button
                type="button"
                className="drawer-action-btn btn-export"
                onClick={() => {
                  soundService.playKeyTap();
                  onOpenExport(client);
                }}
              >
                <div className="action-btn-icon"><DownloadIcon size={18} /></div>
                <div className="action-btn-texts">
                  <strong>Exportar a Tango / Holistor / Bejerman</strong>
                  <span>Archivos de intercambio TXT para importación directa en sistemas contables</span>
                </div>
                <ExternalLinkIcon size={14} className="action-arrow" />
              </button>
            </div>
          </div>

          {/* Canal de Contacto Directo */}
          <div className="drawer-section-card drawer-contact-card">
            <div className="drawer-card-header">
              <span className="drawer-card-tag">CANAL DIRECTO</span>
            </div>
            <div className="drawer-contact-content">
              <p>Envía un recordatorio o notificación oficial al cliente a través de WhatsApp:</p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="drawer-whatsapp-btn"
                onClick={() => soundService.playSuccessChime()}
              >
                <span className="wa-icon">💬</span> Abrir WhatsApp con el Cliente
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
