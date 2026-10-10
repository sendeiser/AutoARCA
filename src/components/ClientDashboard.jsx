import React, { useState } from 'react';
import TaxTrafficLight from './TaxTrafficLight.jsx';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { StatCard, StatGrid } from './untitled-ui/StatCard.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import {
  Table,
  TableContainer,
  TableToolbar,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from './untitled-ui/Table.jsx';
import { BoltIcon, DownloadIcon } from './Icons.jsx';
import { reportPdfService } from '../services/reportPdfService.js';
import { soundService } from '../services/soundService.js';

export default function ClientDashboard({
  metrics,
  businessProfile = {},
  pendingSales = [],
  batchHistory = [],
  onCloseBatch,
  onNavigateToPos
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(null);

  const pendingCount = pendingSales.length;
  const pendingTotal = pendingSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);

  const handleCloseDay = async () => {
    if (pendingCount === 0) {
      alert('No hay comprobantes pendientes de cierre para el día de hoy.');
      return;
    }

    if (!window.confirm('¿Confirmas el cierre de jornada y la generación del lote para ARCA?')) {
      return;
    }

    setIsClosing(true);
    try {
      if (onCloseBatch) {
        const batch = await onCloseBatch();
        setCloseSuccess(`¡Jornada cerrada con éxito! Lote generado con ${batch?.total_sales_count || pendingCount} comprobantes.`);
      }
    } catch (err) {
      alert(err.message || 'Error al cerrar jornada');
    } finally {
      setIsClosing(false);
    }
  };

  const handleDownloadFile = (batch) => {
    if (!batch || !batch.file_content_arca) return;
    const blob = new Blob([batch.file_content_arca], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', batch.filename || `comprobantes_arca_${batch.batch_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReportPdf = () => {
    soundService.playKeyTap();
    try {
      reportPdfService.generateClientFiscalReport({
        businessProfile,
        metrics,
        sales: pendingSales,
        batchHistory
      });
      soundService.playSuccessChime();
    } catch (err) {
      console.error('Error generando reporte PDF:', err);
      alert('Error al generar el reporte PDF: ' + err.message);
    }
  };

  return (
    <div className="client-dashboard-wrap" style={{ maxWidth: '960px', margin: '0 auto', padding: '1.25rem' }}>
      {/* Barra de Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="dashboard-business-title" style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {businessProfile.fantasy_name || 'Panel del Comercio'}
            </h1>
            <Badge variant="brand" hasDot={true}>
              Cat. {businessProfile.monotributo_category || 'D'}
            </Badge>
          </div>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)' }}>
            CUIT: <strong>{businessProfile.cuit || 'Sin registrar'}</strong> · {businessProfile.razon_social || 'Titular'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleDownloadReportPdf}
            iconLeading={<DownloadIcon size={16} />}
            title="Descargar informe fiscal en PDF para enviar a tu contador"
          >
            Reporte PDF Contador 📄
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToPos}
            iconLeading={<BoltIcon size={16} />}
          >
            Terminal POS ⚡
          </Button>
        </div>
      </div>

      {/* Métricas Estadísticas de Untitled UI */}
      <StatGrid>
        <StatCard
          label="Emisión Pendiente Hoy"
          value={formatCurrencyARS(pendingTotal)}
          icon="🧾"
          caption={`${pendingCount} comprobantes`}
          trend={pendingCount > 0 ? 'up' : 'neutral'}
          change={pendingCount > 0 ? `+${pendingCount}` : '0'}
        />

        <StatCard
          label="Acumulado Móvil 12 Meses"
          value={formatCurrencyARS(metrics?.rolling12mSales || 0)}
          icon="📈"
          caption={`Tope Cat. ${businessProfile.monotributo_category || 'D'}`}
          trend="neutral"
          change={`${(metrics?.percentageConsumed || 0).toFixed(1)}%`}
        />

        <StatCard
          label="Margen de Seguridad ARCA"
          value={formatCurrencyARS(metrics?.safetyMarginARS || 0)}
          icon="🛡️"
          caption="Disponible antes de recategorizar"
          trend={metrics?.safetyMarginARS > 0 ? 'up' : 'down'}
          change={metrics?.trafficLight?.label || 'Estable'}
        />

        <StatCard
          label="Proyección Fin de Período"
          value={formatCurrencyARS(metrics?.projectedAnnualSales || 0)}
          icon="🎯"
          caption="Estimación lineal"
          trend="neutral"
        />
      </StatGrid>

      {/* Semáforo Fiscal de Monotributo */}
      <div style={{ marginBottom: '1.5rem' }}>
        <TaxTrafficLight metrics={metrics} />
      </div>

      {/* Tarjeta de Cierre de Jornada del Día */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <CardTitle>Cierre de Jornada de Hoy</CardTitle>
              {pendingCount > 0 ? (
                <Badge variant="warning" hasDot={true}>Pendiente de Cierre</Badge>
              ) : (
                <Badge variant="success" hasDot={true}>Al Día</Badge>
              )}
            </div>
            <CardSubtitle>
              {pendingCount} ventas registradas hoy · Total acumulado: <strong>{formatCurrencyARS(pendingTotal)}</strong>
            </CardSubtitle>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleCloseDay}
            disabled={isClosing || pendingCount === 0}
            isLoading={isClosing}
            iconLeading={<DownloadIcon size={16} />}
          >
            {isClosing ? 'Generando Lote...' : '📥 Cerrar Jornada y Enviar al Contador'}
          </Button>
        </div>

        {closeSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✓</span>
            <span>{closeSuccess}</span>
          </div>
        )}
      </Card>

      {/* Tabla de Historial de Lotes ARCA Generados */}
      <TableContainer>
        <TableToolbar>
          <div>
            <h3 className="dashboard-section-subtitle" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
              Historial de Lotes Diarios para ARCA
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Archivos consolidados listos para exportación oficial
            </span>
          </div>
          <Badge variant="gray">{batchHistory.length} Lotes</Badge>
        </TableToolbar>

        {batchHistory.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            Aún no se han generado lotes diarios cerrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Lote</TableHead>
                <TableHead>Comprobantes</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Tipo Cierre</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchHistory.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    <strong>{batch.batch_date}</strong>
                  </TableCell>
                  <TableCell>{batch.total_sales_count} ventas</TableCell>
                  <TableCell>
                    <strong>{formatCurrencyARS(batch.total_amount)}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant={batch.closed_by === 'cron' ? 'brand' : 'gray'}>
                      {batch.closed_by === 'cron' ? 'Automático (Cron)' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadFile(batch)}
                      iconLeading={<DownloadIcon size={14} />}
                    >
                      Descargar CSV
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </div>
  );
}
