import React, { useState } from 'react';
import { calculateDfeBusinessDaysRemaining } from '../services/taxAlertEngine.js';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Modal } from './untitled-ui/Modal.jsx';
import { soundService } from '../services/soundService.js';
import {
  FileTextIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon
} from './Icons.jsx';
import '../styles/dfeNotificationCenter.css';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'dfe-001',
    code: 'REQ-ARCA-2026-891',
    title: 'Requerimiento Preventivo: Acreditaciones Bancarias Período Actual',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    type: 'Requerimiento',
    origin: 'División Fiscalización Monotributo — ARCA',
    summary: 'Se detectaron acreditaciones bancarias y en cuentas de pago que superan transitoriamente el promedio mensual estimado. Se solicita justificación o emisión de comprobantes respaldatorios.',
    status: 'pending',
    templateType: 'transferencias_propias'
  },
  {
    id: 'dfe-002',
    code: 'NOT-ARCA-2026-342',
    title: 'Aviso de Recategorización Semestral de Oficio (Preventivo)',
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    type: 'Intimación',
    origin: 'Dirección de Recaudación y Servicios Tributarios',
    summary: 'Verificación semestral conforme parámetros RG 5700. Constatación de parámetros de energía eléctrica y alquileres afectados a la actividad.',
    status: 'pending',
    templateType: 'alquiler_justificacion'
  },
  {
    id: 'dfe-003',
    code: 'COM-ARCA-2026-110',
    title: 'Confirmación de Exención SIRCREB por Monotributo Unificado',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    type: 'Informativa',
    origin: 'Comisión Arbitral / Rentas Provinciales',
    summary: 'Se ha validado la vinculación al Régimen Simplificado Provincial. No corresponde aplicación de retenciones bancarias SIRCREB en el padrón mensual vigente.',
    status: 'archived',
    templateType: 'informativa'
  }
];

