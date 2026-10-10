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
  SearchIcon
} from './Icons.jsx';
import '../styles/accountantDfeInbox.css';

const DEFAULT_PORTFOLIO_NOTIFICATIONS = [
  {
    id: 'dfe-m-01',
    clientId: 'biz-1',
    clientName: 'Kiosco Central SRL',
    cuit: '20-30123456-7',
    code: 'NOT-ARCA-2026-902',
    origin: 'Fiscalización Monotributo — Sede Central',
    title: 'Requerimiento de Acreditaciones Bancarias y Billeteras Virtuales',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    type: 'Requerimiento',
    summary: 'Constatación de depósitos en cuenta corriente bancaria no computados en la declaración de facturación C del trimestre.',
    status: 'pending'
  },
  {
    id: 'dfe-m-02',
    clientId: 'biz-2',
    clientName: 'Dra. Gómez Odontología',
    cuit: '27-28987654-3',
    code: 'INT-ARCA-2026-441',
    origin: 'Dirección de Recaudación y Control',
    title: 'Intimación Previa a Recategorización de Oficio',
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    type: 'Intimación',
    summary: 'Inconsistencia en gastos personales y parámetros de locación de consultorio odontológico.',
    status: 'pending'
  },
  {
    id: 'dfe-m-03',
    clientId: 'biz-3',
    clientName: 'Panadería La Espiga',
    cuit: '20-30998877-6',
    code: 'COM-ARCA-2026-102',
    origin: 'Rentas Provinciales / DGR',
    title: 'Confirmación de Exención SIRCREB por Régimen Simplificado',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    type: 'Informativa',
    summary: 'Contribuyente encuadrado en Monotributo Unificado. No pasible de retención bancaria.',
    status: 'resolved'
  }
];

