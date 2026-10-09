import React, { useState, useEffect } from 'react';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import '../styles/superAdmin.css';

export default function SuperAdminDashboard({
  scales = [],
  users = [],
  onSaveScales,
  onUpdateSubscription
}) {
  const [activeTab, setActiveTab] = useState('scales');
  const [editableScales, setEditableScales] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  useEffect(() => {
    if (scales && scales.length > 0) {
      setEditableScales([...scales]);
    }
  }, [scales]);

  const handleScaleChange = (cat, val) => {
    const numVal = Number(val) || 0;
    setEditableScales((prev) =>
      prev.map((s) =>
        s.category === cat
          ? {
              ...s,
              max_annual_billing: numVal,
              max_monthly_average: Number((numVal / 12).toFixed(2))
            }
          : s
      )
    );
  };

  // Ajuste masivo por inflación ARCA
  const handleBulkIncrease = (pct) => {
    soundService.playKeyTap();
    const multiplier = 1 + pct / 100;
    setEditableScales((prev) =>
      prev.map((s) => {
        const newMax = Math.round(s.max_annual_billing * multiplier);
        return {
          ...s,
          max_annual_billing: newMax,
          max_monthly_average: Number((newMax / 12).toFixed(2))
        };
      })
    );
    setToastMessage(`Ajuste de +${pct}% aplicado a todas las categorías.`);
    setTimeout(() => setToastMessage(null), 3000);
    soundService.playSuccessChime();
  };

  const handleSave = () => {
    soundService.playKeyTap();
    if (onSaveScales) {
      onSaveScales(editableScales);
    }
    setToastMessage('¡Escalas de Monotributo actualizadas en caliente!');
    setTimeout(() => setToastMessage(null), 2500);
    soundService.playSuccessChime();
  };

  const handleSubChange = (userId, newStatus) => {
    soundService.playKeyTap();
    if (onUpdateSubscription) {
      onUpdateSubscription(userId, newStatus);
    }
  };

  // KPIs
  const totalUsersCount = users.length;
  const activeSubsCount = users.filter((u) => u.subscription_status === 'active').length;
  const pastDueSubsCount = users.filter((u) => u.subscription_status === 'past_due').length;

  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-container">
      {/* Cabecera del Panel */}
      <div className="admin-header">
        <div>
          <div className="admin-badge-top">Centro de Comando Maestro</div>
          <h1>Panel Global de SuperAdmin</h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8' }}>
            Control de Parámetros Impositivos ARCA y Monitoreo SaaS en Tiempo Real
          </p>
        </div>
      </div>

      {/* Global SaaS Platform Metrics Banner */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Usuarios Registrados</div>
          <div className="admin-kpi-val">{totalUsersCount}</div>
          <div className="admin-kpi-sub">Comercios y contadores</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Suscripciones Activas</div>
          <div className="admin-kpi-val" style={{ color: '#10b981' }}>{activeSubsCount}</div>
          <div className="admin-kpi-sub">Cuentas al día</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Cuentas Suspendidas</div>
          <div className="admin-kpi-val" style={{ color: pastDueSubsCount > 0 ? '#ef4444' : '#94a3b8' }}>
            {pastDueSubsCount}
          </div>
          <div className="admin-kpi-sub">Pago pendiente</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Escalas Configuradas</div>
          <div className="admin-kpi-val" style={{ color: '#38bdf8' }}>{editableScales.length}</div>
          <div className="admin-kpi-sub">Categorías A a K</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'scales' ? 'active' : ''}`}
          onClick={() => { soundService.playKeyTap(); setActiveTab('scales'); }}
        >
          📊 Escalas Oficiales Monotributo
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { soundService.playKeyTap(); setActiveTab('users'); }}
        >
          👥 Usuarios y Suscripciones
        </button>
      </div>

      {toastMessage && (
        <div className="admin-toast">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Sección 1: Escalas de Monotributo */}
      {activeTab === 'scales' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Escalas Oficiales de Monotributo (A a K)</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Modifica los topes anuales. Las variaciones se aplican en caliente a todos los clientes sin reiniciar el sistema.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="bulk-increase-tool">
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Ajuste Inflación:</span>
                <button
                  type="button"
                  className="btn-scale-chip"
                  onClick={() => handleBulkIncrease(10)}
                  title="Aumentar todos los topes un 10%"
                >
                  +10%
                </button>
                <button
                  type="button"
                  className="btn-scale-chip"
                  onClick={() => handleBulkIncrease(15)}
                  title="Aumentar todos los topes un 15%"
                >
                  +15%
                </button>
                <button
                  type="button"
                  className="btn-scale-chip"
                  onClick={() => handleBulkIncrease(25)}
                  title="Aumentar todos los topes un 25%"
                >
                  +25%
                </button>
              </div>

              <button type="button" className="btn-save-admin" onClick={handleSave}>
                💾 Guardar Escalas en Caliente
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Tope Anual (ARS)</th>
                  <th>Promedio Mensual (Calculado)</th>
                  <th>Formato Visual</th>
                </tr>
              </thead>
              <tbody>
                {editableScales.map((item) => (
                  <tr key={item.category}>
                    <td>
                      <span className="scale-cat-badge">
                        Categoría {item.category}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="admin-scale-input"
                        data-testid={`scale-input-${item.category}`}
                        value={item.max_annual_billing}
                        onChange={(e) => handleScaleChange(item.category, e.target.value)}
                      />
                    </td>
                    <td>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                        {formatCurrencyARS(item.max_monthly_average)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>
                        {formatCurrencyARS(item.max_annual_billing)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección 2: Usuarios y Suscripciones */}
      {activeTab === 'users' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Gestión de Usuarios y Estado de Suscripción</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Administra permisos, roles y estados de cuenta comercial
              </p>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, email o rol..."
              className="admin-search-input"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado de Suscripción</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className="admin-user-avatar">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <strong>{u.full_name}</strong>
                        </div>
                      </td>
                      <td><code>{u.email}</code></td>
                      <td>
                        <span className={`admin-role-badge role-${u.role}`}>
                          {u.role === 'client' ? 'Comercio' : u.role === 'accountant' ? 'Contador' : 'SuperAdmin'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="admin-sub-select"
                          data-testid={`sub-select-${u.id}`}
                          value={u.subscription_status}
                          onChange={(e) => handleSubChange(u.id, e.target.value)}
                        >
                          <option value="active">Activo (Al día)</option>
                          <option value="trial">Período de Prueba</option>
                          <option value="past_due">Suspendido / Pago Pendiente</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

