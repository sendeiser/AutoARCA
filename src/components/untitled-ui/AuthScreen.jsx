/**
 * Untitled UI — Full Auth Screen (Split Screen Layout)
 * https://www.untitledui.com/react/components/login-and-sign-up
 * Sistema completo de Login y Registro de usuarios con roles independientes
 */

import React, { useState } from 'react';
import Button from './Button.jsx';
import InputField from './InputField.jsx';
import Badge from './Badge.jsx';
import { AppleLogoIcon, BoltIcon, CheckCircleIcon } from '../Icons.jsx';
import { authService, INITIAL_SCALES } from '../../services/authService.js';
import { soundService } from '../../services/soundService.js';
import '../../styles/untitled-ui.css';

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regRole, setRegRole] = useState('client'); // 'client' | 'accountant'
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCuit, setRegCuit] = useState('');
  const [regFantasyName, setRegFantasyName] = useState('');
  const [regCategory, setRegCategory] = useState('D');
  const [regActivityType, setRegActivityType] = useState('products');
  const [regAccountantCode, setRegAccountantCode] = useState('');

  // Contador specific fields
  const [regMatricula, setRegMatricula] = useState('');
  const [regJurisdiccion, setRegJurisdiccion] = useState('CPCECABA');

  // Handle Login Submit
  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      soundService.playKeyTap();
      const user = authService.login(loginEmail, loginPassword);
      soundService.playSuccessChime();
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      soundService.playWarning();
      setErrorMsg(err.message || 'Credenciales inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      soundService.playKeyTap();
      if (!regFullName || !regEmail || !regPassword) {
        throw new Error('Por favor completa todos los campos obligatorios.');
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
        password: regPassword,
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

      soundService.playSuccessChime();
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      soundService.playWarning();
      setErrorMsg(err.message || 'Error en el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleDemoLogin = (email, pass) => {
    soundService.playKeyTap();
    setIsLoading(true);
    try {
      const user = authService.login(email, pass);
      soundService.playSuccessChime();
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="uui-auth-container">
      {/* Lado Izquierdo: Formulario de Autenticación */}
      <div className="uui-auth-left">
        <div className="uui-auth-box">
          {/* Header con Marca y Badge */}
          <div className="uui-auth-header">
            <div className="uui-auth-logo-badge">
              <AppleLogoIcon size={24} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                AutoARCA
              </span>
              <Badge variant="brand" hasDot={true}>
                SaaS v1.0
              </Badge>
            </div>
            <h1 className="uui-auth-title">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h1>
            <p className="uui-auth-subtitle">
              {mode === 'login'
                ? 'Ingresa tus credenciales para acceder a tu panel de control.'
                : 'Empieza gratis y gestiona tu facturación y monotributo en minutos.'}
            </p>
          </div>

          {/* Segmented Control de Modo (Iniciar Sesión vs Registrarse) */}
          <div className="uui-auth-segmented" role="tablist">
            <button
              type="button"
              className={`uui-auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setMode('login'); setErrorMsg(''); }}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`uui-auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setMode('register'); setErrorMsg(''); }}
              role="tab"
              aria-selected={mode === 'register'}
            >
              Registrarse
            </button>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
              {errorMsg}
            </div>
          )}

          {/* 1. Formulario de Inicio de Sesión */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <InputField
                label="Correo Electrónico"
                type="email"
                placeholder="correo@ejemplo.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />

              <InputField
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                isPasswordToggle={true}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isBlock={true}
                isLoading={isLoading}
              >
                Ingresar al Sistema ⚡
              </Button>

              {/* Accesos Rápidos Demo 1-Click */}
              <div className="uui-demo-section">
                <div className="uui-demo-label">Accesos Rápidos Demo (1 Click)</div>
                <div className="uui-demo-buttons">
                  <button
                    type="button"
                    className="uui-demo-btn"
                    onClick={() => handleDemoLogin('martin@comercio.com', '1234')}
                  >
                    👤 Cliente
                  </button>
                  <button
                    type="button"
                    className="uui-demo-btn"
                    onClick={() => handleDemoLogin('mendez@estudiocontable.com', '1234')}
                  >
                    📑 Contador
                  </button>
                  <button
                    type="button"
                    className="uui-demo-btn"
                    onClick={() => handleDemoLogin('admin@autoarca.com', '1234')}
                  >
                    👑 Admin
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. Formulario de Registro */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tarjetas de Selección de Rol (Untitled UI) */}
              <div className="uui-role-selector">
                <div
                  className={`uui-role-card ${regRole === 'client' ? 'selected' : ''}`}
                  onClick={() => { soundService.playKeyTap(); setRegRole('client'); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="uui-role-icon">🏪</div>
                  <div className="uui-role-title">Comercio / Monotributo</div>
                  <div className="uui-role-desc">Punto de venta y control fiscal</div>
                </div>

                <div
                  className={`uui-role-card ${regRole === 'accountant' ? 'selected' : ''}`}
                  onClick={() => { soundService.playKeyTap(); setRegRole('accountant'); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="uui-role-icon">📊</div>
                  <div className="uui-role-title">Estudio Contable</div>
                  <div className="uui-role-desc">Gestión y lotes multi-cliente</div>
                </div>
              </div>

              <InputField
                label="Nombre Completo o Razón Social"
                type="text"
                placeholder={regRole === 'client' ? 'Ej. Martín González' : 'Ej. Estudio Contable Méndez & Asoc.'}
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <InputField
                  label="Email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
                <InputField
                  label="Contraseña"
                  type="password"
                  placeholder="Mín. 4 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  isPasswordToggle={true}
                  required
                />
              </div>

              {/* Campos específicos para Comercio */}
              {regRole === 'client' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <InputField
                      label="CUIT (11 Dígitos)"
                      type="text"
                      placeholder="20301234567"
                      value={regCuit}
                      onChange={(e) => setRegCuit(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={11}
                    />
                    <InputField
                      label="Nombre de Fantasía"
                      type="text"
                      placeholder="Mi Comercio"
                      value={regFantasyName}
                      onChange={(e) => setRegFantasyName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="uui-input-wrap">
                      <label className="uui-input-label">Categoría Monotributo</label>
                      <select
                        className="uui-input-box"
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

                    <div className="uui-input-wrap">
                      <label className="uui-input-label">Actividad</label>
                      <select
                        className="uui-input-box"
                        value={regActivityType}
                        onChange={(e) => setRegActivityType(e.target.value)}
                      >
                        <option value="products">Venta de Productos</option>
                        <option value="services">Servicios</option>
                        <option value="both">Ambas Actividades</option>
                      </select>
                    </div>
                  </div>

                  <InputField
                    label="Código de tu Contador (Opcional)"
                    type="text"
                    placeholder="Ej. CONT-MENDEZ-9876 o CUIT"
                    value={regAccountantCode}
                    onChange={(e) => setRegAccountantCode(e.target.value)}
                    hint="Si tu contador ya usa AutoARCA, ingrésalo para vincularte de inmediato."
                  />
                </>
              )}

              {/* Campos específicos para Contador */}
              {regRole === 'accountant' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <InputField
                      label="Matrícula Profesional"
                      type="text"
                      placeholder="Ej. T° 142 F° 89"
                      value={regMatricula}
                      onChange={(e) => setRegMatricula(e.target.value)}
                    />
                    <div className="uui-input-wrap">
                      <label className="uui-input-label">Jurisdicción / CPCE</label>
                      <select
                        className="uui-input-box"
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

                  <InputField
                    label="CUIT del Estudio (11 Dígitos)"
                    type="text"
                    placeholder="30712345678"
                    value={regCuit}
                    onChange={(e) => setRegCuit(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={11}
                  />

                  <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: '#c4b5fd', lineHeight: '1.4' }}>
                    🔑 Se creará tu cuenta profesional y se asignará automáticamente tu <strong>Código de Vinculación</strong> para compartir con tus clientes.
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isBlock={true}
                isLoading={isLoading}
              >
                Completar Registro y Empezar 🚀
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Lado Derecho: Showcase Visual Untitled UI */}
      <div className="uui-auth-right">
        <div className="uui-showcase-card">
          <div className="uui-showcase-badge">
            <Badge variant="success" hasDot={true}>
              Cumplimiento Fiscal ARCA
            </Badge>
          </div>
          <h2 className="uui-showcase-title">
            Emisión POS Táctil y Monitoreo de Escalas en Tiempo Real
          </h2>
          <p className="uui-showcase-desc">
            Diseñado para monotributistas que buscan simplicidad y estudios contables que necesitan acceso instantáneo a lotes de facturación consolidados.
          </p>
          <div className="uui-showcase-features">
            <div className="uui-showcase-item">
              <CheckCircleIcon size={16} />
              <span>Semáforo fiscal inteligente contra topes de recategorización</span>
            </div>
            <div className="uui-showcase-item">
              <CheckCircleIcon size={16} />
              <span>Exportación oficial de lotes en formato ARCA (CSV y ZIP masivo)</span>
            </div>
            <div className="uui-showcase-item">
              <CheckCircleIcon size={16} />
              <span>Sincronización híbrida Local-First con Supabase PostgreSQL Cloud</span>
            </div>
            <div className="uui-showcase-item">
              <CheckCircleIcon size={16} />
              <span>Vinculación directa entre el comercio y su contador de confianza</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
