import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import PosTerminal from './components/PosTerminal.jsx';
import ClientDashboard from './components/ClientDashboard.jsx';
import AccountantPortal from './components/AccountantPortal.jsx';
import SuperAdminDashboard from './components/SuperAdminDashboard.jsx';
import AuthModal from './components/AuthModal.jsx';
import UserProfileModal from './components/UserProfileModal.jsx';
import SupabaseStatusModal from './components/SupabaseStatusModal.jsx';
import AccountantLinkModal from './components/AccountantLinkModal.jsx';
import AuthScreen from './components/untitled-ui/AuthScreen.jsx';
import { calculateCategoryConsumption } from './services/taxAlertEngine.js';
import { recordSaleReceipt, closeDailyBatch } from './services/salesBatchService.js';
import { authService, INITIAL_SCALES, INITIAL_USERS, INITIAL_BUSINESS } from './services/authService.js';
import { supabaseDataService } from './services/supabaseDataService.js';
import { soundService } from './services/soundService.js';
import './index.css';

export default function App({ initialUser = null, forceAuthGate = false } = {}) {
  const isTestEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';

  const [currentUser, setCurrentUser] = useState(() => {
    if (forceAuthGate) return null;
    if (initialUser !== null) return initialUser;
    if (isTestEnv) return INITIAL_USERS[0];
    try {
      const session = authService.getCurrentSession();
      if (session) {
        return session.user || session;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [role, setRole] = useState(() => currentUser?.role || 'client');
  const [clientView, setClientView] = useState('pos');
  const [scales, setScales] = useState(INITIAL_SCALES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [businessProfile, setBusinessProfile] = useState(INITIAL_BUSINESS);
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modo de visualización: Claro (Light) / Oscuro (Dark)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('autoarca_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // Sincronizar tema con el atributo data-theme del documento
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('autoarca_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
      if (!forceAuthGate && initialUser === null && !isTestEnv) {
        const session = authService.getCurrentSession();
        if (session) {
          const u = session.user || session;
          setCurrentUser(u);
          setRole(u.role || 'client');
          if (session.business) {
            setBusinessProfile(session.business);
          }
        } else {
          setCurrentUser(null);
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
    setCurrentUser(null);
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

  // Emisión en lote de abonos recurrentes mensuales
  const handleBatchEmitRecurring = async (newSales) => {
    setPendingSales((prev) => [...prev, ...newSales]);
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

  const clientInState = users.find((u) => u.id === (currentUser?.id || 'client-1'));
  const clientUserForCheck =
    currentUser?.role === 'client'
      ? (currentUser.subscription_status === 'past_due' ? currentUser : (clientInState || currentUser))
      : (users.find((u) => u.id === 'client-1') || currentUser);

  const isClientSuspended =
    clientUserForCheck &&
    (clientUserForCheck.subscription_status === 'past_due' ||
     clientUserForCheck.subscription_status === 'cancelled');

  // Pantalla de acceso obligatorio Untitled UI si no hay sesión activa
  if (!currentUser) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="app-shell-root">
      {/* Barra de Navegación Principal estilo Apple macOS / iPadOS */}
      {/* Barra Superior Header */}
      <Header
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onBrandClick={() => setClientView('pos')}
      />

      {/* Navegación Inteligente Adaptativa (Desktop Segmented Control & Mobile Bottom Bar) */}
      <Navbar
        role={role}
        activeTab={clientView}
        onTabChange={(newTab) => setClientView(newTab)}
        isClientSuspended={isClientSuspended}
        badges={{
          posSalesCount: pendingSales.length,
          taxTrafficColor: taxMetrics.trafficLight.color,
          totalClients: accountantClientsList.length,
          totalUsers: users.length
        }}
      />

      {/* Contenido Dinámico según Rol y Estado (Zero-Scroll Adaptive) */}
      <main className={`app-main-content ${role === 'client' && clientView === 'pos' ? 'pos-view-active' : ''}`.trim()}>
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
                onBatchEmitRecurring={handleBatchEmitRecurring}
              />
            )}
          </>
        )}

        {role === 'accountant' && (
          <AccountantPortal
            clients={accountantClientsList}
            accountantProfile={currentUser?.role === 'accountant' ? currentUser : (users.find((u) => u.role === 'accountant') || currentUser)}
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
