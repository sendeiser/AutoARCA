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
    <div className="apple-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="apple-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="apple-sheet-header">
          <div className="apple-sheet-title-group">
            <div className="apple-icon-bubble">
              <DatabaseIcon size={20} />
            </div>
            <div>
              <h3 className="apple-sheet-title">Configuración Supabase Cloud</h3>
              <p className="apple-sheet-subtitle">Base de Datos PostgreSQL Conectada</p>
            </div>
          </div>
          <button className="apple-btn-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="apple-sheet-body">
          {/* Tarjeta de Conexión Live */}
          <div className="apple-card-section">
            <div className="apple-status-row">
              <div className="apple-status-indicator-wrap">
                <span className={`apple-status-dot ${health?.isOnline ? 'online' : 'offline'}`} />
                <span className="apple-status-text">
                  {loading ? 'Comprobando enlace...' : health?.isOnline ? 'En Línea & Conectado' : 'Conectando'}
                </span>
              </div>
              <button
                className="apple-btn-secondary"
                onClick={() => {
                  soundService.playKeyTap();
                  checkStatus();
                }}
                disabled={loading}
              >
                <RefreshIcon size={13} />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="apple-meta-grid">
              <div className="apple-meta-item">
                <span className="apple-meta-label">Supabase URL</span>
                <span className="apple-meta-val font-mono">
                  https://oqwzldvbvdigilcekhmo.supabase.co
                </span>
              </div>
              <div className="apple-meta-item">
                <span className="apple-meta-label">Project ID</span>
                <span className="apple-meta-val font-mono">oqwzldvbvdigilcekhmo</span>
              </div>
              <div className="apple-meta-item">
                <span className="apple-meta-label">Latencia Ping</span>
                <span className="apple-meta-val font-mono">
                  {health?.latencyMs ? `${health.latencyMs} ms` : 'Verificando...'}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Tablas y Esquema */}
          <h4 className="apple-section-title">Esquema Nuclear (5 Tablas)</h4>
          <div className="apple-tables-list">
            {tablesList.map((tbl) => {
              const isAvailable = health?.tables?.[tbl.key];
              return (
                <div key={tbl.key} className="apple-table-row">
                  <div className="apple-table-info">
                    <span className="apple-table-name font-mono">{tbl.label}</span>
                    <span className="apple-table-desc">{tbl.desc}</span>
                  </div>
                  <div className="apple-table-badge">
                    {isAvailable ? (
                      <span className="apple-badge-active">
                        <CheckCircleIcon size={13} /> Listo en BD
                      </span>
                    ) : (
                      <span className="apple-badge-sync">
                        <CloudSyncIcon size={13} /> Auto-Sync Offline
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Instrucciones y Acciones Rápidas */}
          <div className="apple-callout-card">
            <div className="apple-callout-header">
              <CloudSyncIcon size={16} />
              <span>Sincronización Local-First & Supabase Cloud</span>
            </div>
            <p className="apple-callout-text">
              AutoARCA opera con persistencia local y sincronización en segundo plano con tu proyecto de Supabase.
              Las 5 tablas, RLS y datos semillas de monotributo están compilados en <code>supabase/FULL_SETUP.sql</code>.
            </p>
            <div className="apple-actions-group">
              <a
                href="https://supabase.com/dashboard/project/oqwzldvbvdigilcekhmo/sql/new"
                target="_blank"
                rel="noreferrer"
                className="apple-btn-primary"
                onClick={() => soundService.playKeyTap()}
              >
                <ExternalLinkIcon size={14} />
                <span>Abrir SQL Editor en Supabase</span>
              </a>
              <button className="apple-btn-outline" onClick={handleCopySql}>
                <CopyIcon size={14} />
                <span>{copied ? '¡Copiado!' : 'Copiar Referencia SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
