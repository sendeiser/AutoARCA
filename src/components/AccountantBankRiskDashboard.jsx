import React, { useState, useMemo, useEffect } from 'react';
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
  CopyIcon,
  TableIcon,
  GridIcon
} from './Icons.jsx';
import '../styles/accountantBankRisk.css';

export default function AccountantBankRiskDashboard({
  clients = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all'); // 'all' | 'red' | 'yellow' | 'green'
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);

  // Detección reactiva de tamaño de pantalla
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(max-width: 768px)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isCardsActive = viewMode === 'cards' || (viewMode === 'auto' && isMobile);
  const isTableActive = viewMode === 'table' || (viewMode === 'auto' && !isMobile);

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

  const getWhatsAppUrl = (c) => {
    const name = c.fantasy_name || c.razon_social || 'Estimado/a cliente';
    const text =
      `Hola ${name}, te contactamos desde el Estudio Contable por una alerta de ARCA en tu Monotributo (CUIT ${c.cuit}):\n\n` +
      `• Facturación emitida (12 meses): ${formatCurrencyARS(c.rollingInvoiced)}\n` +
      `• Acreditaciones bancarias / Mercado Pago: ${formatCurrencyARS(c.risk.netCommercialDeposits)}\n` +
      (c.risk.uninvoicedGap > 0 ? `• Brecha detectada sin facturar: ${formatCurrencyARS(c.risk.uninvoicedGap)}\n\n` : '\n') +
      `⚠️ Diagnóstico: ${c.risk.title}\n` +
      `${c.risk.message}\n\n` +
      `Te sugerimos comunicarte a la brevedad para regularizar y evitar intimaciones o exclusión de oficio.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleCopyDiagnostic = (c) => {
    soundService.playKeyTap();
    const summary =
      `[AUDITORÍA BANCARIA ARCA - CUIT ${c.cuit} - ${c.fantasy_name || c.razon_social}]\n` +
      `Categoría: Cat. ${c.monotributo_category || 'D'}\n` +
      `Facturado Oficial (12M): ${formatCurrencyARS(c.rollingInvoiced)}\n` +
      `Acreditaciones Netas (Bancos/CVU): ${formatCurrencyARS(c.risk.netCommercialDeposits)}\n` +
      `Brecha No Declarada: ${c.risk.uninvoicedGap > 0 ? '+' + formatCurrencyARS(c.risk.uninvoicedGap) : '$0 (Alineado)'}\n` +
      `Dictamen: ${c.risk.title}\n` +
      `Detalle: ${c.risk.message}\n` +
      `Marco Legal: Art. 20 inc. f y g Ley 24.977`;
    
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summary);
    }
    setCopiedId(c.id);
    soundService.playSuccessChime();
    setTimeout(() => setCopiedId(null), 2000);
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
          <div
            className={`bank-risk-kpi ${filterRisk === 'all' ? 'active' : ''}`}
            onClick={() => { soundService.playTap(); setFilterRisk('all'); }}
            style={{ cursor: 'pointer' }}
          >
            <span className="risk-kpi-lbl">Total Clientes Auditados</span>
            <span className="risk-kpi-val">{evaluatedClients.length}</span>
            <span className="risk-kpi-sub">Comercios y Profesionales</span>
          </div>

          <div
            className={`bank-risk-kpi danger ${filterRisk === 'red' ? 'active' : ''}`}
            onClick={() => { soundService.playTap(); setFilterRisk('red'); }}
            style={{ cursor: 'pointer' }}
          >
            <span className="risk-kpi-lbl">Peligro Crítico Exclusión</span>
            <span className="risk-kpi-val text-danger">{criticalCount}</span>
            <span className="risk-kpi-sub">Depósitos superan categoría</span>
          </div>

          <div
            className={`bank-risk-kpi warning ${filterRisk === 'yellow' ? 'active' : ''}`}
            onClick={() => { soundService.playTap(); setFilterRisk('yellow'); }}
            style={{ cursor: 'pointer' }}
          >
            <span className="risk-kpi-lbl">Alerta Brecha No Facturada</span>
            <span className="risk-kpi-val text-warning">{warningCount}</span>
            <span className="risk-kpi-sub">Brecha &gt; 20% en cuentas</span>
          </div>

          <div
            className={`bank-risk-kpi success ${filterRisk === 'green' ? 'active' : ''}`}
            onClick={() => { soundService.playTap(); setFilterRisk('green'); }}
            style={{ cursor: 'pointer' }}
          >
            <span className="risk-kpi-lbl">Conciliación en Orden</span>
            <span className="risk-kpi-val text-success">{safeCount}</span>
            <span className="risk-kpi-sub">Depósitos alineados a facturas</span>
          </div>
        </div>

        {/* Barra de Filtros y Conmutador de Vista */}
        <div className="bank-risk-filters-bar">
          <div style={{ flex: 1, minWidth: '220px' }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por CUIT o Razón Social..."
            />
          </div>

          <div className="bank-risk-controls-right">
            {/* Tabs de Filtro de Riesgo */}
            <div className="bank-risk-tabs">
              <button
                type="button"
                className={`bank-tab-btn ${filterRisk === 'all' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setFilterRisk('all'); }}
              >
                Todos ({evaluatedClients.length})
              </button>
              <button
                type="button"
                className={`bank-tab-btn tab-danger ${filterRisk === 'red' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setFilterRisk('red'); }}
              >
                Críticos ({criticalCount})
              </button>
              <button
                type="button"
                className={`bank-tab-btn tab-warning ${filterRisk === 'yellow' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setFilterRisk('yellow'); }}
              >
                Brecha ({warningCount})
              </button>
              <button
                type="button"
                className={`bank-tab-btn tab-success ${filterRisk === 'green' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setFilterRisk('green'); }}
              >
                Seguros ({safeCount})
              </button>
            </div>

            {/* Selector de Vista: Tarjetas Móvil vs Tabla */}
            <div className="bank-viewmode-toggle" role="group" aria-label="Modo de visualización">
              <button
                type="button"
                className={`bank-view-btn ${isCardsActive ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setViewMode('cards'); }}
                title="Vista optimizada de tarjetas táctiles para móviles"
              >
                <GridIcon size={14} /> Tarjetas Móvil
              </button>
              <button
                type="button"
                className={`bank-view-btn ${isTableActive ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setViewMode('table'); }}
                title="Vista tradicional de tabla para escritorio"
              >
                <TableIcon size={14} /> Tabla Clásica
              </button>
            </div>
          </div>
        </div>

        {/* 1. Vista de Tarjetas Rediseñadas para Modo Mobile */}
        <div className={`bank-risk-mobile-cards ${viewMode === 'table' ? 'force-hidden' : ''} ${viewMode === 'cards' ? 'force-visible' : ''}`}>
          {filtered.length === 0 ? (
            <div className="bank-risk-empty-cards">
              <ShieldCheckIcon size={36} className="text-muted" />
              <h4>No se encontraron clientes</h4>
              <p>No hay registros que coincidan con la búsqueda o el filtro de riesgo seleccionado.</p>
            </div>
          ) : (
            filtered.map((c) => {
              const maxVal = Math.max(c.risk.netCommercialDeposits, c.rollingInvoiced, 1);
              const invoicePct = Math.min(100, Math.round((c.rollingInvoiced / maxVal) * 100));
              const gapPct = Math.min(100, Math.round((c.risk.uninvoicedGap / maxVal) * 100));

              return (
                <div
                  key={c.id}
                  className={`bank-risk-mobile-card card-risk-${c.risk.status}`}
                >
                  {/* Encabezado del Cliente */}
                  <div className="m-card-header">
                    <div className="m-card-identity">
                      <div className={`m-card-avatar avatar-${c.risk.status}`}>
                        {c.risk.status === 'red' ? '🚨' : c.risk.status === 'yellow' ? '⚠️' : '🛡️'}
                      </div>
                      <div className="m-card-text">
                        <h4 className="m-card-name">{c.fantasy_name || c.razon_social}</h4>
                        <div className="m-card-meta">
                          <code className="m-card-cuit">{c.cuit}</code>
                          <span className="client-cat-badge">Cat. {c.monotributo_category || 'D'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="m-card-badge-wrap">
                      <Badge variant={c.risk.status === 'red' ? 'error' : c.risk.status === 'yellow' ? 'warning' : 'success'}>
                        {c.risk.status === 'red' ? 'PELIGRO EXCLUSIÓN' : c.risk.status === 'yellow' ? 'ALERTA BRECHA' : 'EN ORDEN'}
                      </Badge>
                    </div>
                  </div>

                  {/* Métricas Financieras (Grilla 3 Cajas) */}
                  <div className="m-card-metrics-grid">
                    <div className="m-metric-box">
                      <span className="m-metric-title">Facturado (12M)</span>
                      <span className="m-metric-number font-mono">{formatCurrencyARS(c.rollingInvoiced)}</span>
                      <span className="m-metric-hint">Comprobantes ARCA</span>
                    </div>

                    <div className="m-metric-box">
                      <span className="m-metric-title">Acreditaciones Netas</span>
                      <span className="m-metric-number font-mono text-cyan">{formatCurrencyARS(c.risk.netCommercialDeposits)}</span>
                      <span className="m-metric-hint">Bancos & Billeteras</span>
                    </div>

                    <div className={`m-metric-box ${c.risk.uninvoicedGap > 0 ? 'box-danger' : 'box-success'}`}>
                      <span className="m-metric-title">Brecha No Declarada</span>
                      <span className={`m-metric-number font-mono font-bold ${c.risk.uninvoicedGap > 0 ? 'text-danger' : 'text-success'}`}>
                        {c.risk.uninvoicedGap > 0 ? `+${formatCurrencyARS(c.risk.uninvoicedGap)}` : '$0'}
                      </span>
                      <span className="m-metric-hint">
                        {c.risk.uninvoicedGap > 0 ? `${c.risk.gapPercentage}% sin comprobante` : '100% justificado'}
                      </span>
                    </div>
                  </div>

                  {/* Termómetro Visual de Cruce Bancario */}
                  <div className="m-card-thermometer">
                    <div className="m-thermo-labels">
                      <span className="m-thermo-title">Proporción Cruce Fiscal vs Depósitos</span>
                      <span className="m-thermo-value font-mono">
                        {c.risk.uninvoicedGap > 0
                          ? `Brecha: ${c.risk.gapPercentage}%`
                          : 'Conciliación alineada'}
                      </span>
                    </div>
                    <div className="m-thermo-track" role="progressbar" aria-valuenow={invoicePct} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className="m-thermo-bar-invoiced"
                        style={{ width: `${invoicePct}%` }}
                        title="Facturación Declarada"
                      />
                      {c.risk.uninvoicedGap > 0 && (
                        <div
                          className={`m-thermo-bar-gap bar-gap-${c.risk.status}`}
                          style={{ width: `${gapPct}%` }}
                          title="Brecha de depósitos no respaldada"
                        />
                      )}
                    </div>
                    <div className="m-thermo-legend">
                      <span className="m-leg-item leg-invoiced">
                        <span className="m-leg-dot dot-invoiced" /> Facturación
                      </span>
                      {c.risk.uninvoicedGap > 0 ? (
                        <span className="m-leg-item leg-gap">
                          <span className={`m-leg-dot dot-gap-${c.risk.status}`} /> Brecha Excedida
                        </span>
                      ) : (
                        <span className="m-leg-item leg-safe">
                          <span className="m-leg-dot dot-safe" /> Respaldado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dictamen Legal ARCA */}
                  <div className={`m-card-callout callout-${c.risk.status}`}>
                    <div className="m-callout-header">
                      {c.risk.status === 'green' ? (
                        <ShieldCheckIcon size={16} className="text-success" />
                      ) : (
                        <AlertTriangleIcon size={16} className={c.risk.status === 'red' ? 'text-danger' : 'text-warning'} />
                      )}
                      <span className="m-callout-title">{c.risk.title}</span>
                    </div>
                    <p className="m-callout-desc">{c.risk.message}</p>
                    <div className="m-callout-law font-mono">
                      Inconsistencias ARCA — Régimen Simplificado Monotributo
                    </div>
                  </div>

                  {/* Acciones Táctiles Rápidas */}
                  <div className="m-card-actions">
                    <a
                      href={getWhatsAppUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="m-btn-wa"
                      onClick={() => soundService.playSuccessChime()}
                      title="Enviar notificación preventiva por WhatsApp"
                    >
                      <span className="m-wa-icon">💬</span>
                      <span>Alertar WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      className="m-btn-copy"
                      onClick={() => handleCopyDiagnostic(c)}
                      title="Copiar dictamen contable al portapapeles"
                    >
                      <CopyIcon size={14} />
                      <span>{copiedId === c.id ? '¡Copiado!' : 'Copiar Dictamen'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. Vista Tradicional en Tabla (Desktop y Fallback) */}
        <div className={`bank-risk-desktop-table bank-risk-table-wrap ${viewMode === 'cards' ? 'force-hidden' : ''} ${viewMode === 'table' ? 'force-visible' : ''}`}>
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
