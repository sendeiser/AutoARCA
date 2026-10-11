import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { SearchInput } from './untitled-ui/SearchInput.jsx';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import {
  TrendingUpIcon,
  CopyIcon,
  DownloadIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon
} from './Icons.jsx';
import '../styles/accountantRecatMatrix.css';

// Escalas vigentes por defecto si no se proporcionan
const DEFAULT_SCALES = [
  { category: 'A', max_annual_billing: 6450000, monthly_quota: 26600 },
  { category: 'B', max_annual_billing: 9450000, monthly_quota: 30280 },
  { category: 'C', max_annual_billing: 13250000, monthly_quota: 35400 },
  { category: 'D', max_annual_billing: 16450000, monthly_quota: 45440 },
  { category: 'E', max_annual_billing: 19350000, monthly_quota: 58500 },
  { category: 'F', max_annual_billing: 24250000, monthly_quota: 69800 },
  { category: 'G', max_annual_billing: 29000000, monthly_quota: 85900 },
  { category: 'H', max_annual_billing: 44000000, monthly_quota: 170800 },
  { category: 'I', max_annual_billing: 49250000, monthly_quota: 255100 },
  { category: 'J', max_annual_billing: 56400000, monthly_quota: 311900 },
  { category: 'K', max_annual_billing: 68000000, monthly_quota: 377000 }
];

