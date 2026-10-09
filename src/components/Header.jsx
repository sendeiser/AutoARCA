/**
 * Componente Header — Barra Superior de AutoARCA
 * Diseñado con estética Apple macOS / iOS:
 * - Altura ultra-compacta para maximizar espacio útil en viewport
 * - Indicadores vivos de estado (Supabase Cloud Sync, Audio háptico)
 * - Conmutador de rol rápido y perfil de usuario
 */

import React from 'react';
import { AppleLogoIcon, CloudSyncIcon, VolumeOnIcon, VolumeOffIcon, PlusIcon, LogoutIcon, SunIcon, MoonIcon } from './Icons.jsx';
import { soundService } from '../services/soundService.js';
import '../styles/header.css';

export default function Header({
  role = 'client',
  currentUser = null,
  theme = 'dark',
  onToggleTheme,
  soundEnabled = true,
  onToggleSound,
  onRoleChange,
  onOpenSupabaseModal,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onBrandClick
}) {
  return (
    <header className="app-shell-navbar">
      {/* Zona Izquierda: Marca y Logo */}
      <div className="navbar-left">
        <button
          type="button"
          className="app-brand"
          onClick={() => {
            soundService.playKeyTap();
            if (onBrandClick) onBrandClick();
          }}
          aria-label="Ir a la vista principal"
        >
          <AppleLogoIcon size={18} />
          <span className="brand-title">AutoARCA</span>
          <span className="brand-apple-badge">PRO</span>
        </button>
      </div>

      {/* Zona Derecha: Controles de Sistema, Modo Claro/Oscuro, Sonido, Rol Directo y Perfil */}
      <div className="app-user-controls">
        {/* Conmutador de Modo Claro / Modo Oscuro */}
        <button
          type="button"
          className="theme-toggle-btn"
          data-testid="theme-toggle-btn"
          onClick={() => {
            soundService.playKeyTap();
            if (onToggleTheme) onToggleTheme();
          }}
          title={theme === 'light' ? 'Cambiar a Modo Oscuro (OLED)' : 'Cambiar a Modo Claro (Luz de día)'}
          aria-label="Alternar tema claro y oscuro"
        >
          {theme === 'light' ? <MoonIcon size={14} /> : <SunIcon size={14} />}
          <span className="control-label-desktop">{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
        </button>

        {/* Píldora de Sincronización Supabase Cloud en Vivo */}
        <button
          type="button"
          className="supabase-cloud-pill"
          onClick={() => {
            soundService.playKeyTap();
            if (onOpenSupabaseModal) onOpenSupabaseModal();
          }}
          title="Estado en vivo de base de datos Supabase PostgreSQL"
          aria-label="Estado Supabase Cloud"
        >
          <span className="live-pulse-dot" />
          <CloudSyncIcon size={14} />
          <span className="control-label-desktop">Supabase DB</span>
          <span className="control-label-mobile">DB</span>
        </button>

        {/* Toggle de Audio Háptico / Táctil */}
        <button
          type="button"
          className={`sound-toggle-btn ${!soundEnabled ? 'muted' : ''}`}
          onClick={() => {
            if (onToggleSound) onToggleSound();
          }}
          title={soundEnabled ? 'Desactivar efectos de audio táctil' : 'Activar efectos de audio táctil'}
          aria-label="Alternar sonido"
        >
          {soundEnabled ? <VolumeOnIcon size={14} /> : <VolumeOffIcon size={14} />}
          <span className="control-label-desktop">{soundEnabled ? 'Audio' : 'Silencio'}</span>
        </button>

        {/* Selector Directo de Rol Segmentado (Sin acordeón ni desplegables) */}
        <div className="role-switcher-wrap">
          <div className="role-switcher-segmented" role="tablist" aria-label="Cambiar cuenta">
            <button
              type="button"
              className={`role-seg-btn ${role === 'client' ? 'active' : ''}`}
              onClick={() => {
                soundService.playKeyTap();
                if (onRoleChange) onRoleChange('client');
              }}
              data-testid="role-pill-client"
              role="tab"
              aria-selected={role === 'client'}
              title="Ir a cuenta Comercio / Monotributo"
            >
              <span className="role-seg-icon">👤</span>
              <span className="role-seg-text">Cliente</span>
            </button>

            <button
              type="button"
              className={`role-seg-btn ${role === 'accountant' ? 'active' : ''}`}
              onClick={() => {
                soundService.playKeyTap();
                if (onRoleChange) onRoleChange('accountant');
              }}
              data-testid="role-pill-accountant"
              role="tab"
              aria-selected={role === 'accountant'}
              title="Ir a cuenta Estudio Contable"
            >
              <span className="role-seg-icon">📑</span>
              <span className="role-seg-text">Contador</span>
            </button>

            <button
              type="button"
              className={`role-seg-btn ${role === 'superadmin' ? 'active' : ''}`}
              onClick={() => {
                soundService.playKeyTap();
                if (onRoleChange) onRoleChange('superadmin');
              }}
              data-testid="role-pill-superadmin"
              role="tab"
              aria-selected={role === 'superadmin'}
              title="Ir a cuenta SuperAdmin"
            >
              <span className="role-seg-icon">👑</span>
              <span className="role-seg-text">Admin</span>
            </button>
          </div>

          {/* Select sincronizado para accesibilidad y tests automatizados */}
          <select
            data-testid="role-switcher-select"
            className="role-switcher-select-sr-only"
            value={role}
            onChange={(e) => {
              if (onRoleChange) onRoleChange(e.target.value);
            }}
            aria-label="Seleccionar rol activo"
            tabIndex={-1}
          >
            <option value="client">👤 Cliente</option>
            <option value="accountant">📑 Contador</option>
            <option value="superadmin">👑 Admin</option>
          </select>
        </div>

        {/* Chip de Perfil de Usuario o Botón de Ingreso */}
        {currentUser ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className="user-profile-chip"
              onClick={() => {
                soundService.playKeyTap();
                if (onOpenProfile) onOpenProfile();
              }}
              title={`Perfil de ${currentUser.full_name || 'Usuario'}`}
              aria-label="Abrir perfil de usuario"
            >
              <div className="user-chip-avatar">
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div className="user-chip-name">
                {currentUser.full_name || 'Mi Cuenta'}
              </div>
            </button>

            <button
              type="button"
              className="header-logout-btn"
              data-testid="header-logout-btn"
              onClick={() => {
                soundService.playKeyTap();
                if (onLogout) onLogout();
              }}
              title="Cerrar sesión y volver al ingreso"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon size={14} />
              <span className="control-label-desktop">Salir</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-open-auth"
            onClick={() => {
              soundService.playKeyTap();
              if (onOpenAuth) onOpenAuth();
            }}
            aria-label="Iniciar sesión o registrarse"
          >
            <PlusIcon size={14} />
            <span className="control-label-desktop">Ingresar</span>
          </button>
        )}
      </div>
    </header>
  );
}
