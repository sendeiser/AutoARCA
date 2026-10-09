import React, { useState, useMemo, useEffect } from 'react';
import PosTerminal from './components/PosTerminal.jsx';
import ClientDashboard from './components/ClientDashboard.jsx';
import AccountantPortal from './components/AccountantPortal.jsx';
import SuperAdminDashboard from './components/SuperAdminDashboard.jsx';
import AuthModal from './components/AuthModal.jsx';
import UserProfileModal from './components/UserProfileModal.jsx';
import SupabaseStatusModal from './components/SupabaseStatusModal.jsx';
import { BoltIcon, VolumeOnIcon, VolumeOffIcon, PlusIcon, AppleLogoIcon, CloudSyncIcon } from './components/Icons.jsx';
import { calculateCategoryConsumption } from './services/taxAlertEngine.js';
import { recordSaleReceipt, closeDailyBatch } from './services/salesBatchService.js';
import { authService, INITIAL_SCALES, INITIAL_USERS, INITIAL_BUSINESS } from './services/authService.js';
import { supabaseDataService } from './services/supabaseDataService.js';
import { soundService } from './services/soundService.js';
import './index.css';

export default function App() {
  const [role, setRole] = useState('client');
  const [clientView, setClientView] = useState('pos');
  const [scales, setScales] = useState(INITIAL_SCALES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [businessProfile, setBusinessProfile] = useState(INITIAL_BUSINESS);
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
  
  // Modales
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Ventas de demostración
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

  // Cargar sesión persistida al iniciar
  useEffect(() => {
    try {
      const session = authService.getCurrentSession();
      if (session && session.user) {
        setCurrentUser(session.user);
        setRole(session.user.role || 'client');
        if (session.business) {
          setBusinessProfile(session.business);
        }
      }
      const loadedUsers = authService.getUsers();
      if (loadedUsers && loadedUsers.length > 0) {
        setUsers(loadedUsers);
      }

      // Sincronizar escalas oficiales desde Supabase si están disponibles
      supabaseDataService.fetchScales().then((remoteScales) => {
        if (remoteScales && remoteScales.length > 0) {
          setScales(remoteScales);
        }
      }).catch(() => {});
    } catch {
      // Ignorar errores en entornos sin localStorage
    }
  }, []);

  // Sincronizar usuario activo cuando se cambia el rol en el selector
  const handleRoleChange = (newRole) => {
    soundService.playKeyTap();
    setRole(newRole);
    const targetUser = users.find((u) => u.role === newRole) || users[0];
    if (targetUser) {
      setCurrentUser(targetUser);
      authService.switchUser(targetUser.id);
    }
  };

  // Toggle de sonido
  const handleToggleSound = () => {
    const nextState = soundService.toggleSound();
    setSoundEnabled(nextState);
    if (nextState) {
      soundService.playSuccessChime();
    }
  };

  // Login o Registro exitoso
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setRole(user.role || 'client');
    setUsers(authService.getUsers());
    
    // Si es cliente, sincronizar negocio
    const bizList = authService.getBusinesses();
    const userBiz = bizList.find((b) => b.user_id === user.id) || bizList[0];
    if (userBiz) {
      setBusinessProfile(userBiz);
    }
    
    setIsAuthOpen(false);
    soundService.playSuccessChime();
  };

  // Logout
  const handleLogout = () => {
    soundService.playKeyTap();
    authService.logout();
    setIsProfileOpen(false);
    const defaultUser = INITIAL_USERS[0];
    setCurrentUser(defaultUser);
    setRole('client');
    setBusinessProfile(INITIAL_BUSINESS);
  };

  // Actualización de perfil
  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    setUsers(authService.getUsers());
    const bizList = authService.getBusinesses();
    const updatedBiz = bizList.find((b) => b.id === businessProfile.id);
    if (updatedBiz) {
      setBusinessProfile(updatedBiz);
    }
    soundService.playSuccessChime();
  };

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
      profile: currentUser,
      businessProfile
    });
    setPendingSales((prev) => [...prev, newReceipt]);
    return newReceipt;
  };

  // Cierre de jornada diario
  const handleCloseBatch = async () => {
    soundService.playKeyTap();
    const today = new Date().toISOString().slice(0, 10);
    const batch = await closeDailyBatch(businessProfile.id, today, 'manual', {
      businessProfile,
      accountantEmail: 'mendez@estudiocontable.com'
    });
    setBatchHistory((prev) => [batch, ...prev]);
    setPendingSales([]);
    soundService.playSuccessChime();
    return batch;
  };

  // Guardar escalas en SuperAdmin
  const handleSaveScales = (updatedScales) => {
    setScales(updatedScales);
    authService.saveScales(updatedScales);
  };

  // Actualizar suscripción en SuperAdmin
  const handleUpdateSubscription = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, subscription_status: newStatus } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, subscription_status: newStatus }));
    }
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

  const clientUserForCheck = users.find((u) => u.id === 'client-1') || currentUser;
  const isClientSuspended =
    clientUserForCheck.subscription_status === 'past_due' ||
    clientUserForCheck.subscription_status === 'cancelled';

  return (
    <div>
      {/* Barra de Navegación Principal estilo Apple macOS / iPadOS */}
      <header className="app-shell-navbar">
        <div className="navbar-left">
          <div className="app-brand" onClick={() => setClientView('pos')}>
            <AppleLogoIcon size={18} />
            <span>AutoARCA</span>
            <span className="brand-apple-badge">Apple HIG</span>
          </div>
        </div>

        {/* Pestañas de Navegación para el rol cliente */}
        {role === 'client' && !isClientSuspended && (
          <nav className="app-nav-tabs">
            <button
              type="button"
              className={`app-nav-btn ${clientView === 'pos' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setClientView('pos'); }}
            >
              Terminal POS
            </button>
            <button
              type="button"
              className={`app-nav-btn ${clientView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setClientView('dashboard'); }}
            >
              Dashboard Fiscal
            </button>
          </nav>
        )}

        {/* Controles de Usuario, Audio y Rol */}
        <div className="app-user-controls">
          {/* Supabase Cloud Live Sync Pill */}
          <button
            type="button"
            className="supabase-cloud-pill"
            onClick={() => { soundService.playKeyTap(); setIsSupabaseModalOpen(true); }}
            title="Ver estado de base de datos Supabase PostgreSQL y auto-sync"
          >
            <span className="live-pulse-dot" />
            <CloudSyncIcon size={14} />
            <span className="control-label-desktop">Supabase DB</span>
            <span className="control-label-mobile">DB</span>
          </button>

          {/* Audio Toggle */}
          <button
            type="button"
            className={`sound-toggle-btn ${!soundEnabled ? 'muted' : ''}`}
            onClick={handleToggleSound}
            title={soundEnabled ? 'Desactivar efectos de audio táctil' : 'Activar efectos de audio táctil'}
          >
            {soundEnabled ? <VolumeOnIcon size={15} /> : <VolumeOffIcon size={15} />}
            <span className="control-label-desktop">{soundEnabled ? 'Audio' : 'Silencio'}</span>
          </button>

          {/* Selector de Rol */}
          <select
            data-testid="role-switcher-select"
            className="role-switcher-select"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="client">👤 Cliente</option>
            <option value="accountant">📑 Contador</option>
            <option value="superadmin">👑 Admin</option>
          </select>

          {/* Chip de Perfil o Botón de Auth */}
          {currentUser ? (
            <div
              className="user-profile-chip"
              onClick={() => { soundService.playKeyTap(); setIsProfileOpen(true); }}
              title="Ver y editar perfil de usuario"
            >
              <div className="user-chip-avatar">
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div className="user-chip-name">
                {currentUser.full_name || 'Mi Cuenta'}
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-open-auth"
              onClick={() => { soundService.playKeyTap(); setIsAuthOpen(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusIcon size={15} /> <span className="control-label-desktop">Ingresar</span>
            </button>
          )}
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
                onNavigateToPos={() => { soundService.playKeyTap(); setClientView('pos'); }}
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

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Modal de Perfil de Usuario */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        businessProfile={businessProfile}
        onUserUpdated={handleUserUpdated}
        onLogout={handleLogout}
      />

      {/* Modal de Estado de Supabase Database */}
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
