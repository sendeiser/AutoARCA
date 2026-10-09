import React, { useState } from 'react';
import TaxTrafficLight from './TaxTrafficLight.jsx';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';

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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', color: '#f8fafc' }}>
      {/* Barra de Navegación Rápida */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>
            {businessProfile.fantasy_name || 'Panel del Comercio'}
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            CUIT: {businessProfile.cuit || 'Sin registrar'} · {businessProfile.razon_social || ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateToPos}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Ir al Terminal POS ⚡
        </button>
      </div>

      {/* Semáforo Fiscal de Monotributo */}
      <TaxTrafficLight metrics={metrics} />

      {/* Tarjeta de Cierre de Jornada del Día */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Cierre de Jornada de Hoy</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              {pendingCount} ventas registradas hoy · Total: <strong>{formatCurrencyARS(pendingTotal)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseDay}
            disabled={isClosing || pendingCount === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: pendingCount > 0 ? '#38bdf8' : '#475569',
              color: pendingCount > 0 ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: pendingCount > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {isClosing ? 'Generando Lote...' : '📥 Cerrar Jornada y Enviar al Contador'}
          </button>
        </div>

        {closeSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem' }}>
            {closeSuccess}
          </div>
        )}
      </div>

      {/* Historial de Lotes ARCA Generados */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Historial de Lotes Diarios para ARCA</h3>
        {batchHistory.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aún no se han generado lotes diarios cerrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {batchHistory.map((batch) => (
              <div
                key={batch.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Lote {batch.batch_date}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {batch.total_sales_count} comprobantes · {formatCurrencyARS(batch.total_amount)} · Cerrado por {batch.closed_by === 'cron' ? 'Automático (Cron)' : 'Manual'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(batch)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Descargar CSV 📥
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
