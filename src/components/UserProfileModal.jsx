import React, { useState } from 'react';
import { authService, INITIAL_SCALES } from '../services/authService.js';
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
    if (status === 'active') return <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Activa (Al día)</span>;
    if (status === 'trial') return <span style={{ color: '#38bdf8', fontWeight: 700 }}>🔵 Período de Prueba</span>;
    return <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴 Suspendida</span>;
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
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
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
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '0.6rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
            ✓ ¡Datos de perfil guardados correctamente!
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
            Cerrar Ventana ✕
          </button>
        </div>
      </div>
    </div>
  );
}
