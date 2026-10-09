import React, { useState } from 'react';
import { authService, INITIAL_SCALES } from '../services/authService.js';
import '../styles/auth.css';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [errorMsg, setErrorMsg] = useState('');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('client');
  const [regCuit, setRegCuit] = useState('');
  const [regFantasyName, setRegFantasyName] = useState('');
  const [regCategory, setRegCategory] = useState('D');
  const [regActivityType, setRegActivityType] = useState('products');
  const [regMatricula, setRegMatricula] = useState('');
  const [regJurisdiccion, setRegJurisdiccion] = useState('CPCECABA');
  const [regAccountantCode, setRegAccountantCode] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const user = authService.login(loginEmail, loginPassword);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (!regFullName || !regEmail) {
        setErrorMsg('Por favor completa los campos obligatorios.');
        return;
      }

      let assignedAccountantId = null;
      if (regRole === 'client' && regAccountantCode.trim()) {
        const foundAcc = authService.findAccountant(regAccountantCode.trim());
        if (foundAcc) {
          assignedAccountantId = foundAcc.id;
        }
      }

      const user = authService.register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword || '1234',
        role: regRole,
        phone: regPhone,
        cuit: regCuit,
        fantasyName: regFantasyName,
        monotributoCategory: regCategory,
        activityType: regActivityType,
        matricula: regMatricula,
        jurisdiccion: regJurisdiccion,
        accountantId: assignedAccountantId
      });
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleQuickDemoLogin = (email, pass) => {
    try {
      const user = authService.login(email, pass);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* Cabecera */}
        <div className="auth-header">
          <div className="auth-brand-logo">⚡</div>
          <h2 className="auth-title">AutoARCA</h2>
          <p className="auth-subtitle">
            Plataforma Cloud para Monotributistas y Estudios Contables
          </p>
        </div>

        {/* Selector de Pestaña */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMsg(''); }}
          >
            Crear Cuenta
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Formulario de Login */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="auth-form-group">
              <label className="auth-label">Correo Electrónico</label>
              <input
                type="email"
                className="auth-input"
                placeholder="ejemplo@comercio.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Contraseña</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn-primary">
              Ingresar al Sistema 🚀
            </button>

            {/* Accesos Rápidos de Prueba */}
            <div className="auth-demo-section">
              <div className="auth-demo-title">Accesos Rápidos Demo (1 Click)</div>
              <div className="auth-demo-chips">
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('martin@comercio.com', '1234')}
                >
                  👤 Martín (Cliente Monotributo)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('mendez@estudiocontable.com', '1234')}
                >
                  📑 Estudio Méndez (Contador)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('admin@autoarca.com', '1234')}
                >
                  👑 SuperAdmin (Global)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Formulario de Registro */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="auth-form-group">
              <label className="auth-label">Tipo de Cuenta</label>
              <div className="role-switcher-segmented" style={{ width: '100%', display: 'flex' }} role="tablist">
                <button
                  type="button"
                  className={`role-seg-btn ${regRole === 'client' ? 'active' : ''}`}
                  onClick={() => setRegRole('client')}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.45rem' }}
                  role="tab"
                  aria-selected={regRole === 'client'}
                >
                  🏪 Comercio / Monotributo
                </button>
                <button
                  type="button"
                  className={`role-seg-btn ${regRole === 'accountant' ? 'active' : ''}`}
                  onClick={() => setRegRole('accountant')}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.45rem' }}
                  role="tab"
                  aria-selected={regRole === 'accountant'}
                >
                  📊 Estudio Contable
                </button>
              </div>
              <select
                className="role-switcher-select-sr-only"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <option value="client">Comercio / Profesional Monotributista</option>
                <option value="accountant">Estudio Contable / Contador</option>
              </select>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Nombre Completo o Razón Social</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Ej. Martín González"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="auth-form-group">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="correo@ejemplo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Contraseña</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Mín. 4 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campos Específicos para Contador */}
            {regRole === 'accountant' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                  <div className="auth-form-group">
                    <label className="auth-label">Matrícula Profesional</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Ej. T° 142 F° 89"
                      value={regMatricula}
                      onChange={(e) => setRegMatricula(e.target.value)}
                    />
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-label">Consejo / Jurisdicción</label>
                    <select
                      className="auth-select"
                      value={regJurisdiccion}
                      onChange={(e) => setRegJurisdiccion(e.target.value)}
                    >
                      <option value="CPCECABA">CPCECABA (CABA)</option>
                      <option value="CPCEBA">CPCEBA (Bs. As.)</option>
                      <option value="CPCESFE">CPCESFE (Santa Fe)</option>
                      <option value="CPCECBA">CPCECBA (Córdoba)</option>
                      <option value="OTRA">Otro Consejo</option>
                    </select>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">CUIT del Estudio / Profesional</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="30712345678 (11 dígitos)"
                    value={regCuit}
                    onChange={(e) => setRegCuit(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={11}
                  />
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#bae6fd', marginBottom: '1rem', lineHeight: '1.4' }}>
                  🛡️ <strong>Portal Profesional:</strong> Se generará automáticamente tu <strong>Código de Vinculación</strong> para que tus clientes te autoricen la descarga diaria de comprobantes ARCA.
                </div>
              </>
            )}

            {/* Campos Fiscales para Comercios */}
            {regRole === 'client' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="auth-form-group">
                    <label className="auth-label">CUIT (11 Dígitos)</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="20301234567"
                      value={regCuit}
                      onChange={(e) => setRegCuit(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={11}
                    />
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-label">Nombre de Fantasía</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Mi Tienda"
                      value={regFantasyName}
                      onChange={(e) => setRegFantasyName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="auth-form-group">
                    <label className="auth-label">Categoría Monotributo</label>
                    <select
                      className="auth-select"
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                    >
                      {INITIAL_SCALES.map((s) => (
                        <option key={s.category} value={s.category}>
                          Cat. {s.category} (${(s.max_annual_billing / 1000000).toFixed(1)}M anual)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-label">Actividad Principal</label>
                    <select
                      className="auth-select"
                      value={regActivityType}
                      onChange={(e) => setRegActivityType(e.target.value)}
                    >
                      <option value="products">Venta de Productos</option>
                      <option value="services">Servicios</option>
                      <option value="both">Ambas Actividades</option>
                    </select>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Código de tu Contador (Opcional)</label>
                  <input
                    type="text"
                    className="auth-input font-mono"
                    placeholder="Ej. CONT-MENDEZ-9876 o CUIT de tu contador"
                    value={regAccountantCode}
                    onChange={(e) => setRegAccountantCode(e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Si tu contador te dio su código, ingrésalo para vincularte a su estudio automáticamente.
                  </span>
                </div>
              </>
            )}

            <button type="submit" className="auth-btn-primary">
              Completar Registro y Empezar ⚡
            </button>
          </form>
        )}

        {onClose && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Continuar como invitado / Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
