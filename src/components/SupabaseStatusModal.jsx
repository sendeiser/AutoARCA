import React, { useState, useEffect } from 'react';
import {
  DatabaseIcon,
  CloudSyncIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshIcon
} from './Icons.jsx';
import { supabaseDataService } from '../services/supabaseDataService.js';
import { soundService } from '../services/soundService.js';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import '../styles/untitled-ui.css';

export default function SupabaseStatusModal({ isOpen, onClose }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const data = await supabaseDataService.checkDatabaseHealth();
      setHealth(data);
    } catch {
      setHealth({
        isOnline: false,
        url: 'https://oqwzldvbvdigilcekhmo.supabase.co',
        projectId: 'oqwzldvbvdigilcekhmo',
        tables: {}
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    soundService.playKeyTap();
    const sqlUrl = 'https://supabase.com/dashboard/project/oqwzldvbvdigilcekhmo/sql/new';
    navigator.clipboard?.writeText(
      `-- Ejecutar en Supabase SQL Editor: ${sqlUrl}\n-- Ver archivo en repositorio: supabase/FULL_SETUP.sql`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  const tablesList = [
    { key: 'profiles', label: 'profiles (Usuarios & Roles)', desc: 'Roles client, accountant, superadmin' },
    { key: 'business_profiles', label: 'business_profiles (Datos Fiscales)', desc: 'CUIT, razón social, categoría Monotributo' },
    { key: 'monotributo_scales', label: 'monotributo_scales (Escalas Oficiales)', desc: 'Límites ARCA Categorías A a K' },
    { key: 'sales_receipts', label: 'sales_receipts (Comprobantes POS)', desc: 'Facturas C y ventas registradas' },
    { key: 'daily_batches', label: 'daily_batches (Lotes ARCA)', desc: 'Cierres diarios consolidados y exportaciones' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<DatabaseIcon size={22} />}
      title="Configuración Supabase Cloud"
      subtitle="Base de Datos PostgreSQL Conectada · AutoARCA"
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', gap: '0.65rem', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              soundService.playKeyTap();
              checkStatus();
            }}
            disabled={loading}
            isLoading={loading}
            iconLeading={<RefreshIcon size={14} />}
          >
            Verificar Estado
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Tarjeta de Conexión Live */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant={health?.isOnline ? 'success' : 'brand'} hasDot={true}>
                {loading ? 'Comprobando enlace...' : health?.isOnline ? 'En Línea & Conectado' : 'Conectando'}
              </Badge>
            </div>
            {health?.latencyMs && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Ping: <strong>{health.latencyMs} ms</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.78rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Project ID</span>
              <code style={{ color: '#cbd5e1' }}>oqwzldvbvdigilcekhmo</code>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Endpoint REST</span>
              <code style={{ color: '#cbd5e1' }}>/rest/v1</code>
            </div>
          </div>
        </div>

        {/* Lista de Tablas y Esquema */}
        <div>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', margin: '0 0 0.65rem 0' }}>
            Esquema Nuclear (5 Tablas en Vivo)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tablesList.map((tbl) => {
              const isAvailable = health?.tables?.[tbl.key];
              return (
                <div
                  key={tbl.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                      {tbl.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{tbl.desc}</div>
                  </div>
                  <Badge variant={isAvailable ? 'success' : 'brand'}>
                    {isAvailable ? '✓ Listo en BD' : '☁️ Local Sync'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Callout de Acciones Rápidas */}
        <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: '12px', padding: '0.85rem' }}>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#c4b5fd', lineHeight: 1.45 }}>
            AutoARCA opera con persistencia local y sincronización en segundo plano con Supabase Cloud.
            Las 5 tablas y datos semillas están en <code>supabase/FULL_SETUP.sql</code>.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySql}
              iconLeading={<CopyIcon size={13} />}
            >
              {copied ? '¡Copiado!' : 'Copiar Referencia SQL'}
            </Button>
            <a
              href="https://supabase.com/dashboard/project/oqwzldvbvdigilcekhmo/sql/new"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="primary"
                size="sm"
                iconLeading={<ExternalLinkIcon size={13} />}
              >
                Abrir SQL Editor
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
