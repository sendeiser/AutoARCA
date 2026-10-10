import React, { useRef, useState } from 'react';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { soundService } from '../services/soundService.js';
import { PrinterIcon, DownloadIcon, ShieldCheckIcon, CopyIcon } from './Icons.jsx';
import '../styles/officialConstancia.css';

export default function OfficialConstanciaInscripcionModal({
  isOpen,
  onClose,
  businessProfile = {
    cuit: '20-38491029-4',
    razon_social: 'Estudio & Servicios Integrales',
    fantasy_name: 'AutoARCA Soluciones',
    category: 'D',
    fiscal_address: 'Av. Corrientes 1240, Piso 4, CABA',
    activity_name: 'Servicios de consultoría y tecnología',
    activity_code: '620900',
    cur: '1029384'
  }
}) {
  const [activeView, setActiveView] = useState('constancia'); // 'constancia' | 'credencial'
  const printRef = useRef(null);

  if (!isOpen) return null;

  const today = new Date();
  const emissionDateFormatted = today.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const expirationDate = new Date(today);
  expirationDate.setDate(expirationDate.getDate() + 180);
  const expirationDateFormatted = expirationDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handlePrint = () => {
    soundService.playKeyTap();
    window.print();
  };

  const handleDownloadJson = () => {
    soundService.playKeyTap();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(businessProfile, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `constancia_arca_${businessProfile.cuit || 'cuit'}.json`);
    dlAnchorElem.click();
    soundService.playSuccessChime();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Constancia de Inscripción Oficial ARCA & Credencial F. 152"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div className="constancia-footer-note">
            <ShieldCheckIcon size={16} className="text-success" />
            <span>Validez legal oficial 180 días (RG ARCA 1817)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="outline" onClick={handleDownloadJson}>
              <DownloadIcon size={16} /> JSON
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              <PrinterIcon size={16} /> Imprimir / PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="constancia-modal-body">
        <div className="constancia-nav-tabs">
          <button
            type="button"
            className={`constancia-tab-btn ${activeView === 'constancia' ? 'active' : ''}`}
            onClick={() => setActiveView('constancia')}
          >
            Constancia de Inscripción
          </button>
          <button
            type="button"
            className={`constancia-tab-btn ${activeView === 'credencial' ? 'active' : ''}`}
            onClick={() => setActiveView('credencial')}
          >
            Credencial de Pago (F. 152)
          </button>
        </div>

        {activeView === 'constancia' ? (
          <div className="official-constancia-sheet printable-area" ref={printRef}>
            {/* Encabezado ARCA */}
            <div className="constancia-header">
              <div className="constancia-brand">
                <div className="constancia-logo-text">ARCA</div>
                <div className="constancia-rep-text">
                  <span>República Argentina</span>
                  <strong>Agencia de Recaudación y Control Aduanero</strong>
                </div>
              </div>
              <div className="constancia-title-box">
                <h2>CONSTANCIA DE INSCRIPCIÓN</h2>
                <div className="constancia-validity">
                  Emisión: {emissionDateFormatted} — Vencimiento: {expirationDateFormatted}
                </div>
              </div>
            </div>

            {/* Datos del Contribuyente */}
            <div className="constancia-taxpayer-grid">
              <div className="constancia-item">
                <span className="constancia-label">C.U.I.T.:</span>
                <span className="constancia-val font-mono font-bold">{businessProfile.cuit}</span>
              </div>
              <div className="constancia-item">
                <span className="constancia-label">Denominación / Apellido y Nombre:</span>
                <span className="constancia-val font-bold">{businessProfile.razon_social || businessProfile.fantasy_name}</span>
              </div>
              <div className="constancia-item">
                <span className="constancia-label">Domicilio Fiscal:</span>
                <span className="constancia-val">{businessProfile.fiscal_address || 'Av. Corrientes 1240, CABA'}</span>
              </div>
              <div className="constancia-item">
                <span className="constancia-label">Dependencia:</span>
                <span className="constancia-val">Agencia Sede N° 49 (CABA)</span>
              </div>
            </div>

            {/* Impuestos Registrados */}
            <div className="constancia-section-title">IMPUESTOS REGISTRADOS</div>
            <table className="constancia-table">
              <thead>
                <tr>
                  <th>Impuesto</th>
                  <th>Detalle / Categoría</th>
                  <th>Estado</th>
                  <th>Período de Alta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>RÉGIMEN SIMPLIFICADO PEQUEÑOS CONTRIBUYENTES</strong></td>
                  <td>Categoría {businessProfile.category || 'D'}</td>
                  <td><span className="badge-activo">ACTIVO</span></td>
                  <td className="font-mono">01/2024</td>
                </tr>
                <tr>
                  <td>APORTE AL SISTEMA INTEGRADO PREVISIONAL ARGENTINO (SIPA)</td>
                  <td>Régimen de Trabajador Autónomo / Monotributista</td>
                  <td><span className="badge-activo">ACTIVO</span></td>
                  <td className="font-mono">01/2024</td>
                </tr>
                <tr>
                  <td>RÉGIMEN DEL SISTEMA NACIONAL DE SEGURO DE SALUD</td>
                  <td>Obra Social Monotributo</td>
                  <td><span className="badge-activo">ACTIVO</span></td>
                  <td className="font-mono">01/2024</td>
                </tr>
              </tbody>
            </table>

            {/* Actividad Económica */}
            <div className="constancia-section-title">ACTIVIDADES DECLARADAS</div>
            <table className="constancia-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción de Actividad (Nomenclador ARCA)</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono font-bold">{businessProfile.activity_code || '620900'}</td>
                  <td>{businessProfile.activity_name || 'Servicios de informática y tecnologías conexas'}</td>
                  <td>Principal</td>
                </tr>
              </tbody>
            </table>

            {/* Pie de Constancia y Código QR */}
            <div className="constancia-footer-layout">
              <div className="constancia-qr-box">
                <svg viewBox="0 0 100 100" className="constancia-qr-svg">
                  <rect x="5" y="5" width="28" height="28" fill="currentColor" />
                  <rect x="10" y="10" width="18" height="18" fill="white" />
                  <rect x="14" y="14" width="10" height="10" fill="currentColor" />

                  <rect x="67" y="5" width="28" height="28" fill="currentColor" />
                  <rect x="72" y="10" width="18" height="18" fill="white" />
                  <rect x="76" y="14" width="10" height="10" fill="currentColor" />

                  <rect x="5" y="67" width="28" height="28" fill="currentColor" />
                  <rect x="10" y="72" width="18" height="18" fill="white" />
                  <rect x="14" y="76" width="10" height="10" fill="currentColor" />

                  <rect x="42" y="15" width="6" height="6" fill="currentColor" />
                  <rect x="52" y="25" width="6" height="6" fill="currentColor" />
                  <rect x="42" y="45" width="6" height="6" fill="currentColor" />
                  <rect x="65" y="45" width="6" height="6" fill="currentColor" />
                  <rect x="80" y="60" width="6" height="6" fill="currentColor" />
                  <rect x="45" y="75" width="6" height="6" fill="currentColor" />
                </svg>
                <span className="constancia-qr-caption">Validación oficial ARCA</span>
              </div>
              <div className="constancia-legal-text">
                <p>
                  El presente documento certifica que el contribuyente de referencia se encuentra inscripto en los impuestos y regímenes detallados precedentemente.
                </p>
                <p>
                  La validez de esta constancia puede ser confirmada en cualquier momento escaneando el código QR o ingresando al sitio oficial de la <strong>Agencia de Recaudación y Control Aduanero (arca.gob.ar)</strong> con el CUIT del emisor.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Credencial F. 152 */
          <div className="official-credencial-card printable-area">
            <div className="credencial-header">
              <div>
                <span className="credencial-badge-arca">ARCA</span>
                <h3>FORMULARIO 152</h3>
                <span className="credencial-sub">Credencial de Pago — Régimen Simplificado</span>
              </div>
              <div className="credencial-cur-box">
                <span className="credencial-cur-label">C.U.R. (Código Único de Revista)</span>
                <span className="credencial-cur-val font-mono">{businessProfile.cur || '1029384'}</span>
              </div>
            </div>

            <div className="credencial-body-grid">
              <div className="credencial-field">
                <span className="field-lbl">C.U.I.T.</span>
                <span className="field-val font-mono font-bold">{businessProfile.cuit}</span>
              </div>
              <div className="credencial-field">
                <span className="field-lbl">CATEGORÍA VIGENTE</span>
                <span className="field-val font-bold text-primary">CATEGORÍA {businessProfile.category || 'D'}</span>
              </div>
              <div className="credencial-field">
                <span className="field-lbl">CONTRIBUYENTE</span>
                <span className="field-val">{businessProfile.razon_social || businessProfile.fantasy_name}</span>
              </div>
              <div className="credencial-field">
                <span className="field-lbl">VENCIMIENTO HABITUAL</span>
                <span className="field-val">Día 20 de cada mes</span>
              </div>
            </div>

            <div className="credencial-barcode-box">
              <div className="credencial-barcode-lines" />
              <span className="credencial-barcode-digits font-mono">
                020{businessProfile.cuit?.replace(/[^0-9]/g, '') || '20384910294'}00{businessProfile.cur || '1029384'}202610
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
