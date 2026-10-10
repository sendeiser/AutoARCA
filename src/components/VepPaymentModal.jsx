import React, { useState } from 'react';
import { calculateVepStatus, formatCurrencyARS } from '../services/taxAlertEngine.js';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { soundService } from '../services/soundService.js';
import {
  CreditCardIcon,
  CopyIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  QrTransferIcon,
  FileTextIcon
} from './Icons.jsx';
import '../styles/vepPaymentModal.css';

export default function VepPaymentModal({
  isOpen,
  onClose,
  cuit = '20-38491029-4',
  businessName = 'Estudio & Servicios',
  category = 'D',
  cuotaAmount = 52800
}) {
  const [activeTab, setActiveTab] = useState('vep'); // 'vep' | 'reimputacion'
  const [copiedVep, setCopiedVep] = useState(false);

  const vepData = calculateVepStatus({
    category,
    cuotaAmount
  });

  const vepNumber = `982739481923`;

  // Desglose oficial de la cuota según categoría
  const impuestoIntegrado = Math.round(cuotaAmount * 0.35);
  const sipaAporte = Math.round(cuotaAmount * 0.30);
  const obraSocial = cuotaAmount - impuestoIntegrado - sipaAporte;

  const handleCopyVep = () => {
    soundService.playTap();
    navigator.clipboard.writeText(vepNumber);
    setCopiedVep(true);
    setTimeout(() => setCopiedVep(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pago de Cuota Mensual ARCA — VEP & QR Interoperable"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleCopyVep}>
            <CopyIcon size={16} /> {copiedVep ? '¡Código Copiado!' : 'Copiar N° de VEP'}
          </Button>
        </div>
      }
    >
      <div className="vep-modal-content">
        <div className="vep-tabs">
          <button
            type="button"
            className={`vep-tab-btn ${activeTab === 'vep' ? 'active' : ''}`}
            onClick={() => setActiveTab('vep')}
          >
            Volante Electrónico (VEP) & QR
          </button>
          <button
            type="button"
            className={`vep-tab-btn ${activeTab === 'reimputacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('reimputacion')}
          >
            Compensación / F. 399
          </button>
        </div>

        {activeTab === 'vep' ? (
          <>
            {/* Banner de Vencimiento */}
            <div className={`vep-due-banner ${vepData.isOverdue ? 'overdue' : 'on-time'}`}>
              <div className="vep-due-icon">
                {vepData.isOverdue ? <AlertTriangleIcon size={20} /> : <CheckCircleIcon size={20} />}
              </div>
              <div className="vep-due-info">
                <div className="vep-due-title">
                  {vepData.isOverdue
                    ? `Cuota Vencida (${vepData.overdueDays} días de mora)`
                    : `Vence el ${vepData.dueDateFormatted} (en ${vepData.diffDays} días)`}
                </div>
                <div className="vep-due-sub">
                  Vencimiento estándar: día 20 del mes actual (RG ARCA Monotributo)
                </div>
              </div>
            </div>

            {/* Cuadro de QR Interoperable */}
            <div className="vep-qr-wrapper">
              <div className="vep-qr-visual">
                <svg viewBox="0 0 100 100" className="vep-qr-svg">
                  {/* Mock QR SVG Interoperable */}
                  <rect x="5" y="5" width="30" height="30" fill="currentColor" />
                  <rect x="10" y="10" width="20" height="20" fill="var(--bg-surface)" />
                  <rect x="14" y="14" width="12" height="12" fill="currentColor" />
                  
                  <rect x="65" y="5" width="30" height="30" fill="currentColor" />
                  <rect x="70" y="10" width="20" height="20" fill="var(--bg-surface)" />
                  <rect x="74" y="14" width="12" height="12" fill="currentColor" />

                  <rect x="5" y="65" width="30" height="30" fill="currentColor" />
                  <rect x="10" y="70" width="20" height="20" fill="var(--bg-surface)" />
                  <rect x="14" y="74" width="12" height="12" fill="currentColor" />

                  {/* Random QR dots */}
                  <rect x="42" y="10" width="6" height="6" fill="currentColor" />
                  <rect x="52" y="16" width="6" height="6" fill="currentColor" />
                  <rect x="42" y="32" width="6" height="6" fill="currentColor" />
                  <rect x="52" y="42" width="6" height="6" fill="currentColor" />
                  <rect x="65" y="45" width="6" height="6" fill="currentColor" />
                  <rect x="78" y="52" width="6" height="6" fill="currentColor" />
                  <rect x="42" y="65" width="6" height="6" fill="currentColor" />
                  <rect x="52" y="75" width="6" height="6" fill="currentColor" />
                  <rect x="68" y="70" width="6" height="6" fill="currentColor" />
                  <rect x="80" y="80" width="6" height="6" fill="currentColor" />
                </svg>
                <span className="vep-qr-scan-badge">Escaneá con Mercado Pago / MODO / BNA+</span>
              </div>

              <div className="vep-details-box">
                <div className="vep-row">
                  <span className="vep-row-label">N° de VEP:</span>
                  <span className="vep-row-val font-mono">{vepNumber}</span>
                </div>
                <div className="vep-row">
                  <span className="vep-row-label">CUIT:</span>
                  <span className="vep-row-val font-mono">{cuit}</span>
                </div>
                <div className="vep-row">
                  <span className="vep-row-label">Categoría:</span>
                  <span className="vep-row-val font-bold">Cat. {category}</span>
                </div>
                <div className="vep-row">
                  <span className="vep-row-label">Imp. Integrado:</span>
                  <span className="vep-row-val font-mono">{formatCurrencyARS(impuestoIntegrado)}</span>
                </div>
                <div className="vep-row">
                  <span className="vep-row-label">Jubilación SIPA:</span>
                  <span className="vep-row-val font-mono">{formatCurrencyARS(sipaAporte)}</span>
                </div>
                <div className="vep-row">
                  <span className="vep-row-label">Obra Social:</span>
                  <span className="vep-row-val font-mono">{formatCurrencyARS(obraSocial)}</span>
                </div>
                {vepData.compensatoryInterest > 0 && (
                  <div className="vep-row text-danger">
                    <span className="vep-row-label">Intereses Resarcitorios:</span>
                    <span className="vep-row-val font-mono">+{formatCurrencyARS(vepData.compensatoryInterest)}</span>
                  </div>
                )}
                <div className="vep-total-divider" />
                <div className="vep-row vep-total-row">
                  <span className="vep-total-label">Total a Abonar:</span>
                  <span className="vep-total-val font-mono font-bold text-primary">
                    {formatCurrencyARS(vepData.totalAmountToPay)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="vep-reimputacion-box">
            <div className="vep-reimp-header">
              <FileTextIcon size={20} className="text-primary" />
              <div>
                <strong>Reimputación de Pagos / Compensación (F. 399 ARCA)</strong>
                <p>¿Tenés pagos duplicados, retenciones no computadas o saldo a favor de meses anteriores?</p>
              </div>
            </div>

            <div className="vep-reimp-steps">
              <div className="vep-reimp-step">
                <span className="vep-step-num">1</span>
                <div>
                  <strong>Consultar Cuenta Corriente (CCMA)</strong>
                  <p>Verificá en la web de ARCA con Clave Fiscal si tenés saldos verdes a favor en algún período.</p>
                </div>
              </div>

              <div className="vep-reimp-step">
                <span className="vep-step-num">2</span>
                <div>
                  <strong>Generar Formulario 399 Digital</strong>
                  <p>Accedé a "Cuenta Corriente de Monotributistas y Autónomos" y seleccioná "Reimputar saldo a favor".</p>
                </div>
              </div>

              <div className="vep-reimp-step">
                <span className="vep-step-num">3</span>
                <div>
                  <strong>Compensar Cuota Actual</strong>
                  <p>Al aplicar el saldo a favor al período vigente, la cuota quedará saldada total o parcialmente sin desembolsar dinero.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
