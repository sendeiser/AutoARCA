import React, { useState, useEffect } from 'react';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import {
  TableIcon,
  UserIcon,
  CheckCircleIcon,
  UsersIcon,
  ShieldCheckIcon,
  AlertTriangleIcon
} from './Icons.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { StatCard, StatGrid } from './untitled-ui/StatCard.jsx';
import { SearchInput } from './untitled-ui/SearchInput.jsx';
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
import '../styles/superAdmin.css';
import '../styles/untitled-ui.css';

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
    <div className="admin-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.25rem' }}>
      {/* Cabecera del Panel */}
      <div className="admin-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
            <Badge variant="brand" hasDot={true}>Centro de Comando Maestro</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main, #fff)' }}>
            Panel Global de SuperAdmin
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            Control de Parámetros Impositivos ARCA y Monitoreo SaaS en Tiempo Real
          </p>
        </div>
      </div>

      {/* Global SaaS Platform Metrics Banner con Untitled UI StatCard */}
      <StatGrid>
        <StatCard
          label="Usuarios Registrados"
          value={totalUsersCount}
          icon={<UsersIcon size={18} />}
          caption="Comercios y contadores"
          trend="neutral"
        />
        <StatCard
          label="Suscripciones Activas"
          value={activeSubsCount}
          icon={<ShieldCheckIcon size={18} />}
          caption="Cuentas al día"
          trend="up"
          change="Al día"
        />
        <StatCard
          label="Cuentas Suspendidas"
          value={pastDueSubsCount}
          icon={<AlertTriangleIcon size={18} />}
          caption="Pago pendiente"
          trend={pastDueSubsCount > 0 ? 'down' : 'neutral'}
          change={pastDueSubsCount > 0 ? 'Riesgo' : '0'}
        />
        <StatCard
          label="Escalas Oficiales"
          value={editableScales.length}
          icon={<TableIcon size={18} />}
          caption="Categorías A a K"
          trend="neutral"
          change="Sembradas"
        />
      </StatGrid>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'scales' ? 'active' : ''}`}
          onClick={() => { soundService.playKeyTap(); setActiveTab('scales'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <TableIcon size={15} /> Escalas Oficiales Monotributo
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { soundService.playKeyTap(); setActiveTab('users'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <UserIcon size={15} /> Usuarios y Suscripciones
        </button>
      </div>

      {toastMessage && (
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircleIcon size={16} /> {toastMessage}
        </div>
      )}

      {/* Sección 1: Escalas de Monotributo */}
      {activeTab === 'scales' && (
        <TableContainer>
          <TableToolbar>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main, #fff)' }}>
                Escalas Oficiales de Monotributo (A a K)
              </h2>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Modifica los topes anuales. Las variaciones se aplican en caliente a todos los clientes sin reiniciar el sistema.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Ajuste Inflación:</span>
                <Button variant="secondary" size="sm" onClick={() => handleBulkIncrease(10)}>+10%</Button>
                <Button variant="secondary" size="sm" onClick={() => handleBulkIncrease(15)}>+15%</Button>
                <Button variant="secondary" size="sm" onClick={() => handleBulkIncrease(25)}>+25%</Button>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                iconLeading={<CheckCircleIcon size={16} />}
              >
                Guardar Escalas en Caliente
              </Button>
            </div>
          </TableToolbar>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Tope Anual (ARS)</TableHead>
                <TableHead>Promedio Mensual (Calculado)</TableHead>
                <TableHead>Formato Visual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editableScales.map((item) => (
                <TableRow key={item.category}>
                  <TableCell>
                    <Badge variant="brand">Categoría {item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      className="admin-scale-input"
                      data-testid={`scale-input-${item.category}`}
                      value={item.max_annual_billing}
                      onChange={(e) => handleScaleChange(item.category, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                      {formatCurrencyARS(item.max_monthly_average)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>
                      {formatCurrencyARS(item.max_annual_billing)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Sección 2: Usuarios y Suscripciones */}
      {activeTab === 'users' && (
        <TableContainer>
          <TableToolbar>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main, #fff)' }}>
                Gestión de Usuarios y Estado de Suscripción
              </h2>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Administra permisos, roles y estados de cuenta comercial
              </span>
            </div>
            <SearchInput
              placeholder="Buscar por nombre, email o rol..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
          </TableToolbar>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado de Suscripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="admin-user-avatar">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <strong>{u.full_name}</strong>
                      </div>
                    </TableCell>
                    <TableCell><code>{u.email}</code></TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'client' ? 'brand' : u.role === 'accountant' ? 'purple' : 'gray'}>
                        {u.role === 'client' ? 'Comercio' : u.role === 'accountant' ? 'Contador' : 'SuperAdmin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
