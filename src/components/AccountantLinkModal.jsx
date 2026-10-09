/**
 * Modal de Vinculación Profesional Contador <-> Clientes (AutoARCA)
 * Permite a los estudios contables:
 * 1. Visualizar y copiar su código único de vinculación (para compartir a clientes)
 * 2. Vincular nuevos clientes por CUIT o Email
 * 3. Gestionar y desvincular clientes de su cartera profesional
 */

import React, { useState } from 'react';
import {
  LinkIcon,
  CopyIcon,
  CheckCircleIcon,
  SearchIcon,
  PlusIcon,
  UsersIcon,
  BriefcaseIcon
} from './Icons.jsx';
import { authService } from '../services/authService.js';
import { supabaseDataService } from '../services/supabaseDataService.js';
import { soundService } from '../services/soundService.js';
import '../styles/accountantLinkModal.css';

export default function AccountantLinkModal({
  isOpen,
  onClose,
  accountantUser = null,
  onClientsUpdated
}) {
  const [tab, setTab] = useState('link-new'); // 'link-new' | 'share-code' | 'manage'
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuitInput, setCuitInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentAccountant = accountantUser || authService.getAccountants()[0] || {
    id: 'accountant-1',
    full_name: 'Estudio Contable Méndez & Asoc.',
    link_code: 'CONT-MENDEZ-9876',
    email: 'mendez@estudiocontable.com'
  };

  const linkCode = currentAccountant.link_code || `CONT-${currentAccountant.id.slice(0, 6).toUpperCase()}`;

  // Copiar código al portapapeles
  const handleCopyCode = () => {
    soundService.playKeyTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(linkCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Compartir mensaje de vinculación
  const handleShareInvite = () => {
    soundService.playKeyTap();
    const inviteText = `Hola! Para vincular tu comercio al ${currentAccountant.full_name} en AutoARCA, ingresa este Código de Contador en tu perfil: ${linkCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteText);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Vincular cliente por CUIT o Email
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const cleanCuit = cuitInput.replace(/[^0-9]/g, '');
      const cleanEmail = emailInput.trim().toLowerCase();

      if (!cleanCuit && !cleanEmail) {
        throw new Error('Ingresa un CUIT o Correo Electrónico del cliente');
      }

      const allUsers = authService.getUsers();
      let targetClient = allUsers.find((u) => {
        if (u.role !== 'client') return false;
        const matchCuit = cleanCuit && u.cuit && u.cuit.includes(cleanCuit);
        const matchEmail = cleanEmail && u.email && u.email.toLowerCase() === cleanEmail;
        return matchCuit || matchEmail;
      });

      // Si no existe, crearlo como cliente borrador
      if (!targetClient) {
        targetClient = authService.register({
          fullName: `Cliente CUIT ${cleanCuit || 'Nuevo'}`,
          email: cleanEmail || `cliente_${cleanCuit || Date.now()}@autoarca.com`,
          password: '1234',
          role: 'client',
          cuit: cleanCuit || '20000000001',
          accountantId: currentAccountant.id
        });
      } else {
        authService.linkClientToAccountant(targetClient.id, currentAccountant.id);
      }

      // Sincronizar con Supabase si está disponible
      supabaseDataService.updateClientAccountant(targetClient.id, currentAccountant.id).catch(() => {});

      soundService.playSuccessChime();
      setSuccessMsg(`¡Cliente ${targetClient.full_name} vinculado exitosamente a tu estudio!`);
      setCuitInput('');
      setEmailInput('');

      if (onClientsUpdated) onClientsUpdated();
    } catch (err) {
      soundService.playWarning();
      setErrorMsg(err.message || 'Error al vincular cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clientes actualmente asignados
  const linkedClients = authService.getClientsForAccountant(currentAccountant.id);

  const handleUnlink = (clientId) => {
    soundService.playKeyTap();
    if (confirm('¿Deseas desvincular este cliente de tu estudio contable?')) {
      authService.unlinkClientFromAccountant(clientId);
      supabaseDataService.updateClientAccountant(clientId, null).catch(() => {});
      if (onClientsUpdated) onClientsUpdated();
      soundService.playSuccessChime();
    }
  };

  return (
    <div className="accountant-link-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="accountant-link-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className="accountant-link-header">
          <div className="accountant-link-title-group">
            <div className="accountant-link-bubble">
              <LinkIcon size={20} />
            </div>
            <div>
              <h3 className="accountant-link-title">Vinculación de Clientes</h3>
              <p className="accountant-link-subtitle">
                {currentAccountant.full_name} · Matrícula: {currentAccountant.matricula || 'Activa'}
              </p>
            </div>
          </div>
          <button className="accountant-link-btn-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        {/* Selector de Pestañas del Modal */}
        <div className="accountant-link-tabs">
          <button
            type="button"
            className={`accountant-tab-btn ${tab === 'link-new' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setTab('link-new'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <PlusIcon size={14} /> Vincular por CUIT / Email
          </button>
          <button
            type="button"
            className={`accountant-tab-btn ${tab === 'share-code' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setTab('share-code'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <CopyIcon size={14} /> Código de Invitación
          </button>
          <button
            type="button"
            className={`accountant-tab-btn ${tab === 'manage' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setTab('manage'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <UsersIcon size={14} /> Clientes Vinculados ({linkedClients.length})
          </button>
        </div>

        <div className="accountant-link-body">
          {errorMsg && <div className="accountant-link-alert error">{errorMsg}</div>}
          {successMsg && <div className="accountant-link-alert success">{successMsg}</div>}

          {/* Pestaña 1: Vincular Nuevo Cliente */}
          {tab === 'link-new' && (
            <form onSubmit={handleLinkSubmit} className="accountant-link-form">
              <p className="accountant-form-desc">
                Ingresa el CUIT comercial o correo electrónico del cliente para asociarlo a tu panel de control y acceder a sus lotes diarios de ARCA.
              </p>

              <div className="accountant-form-row">
                <div className="accountant-form-group">
                  <label className="accountant-form-label">CUIT del Comercio (11 Dígitos)</label>
                  <input
                    type="text"
                    className="accountant-form-input"
                    placeholder="Ej. 20301234567"
                    value={cuitInput}
                    onChange={(e) => setCuitInput(e.target.value)}
                    maxLength={11}
                  />
                </div>
                <div className="accountant-form-group">
                  <label className="accountant-form-label">Email del Cliente (Opcional)</label>
                  <input
                    type="email"
                    className="accountant-form-input"
                    placeholder="cliente@comercio.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="accountant-btn-primary"
                disabled={isSubmitting}
              >
                <LinkIcon size={15} />
                <span>{isSubmitting ? 'Vinculando...' : 'Asociar Comercio a mi Estudio'}</span>
              </button>
            </form>
          )}

          {/* Pestaña 2: Compartir Código de Invitación */}
          {tab === 'share-code' && (
            <div className="accountant-code-card">
              <p className="accountant-code-desc">
                Tus clientes pueden vincularse directamente ingresando este código en su perfil de AutoARCA:
              </p>
              <div className="accountant-code-box">
                <span className="accountant-code-badge font-mono">{linkCode}</span>
                <button
                  type="button"
                  className="accountant-btn-copy"
                  onClick={handleCopyCode}
                >
                  <CopyIcon size={14} />
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="accountant-invite-action">
                <button
                  type="button"
                  className="accountant-btn-secondary"
                  onClick={handleShareInvite}
                >
                  <span>Copiar Mensaje para WhatsApp / Email</span>
                </button>
              </div>
            </div>
          )}

          {/* Pestaña 3: Gestión de Clientes Vinculados */}
          {tab === 'manage' && (
            <div className="accountant-clients-table-wrap">
              {linkedClients.length === 0 ? (
                <div className="accountant-empty-state">
                  <UsersIcon size={32} />
                  <p>Aún no tienes clientes vinculados en tu estudio.</p>
                </div>
              ) : (
                <table className="accountant-clients-mini-table">
                  <thead>
                    <tr>
                      <th>Comercio</th>
                      <th>CUIT</th>
                      <th>Cat.</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedClients.map((client) => (
                      <tr key={client.userId}>
                        <td>
                          <strong>{client.fantasyName || client.fullName}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{client.email}</div>
                        </td>
                        <td className="font-mono">{client.cuit}</td>
                        <td>
                          <span className="accountant-cat-pill">Cat. {client.monotributoCategory}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-unlink"
                            onClick={() => handleUnlink(client.userId)}
                            title="Desvincular cliente"
                          >
                            Desvincular
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
