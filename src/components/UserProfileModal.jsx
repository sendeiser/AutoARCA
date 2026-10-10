import React, { useState } from 'react';
import { authService, INITIAL_SCALES } from '../services/authService.js';
import {
  CheckCircleIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  AlertTriangleIcon
} from './Icons.jsx';
import '../styles/auth.css';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  businessProfile,
  onUserUpdated,
  onLogout
}) {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [fantasyName, setFantasyName] = useState(businessProfile?.fantasy_name || '');
  const [category, setCategory] = useState(businessProfile?.monotributo_category || 'D');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const updatedUser = authService.updateUserProfile(currentUser.id, {
        full_name: fullName,
        phone
      });

      if (businessProfile && currentUser.role === 'client') {
        authService.updateBusinessProfile(businessProfile.id, {
          fantasy_name: fantasyName,
          monotributo_category: category
        });
      }

      setSavedSuccess(true);
      if (onUserUpdated) onUserUpdated(updatedUser);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'client') return 'Comercio / Monotributista';
    if (role === 'accountant') return 'Estudio Contable';
    return 'SuperAdmin Global';
  };

  const getSubBadge = (status) => {
    if (status === 'active') {
      return (
        <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircleIcon size={14} /> Activa (Al día)
        </span>
      );
    }
    if (status === 'trial') {
      return (
        <span style={{ color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheckIcon size={14} /> Período de Prueba
        </span>
      );
    }
    return (
      <span style={{ color: '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <AlertTriangleIcon size={14} /> Suspendida
      </span>
    );
  };

  return (
    <div className="auth-overlay">
      <div className="profile-modal-card">
        {/* Cabecera con Avatar */}
        <div className="profile-avatar-row">
          <div className="profile-avatar-icon">
            {currentUser.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main, #fff)' }}>
              {currentUser.full_name}
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
              {getRoleLabel(currentUser.role)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {currentUser.email}
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <CheckCircleIcon size={15} /> ¡Datos de perfil guardados correctamente!
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="auth-form-group">
            <label className="auth-label">Nombre Completo</label>
            <input
              type="text"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Teléfono de Contacto</label>
            <input
              type="tel"
              className="auth-input"
              placeholder="+54 9 11 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Datos para Clientes */}
          {currentUser.role === 'client' && (
            <>
              <div className="auth-form-group">
                <label className="auth-label">Nombre Comercial de Fantasía</label>
                <input
                  type="text"
                  className="auth-input"
                  value={fantasyName}
                  onChange={(e) => setFantasyName(e.target.value)}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Categoría Monotributo</label>
                <select
                  className="auth-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {INITIAL_SCALES.map((s) => (
                    <option key={s.category} value={s.category}>
                      Categoría {s.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estudio Contable Vinculado */}
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BriefcaseIcon size={13} /> Estudio Contable Asignado
                </div>
                {authService.getAccountantForClient(currentUser.id) ? (
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                    <div style={{ fontWeight: 600 }}>{authService.getAccountantForClient(currentUser.id).full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {authService.getAccountantForClient(currentUser.id).email} · {authService.getAccountantForClient(currentUser.id).matricula || 'Matrícula Verificada'}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Sin contador vinculado actualmente.
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#94a3b8' }}>CUIT:</span>
                  <code>{currentUser.cuit || businessProfile?.cuit}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Estado de Suscripción:</span>
                  {getSubBadge(currentUser.subscription_status)}
                </div>
              </div>
            </>
          )}

          {/* Datos para Contadores */}
          {currentUser.role === 'accountant' && (
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheckIcon size={14} /> Tu Código de Vinculación para Clientes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                  {currentUser.link_code || 'CONT-MENDEZ-9876'}
                </span>
                <button
                  type="button"
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(currentUser.link_code || 'CONT-MENDEZ-9876');
                      alert('¡Código copiado al portapapeles!');
                    }
                  }}
                >
                  Copiar Código
                </button>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                Comparte este código a tus clientes para que te autoricen en sus terminales AutoARCA.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="submit"
              className="auth-btn-primary"
              style={{ flex: 1, margin: 0 }}
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: '0.8rem 1.25rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
