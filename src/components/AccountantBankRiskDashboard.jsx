import React, { useState, useMemo } from 'react';
import { calculateBankCrossingRisk, formatCurrencyARS } from '../services/taxAlertEngine.js';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { SearchInput } from './untitled-ui/SearchInput.jsx';
import { soundService } from '../services/soundService.js';
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  DownloadIcon,
  CopyIcon
} from './Icons.jsx';
import '../styles/accountantBankRisk.css';

export default function AccountantBankRiskDashboard({
  clients = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all'); // 'all' | 'red' | 'yellow' | 'green'

  // Auditoría bancaria de toda la cartera
  const evaluatedClients = useMemo(() => {
    return clients.map((c) => {
      const rollingInvoiced = Number(c.rolling12mSales || 6850000);
      // Depósitos estimados simulados para auditoría si no están informados
      const bankDeposits = c.bankDeposits !== undefined ? c.bankDeposits : (c.trafficColor === 'red' ? 18200000 : c.trafficColor === 'yellow' ? 9500000 : 7100000);
      const nonTaxable = c.nonTaxableDeposits || 300000;

      const risk = calculateBankCrossingRisk({
        totalInvoiced: rollingInvoiced,
        totalBankDeposits: bankDeposits,
        nonTaxableDeposits: nonTaxable,
        categoryMaxAnnual: 16450000,
        categoryKMaxAnnual: 68000000
      });

      return {
        ...c,
        rollingInvoiced,
        bankDeposits,
        nonTaxable,
        risk
      };
    });
  }, [clients]);

  const filtered = evaluatedClients.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matches = (c.cuit || '').includes(query) || (c.fantasy_name || c.razon_social || '').toLowerCase().includes(query);
    if (!matches) return false;

    if (filterRisk === 'all') return true;
    return c.risk.status === filterRisk;
  });

  const criticalCount = evaluatedClients.filter((c) => c.risk.status === 'red').length;
  const warningCount = evaluatedClients.filter((c) => c.risk.status === 'yellow').length;
  const safeCount = evaluatedClients.filter((c) => c.risk.status === 'green').length;

  const handleExportCsv = () => {
    soundService.playKeyTap();
    const headers = ['CUIT', 'Cliente', 'Categoria', 'Facturado_12M', 'Depositos_Bancos_CVU', 'Brecha_No_Facturada', 'Semaforo_Riesgo', 'Diagnostico_ARCA'];
    const rows = evaluatedClients.map((c) => [
      `"${c.cuit}"`,
      `"${c.fantasy_name || c.razon_social}"`,
      `"${c.monotributo_category || 'D'}"`,
      c.rollingInvoiced.toFixed(2),
      c.risk.netCommercialDeposits.toFixed(2),
      c.risk.uninvoicedGap.toFixed(2),
      `"${c.risk.status.toUpperCase()}"`,
      `"${c.risk.title}"`
    ].join(';'));

    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_riesgo_bancario_arca_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundService.playSuccessChime();
  };

  return (
    <Card className="accountant-bank-card">
      <CardHeader>
        <div className="bank-risk-header-flex">
          <div>
            <div className="bank-risk-badge-row">
              <Badge variant={criticalCount > 0 ? 'error' : 'brand'}>
                {criticalCount > 0 ? `${criticalCount} CLIENTES EN RIESGO DE EXCLUSIÓN` : 'CARTERA AUDITADA'}
              </Badge>
              <span className="bank-risk-legal-tag">Art. 20 inc. f y g Ley 24.977 — Cruce Bancario ARCA</span>
            </div>
            <CardTitle>Tablero de Exclusión y Brecha Bancaria de la Cartera</CardTitle>
            <CardSubtitle>
              Detección preventiva de inconsistencias entre acreditaciones en cuentas (CBU / Mercado Pago) y facturación emitida.
            </CardSubtitle>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <DownloadIcon size={14} /> Exportar Auditoría Bancaria
          </Button>
        </div>
      </CardHeader>

      <div className="bank-risk-body">
        {/* KPIs de Riesgo */}
        <div className="bank-risk-kpis">
          <div className="bank-risk-kpi" onClick={() => setFilterRisk('all')} style={{ cursor: 'pointer' }}>
            <span className="risk-kpi-lbl">Total Clientes Auditados</span>
            <span className="risk-kpi-val">{evaluatedClients.length}</span>
            <span className="risk-kpi-sub">Comercios y Profesionales</span>
          </div>

          <div className="bank-risk-kpi danger" onClick={() => setFilterRisk('red')} style={{ cursor: 'pointer' }}>
            <span className="risk-kpi-lbl">Peligro Crítico Exclusión</span>
            <span className="risk-kpi-val text-danger">{criticalCount}</span>
            <span className="risk-kpi-sub">Depósitos superan categoría</span>
          </div>

          <div className="bank-risk-kpi warning" onClick={() => setFilterRisk('yellow')} style={{ cursor: 'pointer' }}>
            <span className="risk-kpi-lbl">Alerta Brecha No Facturada</span>
            <span className="risk-kpi-val text-warning">{warningCount}</span>
            <span className="risk-kpi-sub">Brecha &gt; 20% en cuentas</span>
          </div>

          <div className="bank-risk-kpi success" onClick={() => setFilterRisk('green')} style={{ cursor: 'pointer' }}>
            <span className="risk-kpi-lbl">Conciliación en Orden</span>
            <span className="risk-kpi-val text-success">{safeCount}</span>
            <span className="risk-kpi-sub">Depósitos alineados a facturas</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bank-risk-filters-bar">
          <div style={{ flex: 1, minWidth: '220px' }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por CUIT o Razón Social..."
            />
          </div>

          <div className="bank-risk-tabs">
            <button
              type="button"
              className={`bank-tab-btn ${filterRisk === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRisk('all')}
            >
              Todos ({evaluatedClients.length})
            </button>
            <button
              type="button"
              className={`bank-tab-btn ${filterRisk === 'red' ? 'active' : ''}`}
              onClick={() => setFilterRisk('red')}
            >
              Críticos ({criticalCount})
            </button>
            <button
              type="button"
              className={`bank-tab-btn ${filterRisk === 'yellow' ? 'active' : ''}`}
              onClick={() => setFilterRisk('yellow')}
            >
              Brecha ({warningCount})
            </button>
            <button
              type="button"
              className={`bank-tab-btn ${filterRisk === 'green' ? 'active' : ''}`}
              onClick={() => setFilterRisk('green')}
            >
              Seguros ({safeCount})
            </button>
          </div>
        </div>

        {/* Tabla de Riesgo */}
        <div className="bank-risk-table-wrap">
          <table className="bank-risk-table">
            <thead>
              <tr>
                <th>Cliente / CUIT</th>
                <th>Cat.</th>
                <th>Facturación Oficial</th>
                <th>Acreditaciones Netas</th>
                <th>Brecha No Declarada</th>
                <th>Semáforo Fiscal</th>
                <th>Diagnóstico ARCA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron clientes en este estado de riesgo.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className={c.risk.status === 'red' ? 'row-bank-red' : ''}>
                    <td>
                      <strong>{c.fantasy_name || c.razon_social}</strong>
                      <div className="text-muted font-mono" style={{ fontSize: '0.74rem' }}>{c.cuit}</div>
                    </td>
                    <td>
                      <span className="client-cat-badge">Cat. {c.monotributo_category || 'D'}</span>
                    </td>
                    <td className="font-mono">{formatCurrencyARS(c.rollingInvoiced)}</td>
                    <td className="font-mono font-bold">{formatCurrencyARS(c.risk.netCommercialDeposits)}</td>
                    <td className="font-mono">
                      {c.risk.uninvoicedGap > 0 ? (
                        <span className="text-danger font-bold">+{formatCurrencyARS(c.risk.uninvoicedGap)}</span>
                      ) : (
                        <span className="text-success">$0 (Alineado)</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={c.risk.status === 'red' ? 'error' : c.risk.status === 'yellow' ? 'warning' : 'success'}>
                        {c.risk.status === 'red' ? 'PELIGRO EXCLUSIÓN' : c.risk.status === 'yellow' ? 'ALERTA BRECHA' : 'EN ORDEN'}
                      </Badge>
                    </td>
                    <td>
                      <div className="bank-risk-diag-title">{c.risk.title}</div>
                      <div className="bank-risk-diag-desc">{c.risk.message}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
