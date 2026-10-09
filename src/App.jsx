import React, { useState, useMemo } from 'react';
import PosTerminal from './components/PosTerminal.jsx';
import ClientDashboard from './components/ClientDashboard.jsx';
import AccountantPortal from './components/AccountantPortal.jsx';
import SuperAdminDashboard from './components/SuperAdminDashboard.jsx';
import { calculateCategoryConsumption } from './services/taxAlertEngine.js';
import { recordSaleReceipt, closeDailyBatch } from './services/salesBatchService.js';
import { INITIAL_SCALES, INITIAL_USERS, INITIAL_BUSINESS } from './services/authService.js';
import './index.css';

export default function App() {
  const [role, setRole] = useState('client');
  const [clientView, setClientView] = useState('pos');
  const [scales, setScales] = useState(INITIAL_SCALES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [businessProfile, setBusinessProfile] = useState(INITIAL_BUSINESS);
  const [pendingSales, setPendingSales] = useState([
    {
      id: 'demo-s1',
      receipt_number: 1,
      amount: 4500,
      payment_method: 'cash',
      customer_doc_type: 'SIN_IDENTIFICAR',
      customer_doc_number: '0',
      customer_name: 'Consumidor Final',
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: 'demo-s2',
      receipt_number: 2,
      amount: 12500,
      payment_method: 'transfer',
      customer_doc_type: 'SIN_IDENTIFICAR',
      customer_doc_number: '0',
      customer_name: 'Consumidor Final',
      date: new Date().toISOString().slice(0, 10)
    }
  ]);
  const [batchHistory, setBatchHistory] = useState([]);

  // Usuario cliente actual
  const currentClientUser = useMemo(() => {
    return users.find((u) => u.id === 'client-1') || users[0];
  }, [users]);

  // Escala impositiva activa del comercio
  const currentScale = useMemo(() => {
    return scales.find((s) => s.category === businessProfile.monotributo_category) || scales[0];
  }, [scales, businessProfile]);

  // Total acumulado del mes y anual
  const currentMonthSales = useMemo(() => {
    return pendingSales.reduce((acc, s) => acc + Number(s.amount || 0), 0) + 420000;
  }, [pendingSales]);

  // Métricas del semáforo impositivo
  const taxMetrics = useMemo(() => {
    const today = new Date();
    return calculateCategoryConsumption({
      currentMonthSales,
      rolling12mSales: 6850000,
      categoryScale: currentScale,
      dayOfMonth: today.getDate() || 9,
      totalDaysInMonth: 30
    });
  }, [currentMonthSales, currentScale]);

  // Registro de venta en el POS
  const handleRecordSale = async (receiptData) => {
    const newReceipt = await recordSaleReceipt(receiptData, {
      profile: currentClientUser,
      businessProfile
    });
    setPendingSales((prev) => [...prev, newReceipt]);
    return newReceipt;
  };

  // Cierre de jornada diario
  const handleCloseBatch = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const batch = await closeDailyBatch(businessProfile.id, today, 'manual', {
      businessProfile,
      accountantEmail: 'mendez@estudiocontable.com'
    });
    setBatchHistory((prev) => [batch, ...prev]);
    setPendingSales([]);
    return batch;
  };

  // Guardar escalas en SuperAdmin
  const handleSaveScales = (updatedScales) => {
    setScales(updatedScales);
  };

  // Actualizar suscripción en SuperAdmin
  const handleUpdateSubscription = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, subscription_status: newStatus } : u))
    );
  };

  // Preparar clientes para el portal del contador
  const accountantClientsList = useMemo(() => {
    return [
      {
        id: businessProfile.id,
        cuit: businessProfile.cuit,
        razon_social: businessProfile.razon_social,
        fantasy_name: businessProfile.fantasy_name,
        monotributo_category: businessProfile.monotributo_category,
        trafficColor: taxMetrics.trafficLight.color,
        todayBatch: batchHistory[0] || (pendingSales.length > 0 ? {
          id: 'preview-batch',
          filename: `comprobantes_arca_${businessProfile.cuit}_hoy.csv`,
          file_content_arca: 'Fecha;TipoCbte...',
          total_amount: pendingSales.reduce((a, s) => a + Number(s.amount || 0), 0),
          total_sales_count: pendingSales.length
        } : null)
      },
      {
        id: 'biz-2',
        cuit: '27289876543',
        razon_social: 'Dra. Laura Gomez',
        fantasy_name: 'Consultorio Odontológico',
        monotributo_category: 'E',
        trafficColor: 'yellow',
        todayBatch: null
      }
    ];
  }, [businessProfile, taxMetrics, batchHistory, pendingSales]);

  const isClientSuspended =
    currentClientUser.subscription_status === 'past_due' ||
    currentClientUser.subscription_status === 'cancelled';

  return (
    <div>
      {/* Barra de Navegación Principal */}
      <header className="app-shell-navbar">
        <div className="app-brand">
          <span>⚡</span> AutoARCA
        </div>

        {/* Pestañas de Navegación para el rol cliente */}
        {role === 'client' && !isClientSuspended && (
          <nav className="app-nav-tabs">
            <button
              type="button"
              className={`app-nav-btn ${clientView === 'pos' ? 'active' : ''}`}
              onClick={() => setClientView('pos')}
            >
              Terminal POS
            </button>
            <button
              type="button"
              className={`app-nav-btn ${clientView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setClientView('dashboard')}
            >
              Dashboard Fiscal
            </button>
          </nav>
        )}

        {/* Conmutador de Rol para Demostración y Prueba */}
        <div className="app-user-controls">
          <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rol:</label>
          <select
            data-testid="role-switcher-select"
            className="role-switcher-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="client">👤 Cliente (Comercio)</option>
            <option value="accountant">📑 Contador (Estudio)</option>
            <option value="superadmin">👑 SuperAdmin (Global)</option>
          </select>
        </div>
      </header>

      {/* Contenido Dinámico según Rol y Estado */}
      <main>
        {role === 'client' && (
          <>
            {isClientSuspended ? (
              <div className="subscription-lock-banner">
                <h3>Suscripción Suspendida</h3>
                <p>Tu cuenta se encuentra temporalmente suspendida para emitir comprobantes debido a un pago pendiente.</p>
                <p style={{ fontSize: '0.85rem' }}>Por favor comunícate con soporte para reactivar tu acceso comercial.</p>
              </div>
            ) : clientView === 'pos' ? (
              <PosTerminal
                businessProfile={businessProfile}
                onRecordSale={handleRecordSale}
              />
            ) : (
              <ClientDashboard
                metrics={taxMetrics}
                businessProfile={businessProfile}
                pendingSales={pendingSales}
                batchHistory={batchHistory}
                onCloseBatch={handleCloseBatch}
                onNavigateToPos={() => setClientView('pos')}
              />
            )}
          </>
        )}

        {role === 'accountant' && (
          <AccountantPortal
            clients={accountantClientsList}
            accountantProfile={users.find((u) => u.role === 'accountant')}
          />
        )}

        {role === 'superadmin' && (
          <SuperAdminDashboard
            scales={scales}
            users={users}
            onSaveScales={handleSaveScales}
            onUpdateSubscription={handleUpdateSubscription}
          />
        )}
      </main>
    </div>
  );
}
