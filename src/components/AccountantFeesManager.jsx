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
              {totalFacturable > 0 ? Math.round((totalCobrado / totalFacturable) * 100) : 0}% de efectividad
            </span>
          </div>

          <div className="fees-kpi-item">
            <span className="fees-kpi-lbl">Pendiente de Cobro</span>
            <span className="fees-kpi-val text-warning font-mono">{formatCurrencyARS(totalPendiente)}</span>
            <span className="fees-kpi-sub">Por regularizar en el mes</span>
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
              {clients.map((client) => {
                const f = feesState[client.id] || { fee: defaultFeeForCat(client.monotributo_category), status: 'pending' };
                const isPaid = f.status === 'paid';

                return (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.fantasy_name || client.razon_social}</strong>
                    </td>
                    <td><code className="font-mono">{client.cuit}</code></td>
                    <td>
                      <span className="client-cat-badge">Cat. {client.monotributo_category || 'D'}</span>
                    </td>
                    <td className="font-mono font-bold">{formatCurrencyARS(f.fee)}</td>
                    <td>
                      <button
                        type="button"
                        className={`fees-status-chip ${isPaid ? 'paid' : f.status === 'overdue' ? 'overdue' : 'pending'}`}
                        onClick={() => togglePaid(client.id)}
                        title="Hacé clic para cambiar estado de pago"
                      >
                        {isPaid ? '✓ Cobrado' : f.status === 'overdue' ? 'Atrasado' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.78rem' }}>
                      {f.paymentDate || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyPaymentData(client)}
                        title="Copiar mensaje de liquidación con CBU/Alias para enviar por WhatsApp"
                      >
                        <CopyIcon size={13} />
                        {copiedId === client.id ? '¡Copiado!' : 'Cobrar'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