export default function AccountantRecategorizationMatrix({
  clients = [],
  scales = DEFAULT_SCALES
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all'); // 'all' | 'changes' | 'up' | 'down'
  const [copiedClientId, setCopiedClientId] = useState(null);

  // Mapeo y análisis de recategorización de cada cliente de la cartera
  const evaluatedClients = useMemo(() => {
    return clients.map((c) => {
      const currentCat = c.monotributo_category || 'D';
      const rollingSales = Number(c.rolling12mSales || (c.todayBatch?.total_amount ? c.todayBatch.total_amount * 12 : 7200000));
      
      const currentScale = scales.find((s) => s.category === currentCat) || scales[3];
      
      // Determina la categoría correspondiente según la facturación de los últimos 12 meses
      let targetScale = scales.find((s) => rollingSales <= s.max_annual_billing);
      let isExceeded = false;
      if (!targetScale) {
        targetScale = scales[scales.length - 1];
        isExceeded = rollingSales > targetScale.max_annual_billing;
      }

      const targetCat = targetScale.category;
      let action = 'maintain';
      let actionLabel = 'Mantiene Categoría';
      let actionVariant = 'gray';

      const currentIndex = scales.findIndex((s) => s.category === currentCat);
      const targetIndex = scales.findIndex((s) => s.category === targetCat);

      if (isExceeded) {
        action = 'excluded';
        actionLabel = 'Exclusión Régimen General';
        actionVariant = 'error';
      } else if (targetIndex > currentIndex) {
        action = 'up';
        actionLabel = `Sube a Cat. ${targetCat}`;
        actionVariant = 'warning';
      } else if (targetIndex < currentIndex) {
        action = 'down';
        actionLabel = `Baja a Cat. ${targetCat}`;
        actionVariant = 'success';
      }

      const currentQuota = currentScale.monthly_quota || 45440;
      const targetQuota = targetScale.monthly_quota || 45440;
      const quotaDiff = targetQuota - currentQuota;

      return {
        ...c,
        rollingSales,
        currentCat,
        targetCat,
        isExceeded,
        action,
        actionLabel,
        actionVariant,
        currentQuota,
        targetQuota,
        quotaDiff
      };
    });
  }, [clients, scales]);

  // Filtrado de la tabla
  const filtered = evaluatedClients.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (c.cuit || '').includes(query) || (c.fantasy_name || c.razon_social || '').toLowerCase().includes(query);
    if (!matchesQuery) return false;

    if (filterAction === 'changes') return c.action !== 'maintain';
    if (filterAction === 'up') return c.action === 'up' || c.action === 'excluded';
    if (filterAction === 'down') return c.action === 'down';
    return true;
  });

  // KPIs
  const totalCount = evaluatedClients.length;
  const changesCount = evaluatedClients.filter((c) => c.action !== 'maintain').length;
  const upCount = evaluatedClients.filter((c) => c.action === 'up' || c.action === 'excluded').length;
  const downCount = evaluatedClients.filter((c) => c.action === 'down').length;

  const handleCopyNotice = (client) => {
    soundService.playTap();
    const msg = `Hola ${client.fantasy_name || client.razon_social}. Te informamos desde el Estudio Contable que, de acuerdo con tu facturación móvil de los últimos 12 meses (${formatCurrencyARS(client.rollingSales)}), tu situación en la Recategorización Semestral de ARCA es:\n\n` +
      `• Categoría Actual: ${client.currentCat}\n` +
      `• Categoría Proyectada: ${client.targetCat}\n` +
      `• Diagnóstico: ${client.actionLabel}\n` +
      (client.quotaDiff !== 0 ? `• Variación de cuota mensual: ${client.quotaDiff > 0 ? '+' : ''}${formatCurrencyARS(client.quotaDiff)}/mes\n\n` : '\n') +
      `Quedamos a tu disposición para cualquier consulta.`;

    navigator.clipboard.writeText(msg);
    setCopiedClientId(client.id);
    setTimeout(() => setCopiedClientId(null), 2500);
  };

  const handleExportMatrixCsv = () => {
    soundService.playKeyTap();
    const headers = ['CUIT', 'Denominacion', 'Categoria_Actual', 'Facturacion_12M', 'Categoria_Proyectada', 'Diagnostico', 'Diferencia_Cuota_ARS'];
    const rows = evaluatedClients.map((c) => [
      `"${c.cuit}"`,
      `"${c.fantasy_name || c.razon_social}"`,
      `"${c.currentCat}"`,
      c.rollingSales.toFixed(2),
      `"${c.targetCat}"`,
      `"${c.actionLabel}"`,
      c.quotaDiff.toFixed(2)
    ].join(';'));

    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `matriz_recategorizacion_arca_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundService.playSuccessChime();
  };

  return (
    <Card className="recat-matrix-card">
      <CardHeader>
        <div className="recat-header-flex">
          <div>
            <div className="recat-badge-row">
              <Badge variant="brand">SEMESTRE VIGENTE</Badge>
              <span className="recat-legal-tag">Ley 27.743 & RG ARCA Recategorización</span>
            </div>
            <CardTitle>Matriz Masiva de Recategorización Semestral</CardTitle>
            <CardSubtitle>
              Auditoría en lote de toda la cartera basada en la facturación acumulada de los últimos 12 meses.
            </CardSubtitle>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportMatrixCsv}>
            <DownloadIcon size={14} /> Exportar Matriz a Excel (CSV)
          </Button>
        </div>
      </CardHeader>

      <div className="recat-matrix-body">
        {/* KPIs de la Auditoría */}
        <div className="recat-kpis-grid">
          <div className="recat-kpi-item" onClick={() => setFilterAction('all')} style={{ cursor: 'pointer' }}>
            <span className="recat-kpi-lbl">Total Auditados</span>
            <span className="recat-kpi-val">{totalCount}</span>
            <span className="recat-kpi-sub">Clientes activos</span>
          </div>

          <div className="recat-kpi-item" onClick={() => setFilterAction('changes')} style={{ cursor: 'pointer' }}>
            <span className="recat-kpi-lbl">Cambian de Categoría</span>
            <span className="recat-kpi-val text-primary">{changesCount}</span>
            <span className="recat-kpi-sub">Requieren trámite en ARCA</span>
          </div>

          <div className="recat-kpi-item" onClick={() => setFilterAction('up')} style={{ cursor: 'pointer' }}>
            <span className="recat-kpi-lbl">Suben de Categoría</span>
            <span className="recat-kpi-val text-warning">{upCount}</span>
            <span className="recat-kpi-sub">Incrementan cuota mensual</span>
          </div>

          <div className="recat-kpi-item" onClick={() => setFilterAction('down')} style={{ cursor: 'pointer' }}>
            <span className="recat-kpi-lbl">Bajan de Categoría</span>
            <span className="recat-kpi-val text-success">{downCount}</span>
            <span className="recat-kpi-sub">Ahorro en cuota para el cliente</span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="recat-filters-bar">
          <div style={{ flex: 1, minWidth: '220px' }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por CUIT o Razón Social en la matriz..."
            />
          </div>

          <div className="recat-tabs-group">
            <button
              type="button"
              className={`recat-tab-filter ${filterAction === 'all' ? 'active' : ''}`}
              onClick={() => setFilterAction('all')}
            >
              Todos ({totalCount})
            </button>
            <button
              type="button"
              className={`recat-tab-filter ${filterAction === 'changes' ? 'active' : ''}`}
              onClick={() => setFilterAction('changes')}
            >
              Cambian ({changesCount})
            </button>
            <button
              type="button"
              className={`recat-tab-filter ${filterAction === 'up' ? 'active' : ''}`}
              onClick={() => setFilterAction('up')}
            >
              Suben ({upCount})
            </button>
            <button
              type="button"
              className={`recat-tab-filter ${filterAction === 'down' ? 'active' : ''}`}
              onClick={() => setFilterAction('down')}
            >
              Bajan ({downCount})
            </button>
          </div>
        </div>

        {/* Tabla de la Matriz */}
        <div className="recat-table-container">
          <table className="recat-table">
            <thead>
              <tr>
                <th>Comercio / Profesional</th>
                <th>CUIT</th>
                <th>Cat. Actual</th>
                <th>Facturación 12 Meses</th>
                <th>Cat. Proyectada</th>
                <th>Diagnóstico ARCA</th>
                <th>Variación Cuota</th>
                <th style={{ textAlign: 'right' }}>Aviso al Cliente</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron clientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="recat-td-client" data-label="Cliente">
                      <strong>{c.fantasy_name || c.razon_social}</strong>
                      <div className="recat-subname">{c.razon_social}</div>
                    </td>
                    <td data-label="CUIT"><code className="font-mono">{c.cuit}</code></td>
                    <td data-label="Cat. Actual">
                      <span className="recat-cat-badge">Cat. {c.currentCat}</span>
                    </td>
                    <td data-label="Facturación 12M" className="font-mono font-bold">
                      {formatCurrencyARS(c.rollingSales)}
                    </td>
                    <td data-label="Cat. Proyectada">
                      <span className="recat-cat-badge target">Cat. {c.targetCat}</span>
                    </td>
                    <td data-label="Diagnóstico ARCA">
                      <Badge variant={c.actionVariant}>{c.actionLabel}</Badge>
                    </td>
                    <td data-label="Variación Cuota" className="font-mono">
                      {c.quotaDiff > 0 ? (
                        <span className="text-danger">+{formatCurrencyARS(c.quotaDiff)}/m</span>
                      ) : c.quotaDiff < 0 ? (
                        <span className="text-success">{formatCurrencyARS(c.quotaDiff)}/m</span>
                      ) : (
                        <span className="text-muted">$0</span>
                      )}
                    </td>
                    <td className="recat-td-action" data-label="Acción" style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyNotice(c)}
                        title="Copiar texto formal para enviar por WhatsApp o Email"
                      >
                        <CopyIcon size={13} />
                        {copiedClientId === c.id ? '¡Copiado!' : 'Avisar'}
                      </Button>
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