export default function AccountantDfeInbox({ clients = [] }) {
  const [notifications, setNotifications] = useState(DEFAULT_PORTFOLIO_NOTIFICATIONS);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'urgent'
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showDescargoModal, setShowDescargoModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const pendingCount = notifications.filter((n) => n.status === 'pending').length;

  const handleOpenDescargo = (notif) => {
    soundService.playKeyTap();
    setSelectedNotif(notif);
    setShowDescargoModal(true);
  };

  const handleResolve = (id) => {
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
    return (
      `A LA AGENCIA DE RECAUDACIÓN Y CONTROL ADUANERO (ARCA)\n` +
      `SERVICIO: PRESENTACIONES DIGITALES — DESCARGO FORMAL\n` +
      `EXPEDIENTE / REF: ${selectedNotif.code}\n` +
      `CONTRIBUYENTE: ${selectedNotif.clientName} — CUIT: ${selectedNotif.cuit}\n` +
      `PROFESIONAL INTERVINIENTE: Estudio Contable Méndez & Asoc. (Matrícula CPCECABA T° 142 F° 89)\n` +
      `FECHA: ${new Date().toLocaleDateString('es-AR')}\n\n` +
      `En legal tiempo y forma, dentro del plazo de los 15 días hábiles otorgados, venimos a formular formal respuesta respecto a la comunicación ${selectedNotif.code}.\n\n` +
      `Habiendo auditado la contabilidad del contribuyente y los registros auxiliares de facturación electrónica y extractos bancarios, manifestamos que las operaciones observadas corresponden a movimientos debidamente respaldados que no alteran el correcto encuadre en el Régimen Simplificado para Pequeños Contribuyentes (Ley 24.977 y modif. Ley 27.743).\n\n` +
      `Se acompaña la documental respaldatoria correspondiente, solicitando se proceda al cierre del requerimiento.\n\n` +
      `Firma: Estudio Contable Méndez & Asociados`
    );
  };

  const handleCopyDescargo = () => {
    soundService.playTap();
    navigator.clipboard.writeText(getDescargoText());
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Filtrado de notificaciones
  const filteredNotifs = notifications.filter((n) => {
    const daysInfo = calculateDfeBusinessDaysRemaining({ notificationDate: n.date });
    if (filterStatus === 'pending') return n.status === 'pending';
    if (filterStatus === 'urgent') return n.status === 'pending' && daysInfo.remainingBusinessDays <= 5;
    return true;
  });

  return (
    <Card className="accountant-dfe-card">
      <CardHeader>
        <div className="accountant-dfe-header-flex">
          <div>
            <div className="accountant-dfe-badge-row">
              <Badge variant={pendingCount > 0 ? 'warning' : 'success'}>
                {pendingCount > 0 ? `${pendingCount} NOTIFICACIONES ACTIVAS EN CARTERA` : 'CARTERA AL DÍA'}
              </Badge>
              <span className="accountant-dfe-tag">RG ARCA 4280 — E-Ventanilla Multi-Cliente</span>
            </div>
            <CardTitle>Central Unificada de DFE Multi-Cliente</CardTitle>
            <CardSubtitle>
              Bandeja consolidada de notificaciones e intimaciones de ARCA para todos los CUITs de la cartera.
            </CardSubtitle>
          </div>

          <div className="accountant-dfe-tabs">
            <button
              type="button"
              className={`dfe-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              className={`dfe-tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              type="button"
              className={`dfe-tab-btn ${filterStatus === 'urgent' ? 'active' : ''}`}
              onClick={() => setFilterStatus('urgent')}
            >
              Urgentes &lt; 5 días
            </button>
          </div>
        </div>
      </CardHeader>

      <div className="accountant-dfe-body">
        <div className="accountant-dfe-table-wrap">
          <table className="accountant-dfe-table">
            <thead>
              <tr>
                <th>Cliente / CUIT</th>
                <th>Código / Asunto</th>
                <th>Tipo</th>
                <th>Fecha Notif.</th>
                <th>Plazo Legal (15 d. hábiles)</th>
                <th>Estado Estudio</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay notificaciones en este filtro.
                  </td>
                </tr>
              ) : (
                filteredNotifs.map((notif) => {
                  const daysInfo = calculateDfeBusinessDaysRemaining({
                    notificationDate: notif.date
                  });

                  return (
                    <tr key={notif.id} className={notif.status === 'pending' && daysInfo.remainingBusinessDays <= 4 ? 'row-critical' : ''}>
                      <td>
                        <strong>{notif.clientName}</strong>
                        <div className="dfe-client-cuit font-mono">{notif.cuit}</div>
                      </td>
                      <td>
                        <div className="dfe-notif-title">{notif.title}</div>
                        <div className="dfe-notif-origin font-mono">{notif.code} · {notif.origin}</div>
                      </td>
                      <td>
                        <span className={`dfe-type-tag type-${notif.type.toLowerCase()}`}>{notif.type}</span>
                      </td>
                      <td className="font-mono text-muted">{notif.date}</td>
                      <td>
                        {notif.status === 'pending' ? (
                          <div className="dfe-clock-box">
                            <ClockIcon size={14} className={daysInfo.remainingBusinessDays <= 4 ? 'text-danger' : 'text-warning'} />
                            <span className={`font-mono font-bold ${daysInfo.remainingBusinessDays <= 4 ? 'text-danger' : ''}`}>
                              {daysInfo.isExpired ? 'VENCIDO' : `${daysInfo.remainingBusinessDays} días hábiles`}
                            </span>
                            <span className="dfe-vto-sub">Vence: {daysInfo.deadlineFormatted}</span>
                          </div>
                        ) : (
                          <span className="text-muted font-mono">Presentado</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={notif.status === 'pending' ? 'warning' : 'success'}>
                          {notif.status === 'pending' ? 'Pendiente Descargo' : 'Descargo Presentado'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenDescargo(notif)}
                        >
                          <FileTextIcon size={13} /> Descargo
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Descargo Rápido para el Estudio */}
      {showDescargoModal && selectedNotif && (
        <Modal
          isOpen={showDescargoModal}
          onClose={() => setShowDescargoModal(false)}
          title={`Descargo Digital ARCA — ${selectedNotif.clientName}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                {selectedNotif.status === 'pending' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleResolve(selectedNotif.id);
                      setShowDescargoModal(false);
                    }}
                  >
                    <CheckCircleIcon size={15} /> Marcar Presentado en ARCA
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => setShowDescargoModal(false)}>
                  Cerrar
                </Button>
                <Button variant="primary" onClick={handleCopyDescargo}>
                  <CopyIcon size={15} /> {copiedToast ? '¡Copiado!' : 'Copiar Texto para ARCA'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="accountant-dfe-modal-body">
            <div className="accountant-dfe-callout">
              <strong>{selectedNotif.title}</strong>
              <p>{selectedNotif.summary}</p>
            </div>

            <div>
              <label className="uui-input-label">Texto de Presentación Formal (Membrete del Estudio Contable):</label>
              <textarea
                className="dfe-textarea"
                rows={12}
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