export default function DfeNotificationCenter({
  cuit = '20-38491029-4',
  businessName = 'Estudio & Servicios Integrales'
}) {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showDescargoModal, setShowDescargoModal] = useState(false);
  const [descargoTipo, setDescargoTipo] = useState('transferencias_propias');
  const [copiedToast, setCopiedToast] = useState(false);

  const pendingCount = notifications.filter((n) => n.status === 'pending').length;

  const handleOpenDescargo = (notif) => {
    soundService.playKeyTap();
    setSelectedNotif(notif);
    setDescargoTipo(notif.templateType || 'transferencias_propias');
    setShowDescargoModal(true);
  };

  const handleMarkResolved = (id) => {
    soundService.playSuccessChime();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'resolved' } : n))
    );
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif((prev) => ({ ...prev, status: 'resolved' }));
    }
  };

  const getDescargoText = () => {
    if (!selectedNotif) return '';
    const header = `A LA AGENCIA DE RECAUDACIÓN Y CONTROL ADUANERO (ARCA)\nSERVICIO: PRESENTACIONES DIGITALES\nREF: ${selectedNotif.code} — CUIT: ${cuit}\nCONTRIBUYENTE: ${businessName}\nFECHA: ${new Date().toLocaleDateString('es-AR')}\n\n`;

    if (descargoTipo === 'transferencias_propias') {
      return (
        header +
        `Por medio de la presente, en respuesta al requerimiento ${selectedNotif.code}, vengo a formular formal descargo respecto a las acreditaciones bancarias observadas.\n\n` +
        `Manifiesto bajo juramento que los fondos acreditados en las cuentas informadas corresponden en su totalidad a transferencias entre cuentas bancarias y de pago de mi propia titularidad (CBU/CVU), y/o a operaciones no gravadas por el Régimen Simplificado (reintegros de gastos personales y préstamos mutuos particulares debidamente documentados).\n\n` +
        `Por lo expuesto, no constituyen ingresos brutos devengados por la actividad comercial, solicitando se tengan por justificadas las sumas requeridas y se proceda al archivo del expediente sin más trámite.\n\n` +
        `Adjunto constancias bancarias y extractos de cuenta pertinentes.`
      );
    }

    return (
      header +
      `Por medio de la presente, en respuesta a la notificación ${selectedNotif.code}, pongo a disposición la documentación respaldatoria que acredita que los parámetros de la actividad se encuentran encuadrados dentro de los topes legales de la categoría actual asignada.\n\n` +
      `Solicito el cotejo de las facturas electrónicas emitidas y se deje sin efecto la modificación de categoría propuesta.`
    );
  };

  const handleCopyDescargo = () => {
    soundService.playTap();
    navigator.clipboard.writeText(getDescargoText());
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <Card className="dfe-center-card">
      <CardHeader>
        <div className="dfe-header-flex">
          <div>
            <div className="dfe-header-badge-row">
              <Badge variant={pendingCount > 0 ? 'warning' : 'success'}>
                {pendingCount > 0 ? `${pendingCount} NOTIFICACIONES ACTIVAS` : 'AL DÍA'}
              </Badge>
              <span className="dfe-sub-tag">RG ARCA 4280 — E-Ventanilla Legal</span>
            </div>
            <CardTitle>Domicilio Fiscal Electrónico (DFE ARCA)</CardTitle>
            <CardSubtitle>
              Control de plazos legales perentorios de 15 días hábiles para requerimientos e intimaciones de ARCA.
            </CardSubtitle>
          </div>
        </div>
      </CardHeader>

      <div className="dfe-center-body">
        <div className="dfe-table-container">
          <table className="dfe-table">
            <thead>
              <tr>
                <th>Código / Asunto</th>
                <th>Tipo</th>
                <th>Fecha Notif.</th>
                <th>Plazo Legal (15 días hábiles)</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif) => {
                const daysInfo = calculateDfeBusinessDaysRemaining({
                  notificationDate: notif.date
                });

                return (
                  <tr key={notif.id} className={notif.status === 'pending' ? 'dfe-row-pending' : ''}>
                    <td className="dfe-td-item" data-label="Asunto">
                      <div className="dfe-item-title">{notif.title}</div>
                      <div className="dfe-item-code">{notif.code} — {notif.origin}</div>
                    </td>
                    <td data-label="Tipo">
                      <span className={`dfe-pill-type type-${notif.type.toLowerCase()}`}>{notif.type}</span>
                    </td>
                    <td data-label="Fecha Notif." className="font-mono text-muted">{notif.date}</td>
                    <td data-label="Plazo Legal">
                      {notif.status === 'pending' ? (
                        <div className="dfe-countdown-box">
                          <ClockIcon size={14} className={daysInfo.remainingBusinessDays <= 3 ? 'text-danger' : 'text-warning'} />
                          <span className={`font-mono font-bold ${daysInfo.remainingBusinessDays <= 3 ? 'text-danger' : ''}`}>
                            {daysInfo.isExpired ? 'PLAZO VENCIDO' : `${daysInfo.remainingBusinessDays} días hábiles`}
                          </span>
                          <span className="dfe-deadline-sub">Vence: {daysInfo.deadlineFormatted}</span>
                        </div>
                      ) : (
                        <span className="text-muted font-mono">Resuelto</span>
                      )}
                    </td>
                    <td data-label="Estado">
                      <Badge variant={notif.status === 'pending' ? 'warning' : 'success'}>
                        {notif.status === 'pending' ? 'Pendiente' : 'Descargo Presentado'}
                      </Badge>
                    </td>
                    <td className="dfe-td-action" data-label="Acción" style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenDescargo(notif)}
                      >
                        <FileTextIcon size={14} /> Descargo
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Descargo Rápido */}
      {showDescargoModal && selectedNotif && (
        <Modal
          isOpen={showDescargoModal}
          onClose={() => setShowDescargoModal(false)}
          title="Asistente de Descargo para Presentaciones Digitales ARCA"
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                {selectedNotif.status === 'pending' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleMarkResolved(selectedNotif.id);
                      setShowDescargoModal(false);
                    }}
                  >
                    <CheckCircleIcon size={16} /> Marcar como Presentado
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => setShowDescargoModal(false)}>
                  Cerrar
                </Button>
                <Button variant="primary" onClick={handleCopyDescargo}>
                  <CopyIcon size={16} /> {copiedToast ? '¡Copiado!' : 'Copiar Texto para ARCA'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="dfe-modal-content">
            <div className="dfe-modal-notif-summary">
              <strong>{selectedNotif.title}</strong>
              <p>{selectedNotif.summary}</p>
            </div>

            <div className="dfe-modal-selector-wrap">
              <label className="uui-input-label">Motivo de Descargo sugerido:</label>
              <select
                className="uui-input-box"
                value={descargoTipo}
                onChange={(e) => setDescargoTipo(e.target.value)}
              >
                <option value="transferencias_propias">Transferencias entre cuentas bancarias de la misma titularidad</option>
                <option value="alquiler_justificacion">Parámetros de actividad y facturación en orden</option>
              </select>
            </div>

            <div className="dfe-modal-textarea-wrap">
              <label className="uui-input-label">Texto listo para pegar en ARCA Presentaciones Digitales:</label>
              <textarea
                className="dfe-descargo-textarea"
                rows={10}
                readOnly
                value={getDescargoText()}
              />
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
