import React, { useState, useEffect } from 'react';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
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

  const handleSave = () => {
    if (onSaveScales) {
      onSaveScales(editableScales);
    }
    setToastMessage('¡Escalas de Monotributo actualizadas en caliente!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSubChange = (userId, newStatus) => {
    if (onUpdateSubscription) {
      onUpdateSubscription(userId, newStatus);
    }
  };

  return (
    <div className="admin-container">
      {/* Cabecera del Panel */}
      <div className="admin-header">
        <div>
          <h1>Panel Global de SuperAdmin</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8' }}>
            Control de Parámetros Impositivos ARCA y Suscripciones SaaS
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'scales' ? 'active' : ''}`}
          onClick={() => setActiveTab('scales')}
        >
          📊 Escalas Oficiales Monotributo
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios y Suscripciones
        </button>
      </div>

      {toastMessage && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#10b981', color: '#fff', borderRadius: '10px', fontWeight: 700 }}>
          {toastMessage}
        </div>
      )}

      {/* Sección 1: Escalas de Monotributo */}
      {activeTab === 'scales' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Escalas Oficiales de Monotributo (A a K)</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Modifica los topes anuales. Las variaciones se aplican en tiempo real a todos los clientes sin reiniciar el sistema.
              </p>
            </div>
            <button type="button" className="btn-save-admin" onClick={handleSave}>
              💾 Guardar Escalas en Caliente
            </button>
          </div>

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
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38bdf8' }}>
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
      )}

      {/* Sección 2: Usuarios y Suscripciones */}
      {activeTab === 'users' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Gestión de Usuarios y Estado de Suscripción</h2>
          </div>

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
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td><code>{u.email}</code></td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                      {u.role}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
