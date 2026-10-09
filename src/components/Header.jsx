/**
 * Componente Header — Barra Superior de AutoARCA
 * Diseñado con estética Apple macOS / iOS:
 * - Altura ultra-compacta para maximizar espacio útil en viewport
 * - Indicadores vivos de estado (Supabase Cloud Sync, Audio háptico)
 * - Conmutador de rol rápido y perfil de usuario
 */

import React from 'react';
import { AppleLogoIcon, CloudSyncIcon, VolumeOnIcon, VolumeOffIcon, PlusIcon } from './Icons.jsx';
import { soundService } from '../services/soundService.js';
import '../styles/header.css';

export default function Header({
  role = 'client',
  currentUser = null,
  soundEnabled = true,
  onToggleSound,
  onRoleChange,
  onOpenSupabaseModal,
  onOpenProfile,
  onOpenAuth,
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

      {/* Zona Derecha: Controles de Sistema, Sonido, Rol y Perfil */}
      <div className="app-user-controls">
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

        {/* Selector de Rol del Sistema (Cliente, Contador, SuperAdmin) */}
        <div className="role-switcher-wrap">
          <select
            data-testid="role-switcher-select"
            className="role-switcher-select"
            value={role}
            onChange={(e) => {
              if (onRoleChange) onRoleChange(e.target.value);
            }}
            aria-label="Seleccionar rol activo"
          >
            <option value="client">👤 Cliente</option>
            <option value="accountant">📑 Contador</option>
            <option value="superadmin">👑 Admin</option>
          </select>
        </div>

        {/* Chip de Perfil de Usuario o Botón de Ingreso */}
        {currentUser ? (
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
