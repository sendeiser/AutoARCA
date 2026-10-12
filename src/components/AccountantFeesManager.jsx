import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import {
  CreditCardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CopyIcon,
  DownloadIcon
} from './Icons.jsx';
import '../styles/accountantFees.css';

export default function AccountantFeesManager({
  clients = [],
  accountantProfile = {
    cbu: '0140000003100098765432',
    alias: 'ESTUDIO.MENDEZ.ARCA',
    banco: 'Banco Santander Argentina'
  }
}) {
  // Aranceles sugeridos según escala de Monotributo
  const defaultFeeForCat = (cat) => {
    if (['A', 'B'].includes(cat)) return 35000;
    if (['C', 'D'].includes(cat)) return 48000;
    if (['E', 'F'].includes(cat)) return 65000;
    return 85000;
  };

  const [feesState, setFeesState] = useState(() => {
    const initial = {};
    clients.forEach((c) => {
      initial[c.id] = {
        fee: c.monthlyFee || defaultFeeForCat(c.monotributo_category),
        status: c.trafficColor === 'red' ? 'overdue' : (c.trafficColor === 'yellow' ? 'pending' : 'paid'),
        paymentDate: c.trafficColor === 'green' ? new Date().toISOString().slice(0, 10) : null
      };
    });
    return initial;
  });

  const [copiedId, setCopiedId] = useState(null);
  const [feeFilter, setFeeFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'overdue'

  const togglePaid = (id) => {
    soundService.playSuccessChime();
    setFeesState((prev) => {
      const current = prev[id] || {};
      const newStatus = current.status === 'paid' ? 'pending' : 'paid';
      return {
        ...prev,
        [id]: {
          ...current,
          status: newStatus,
          paymentDate: newStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null
        }
      };
    });
  };

  // KPIs Financieros del Estudio
  let totalFacturable = 0;
  let totalCobrado = 0;
  let totalPendiente = 0;

  clients.forEach((c) => {
    const f = feesState[c.id] || { fee: defaultFeeForCat(c.monotributo_category), status: 'pending' };
    totalFacturable += f.fee;
    if (f.status === 'paid') totalCobrado += f.fee;
    else totalPendiente += f.fee;
  });

  const effectivePercent = totalFacturable > 0 ? Math.round((totalCobrado / totalFacturable) * 100) : 0;

  const filteredClients = clients.filter((c) => {
    const f = feesState[c.id] || { status: 'pending' };
    if (feeFilter === 'all') return true;
    if (feeFilter === 'paid') return f.status === 'paid';
    if (feeFilter === 'pending') return f.status === 'pending';
    if (feeFilter === 'overdue') return f.status === 'overdue';
    return true;
  });

  const handleCopyPaymentData = (client) => {
    soundService.playTap();
    const f = feesState[client.id] || { fee: defaultFeeForCat(client.monotributo_category) };
    const msg = `Estimado ${client.fantasy_name || client.razon_social}.\n\n` +
      `Te enviamos la liquidación de honorarios contables mensuales de ${new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}:\n\n` +
      `• Servicio: Asesoramiento Integral Monotributo & DDJJ\n` +
      `• Importe: ${formatCurrencyARS(f.fee)}\n\n` +
      `Datos de transferencia:\n` +
      `• Banco: ${accountantProfile.banco || 'Banco Santander'}\n` +
      `• Alias: ${accountantProfile.alias || 'ESTUDIO.MENDEZ.ARCA'}\n` +
      `• CBU: ${accountantProfile.cbu || '0140000003100098765432'}\n\n` +
      `Muchas gracias. Estudio Contable Méndez & Asoc.`;

    navigator.clipboard.writeText(msg);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <Card className="accountant-fees-card">
      <CardHeader>
        <div className="fees-header-flex">
          <div>
            <div className="fees-badge-row">
              <Badge variant="brand">GESTIÓN FINANCIERA DEL ESTUDIO</Badge>
              <span className="fees-period-tag text-capitalize">{new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</span>
            </div>
            <CardTitle>Control y Cobranza de Honorarios Profesionales</CardTitle>
            <CardSubtitle>
              Administración de aranceles mensuales por cliente, seguimiento de cobranza y despacho de datos bancarios.
            </CardSubtitle>
          </div>

          {/* Anillo de Recaudación Financiera del Mes */}
          <div className="fees-progress-ring-card">
            <div className="fees-donut-wrap">
              <svg width="48" height="48" viewBox="0 0 48 48" className="fees-donut-svg">
                <circle cx="24" cy="24" r="19" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5" />
                <circle
                  cx="24"
                  cy="24"
                  r="19"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="4.5"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={2 * Math.PI * 19 * (1 - effectivePercent / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span className="fees-donut-val font-mono">{effectivePercent}%</span>
            </div>
            <div className="fees-donut-meta">
              <span className="fees-donut-lbl">Tasa de Cobro Mensual</span>
              <span className="fees-donut-sub font-mono">{formatCurrencyARS(totalCobrado)} ingresados</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="accountant-fees-body">
        {/* Métricas Financieras del Estudio */}
        <div className="fees-kpis-grid">
          <div className="fees-kpi-item">
            <span className="fees-kpi-lbl">Honorarios Facturables</span>
            <span className="fees-kpi-val text-primary font-mono">{formatCurrencyARS(totalFacturable)}</span>
            <span className="fees-kpi-sub">{clients.length} clientes en cartera</span>
          </div>

          <div className="fees-kpi-item">
            <span className="fees-kpi-lbl">Total Cobrado</span>
            <span className="fees-kpi-val text-success font-mono">{formatCurrencyARS(totalCobrado)}</span>
            <span className="fees-kpi-sub">
              {effectivePercent}% de efectividad
            </span>
          </div>

          <div className="fees-kpi-item">
            <span className="fees-kpi-lbl">Pendiente de Cobro</span>
            <span className="fees-kpi-val text-warning font-mono">{formatCurrencyARS(totalPendiente)}</span>
            <span className="fees-kpi-sub">Por regularizar en el mes</span>
          </div>
        </div>

        {/* Chips de Filtro Rápido de Honorarios */}
        <div className="fees-filter-toolbar">
          <span className="fees-filter-lbl">Filtrar por Estado:</span>
          <div className="fees-chips-group">
            <button
              type="button"
              className={`fees-chip ${feeFilter === 'all' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setFeeFilter('all'); }}
            >
              Todos ({clients.length})
            </button>
            <button
              type="button"
              className={`fees-chip paid ${feeFilter === 'paid' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setFeeFilter('paid'); }}
            >
              ✓ Cobrados ({clients.filter((c) => feesState[c.id]?.status === 'paid').length})
            </button>
            <button
              type="button"
              className={`fees-chip pending ${feeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setFeeFilter('pending'); }}
            >
              ⏳ Pendientes ({clients.filter((c) => feesState[c.id]?.status === 'pending').length})
            </button>
            <button
              type="button"
              className={`fees-chip overdue ${feeFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setFeeFilter('overdue'); }}
            >
              🚨 En Mora ({clients.filter((c) => feesState[c.id]?.status === 'overdue').length})
            </button>
          </div>
        </div>

        {/* Tabla de Honorarios por Cliente */}
        <div className="fees-table-wrap">
          <table className="fees-table">
            <thead>
              <tr>
                <th>Cliente / Razón Social</th>
                <th>CUIT</th>
                <th>Cat. ARCA</th>
                <th>Honorario Mensual</th>
                <th>Estado de Pago</th>
                <th>Fecha Cobro</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No hay clientes en esta categoría de honorarios.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const f = feesState[client.id] || { fee: defaultFeeForCat(client.monotributo_category), status: 'pending' };
                  const isPaid = f.status === 'paid';

                  return (
                    <tr key={client.id}>
                      <td className="fees-td-client" data-label="Cliente">
                        <strong>{client.fantasy_name || client.razon_social}</strong>
                      </td>
                      <td data-label="CUIT"><code className="font-mono">{client.cuit}</code></td>
                      <td data-label="Cat. ARCA">
                        <span className="client-cat-badge">Cat. {client.monotributo_category || 'D'}</span>
                      </td>
                      <td data-label="Honorario Mensual" className="font-mono font-bold">{formatCurrencyARS(f.fee)}</td>
                      <td data-label="Estado de Pago">
                        <button
                          type="button"
                          className={`fees-status-chip ${isPaid ? 'paid' : f.status === 'overdue' ? 'overdue' : 'pending'}`}
                          onClick={() => togglePaid(client.id)}
                          title="Hacé clic para cambiar estado de pago"
                        >
                          {isPaid ? '✓ Cobrado' : f.status === 'overdue' ? 'Atrasado' : 'Pendiente'}
                        </button>
                      </td>
                      <td data-label="Fecha Cobro" className="font-mono text-muted" style={{ fontSize: '0.78rem' }}>
                        {f.paymentDate || '—'}
                      </td>
                      <td className="fees-td-action" data-label="Acción" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end' }}>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Estimado ${client.fantasy_name || client.razon_social}.\n\n` +
                              `Te enviamos la liquidación de honorarios contables mensuales de ${new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}:\n\n` +
                              `• Servicio: Asesoramiento Integral Monotributo & DDJJ\n` +
                              `• Importe: ${formatCurrencyARS(f.fee)}\n\n` +
                              `Datos de transferencia:\n` +
                              `• Banco: ${accountantProfile.banco || 'Banco Santander'}\n` +
                              `• Alias: ${accountantProfile.alias || 'ESTUDIO.MENDEZ.ARCA'}\n` +
                              `• CBU: ${accountantProfile.cbu || '0140000003100098765432'}\n\n` +
                              `Muchas gracias. Estudio Contable Méndez & Asoc.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-fee-link"
                            onClick={() => soundService.playSuccessChime()}
                            title="Enviar liquidación directamente por WhatsApp"
                          >
                            💬 WhatsApp
                          </a>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopyPaymentData(client)}
                            title="Copiar mensaje de liquidación con CBU/Alias para enviar por WhatsApp"
                          >
                            <CopyIcon size={13} />
                            {copiedId === client.id ? '¡Copiado!' : 'Cobrar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
