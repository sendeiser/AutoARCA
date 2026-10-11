/**
 * Componente Navbar — Navegación Adaptativa Inteligente
 * - En Desktop / Tablet: Barra horizontal de pestañas segmentadas Apple
 * - En Mobile (<768px): Floating Bottom Tab Bar ergonómica para liberar espacio vertical
 */

import React from 'react';
import {
  CalculatorIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  FileTextIcon,
  BoltIcon,
  UsersIcon,
  ReceiptTaxIcon,
  AlertTriangleIcon,
  TableIcon,
  BriefcaseIcon
} from './Icons.jsx';
import { soundService } from '../services/soundService.js';
import '../styles/navbar.css';

export default function Navbar({
  role = 'client',
  activeTab = 'pos',
  onTabChange,
  isClientSuspended = false,
  badges = {}
}) {
  const handleSelect = (tabKey) => {
    soundService.playKeyTap();
    if (onTabChange) onTabChange(tabKey);
  };

  // Definición de pestañas por cada rol
  const getTabsForRole = () => {
    if (role === 'client') {
      if (isClientSuspended) return [];
      return [
        {
          key: 'pos',
          label: 'Terminal POS',
          mobileLabel: 'POS',
          icon: CalculatorIcon,
          badge: badges.posSalesCount > 0 ? badges.posSalesCount : null,
          badgeColor: 'blue'
        },
        {
          key: 'dashboard',
          label: 'Dashboard Fiscal',
          mobileLabel: 'Fiscal',
          icon: ChartBarIcon,
          badge: badges.taxTrafficColor ? '' : null,
          badgeColor: badges.taxTrafficColor || 'green'
        },
        {
          key: 'bancos',
          label: 'Cruce Bancario',
          mobileLabel: 'Bancos',
          icon: ShieldCheckIcon
        },
        {
          key: 'compras',
          label: 'Control Compras',
          mobileLabel: 'Compras',
          icon: ShoppingCartIcon
        },
        {
          key: 'dfe',
          label: 'Buzón DFE',
          mobileLabel: 'DFE',
          icon: FileTextIcon
        },
        {
          key: 'recurrentes',
          label: 'Abonos Mensuales',
          mobileLabel: 'Abonos',
          icon: BoltIcon
        }
      ];
    }

    if (role === 'accountant') {
      return [
        {
          key: 'clientes',
          label: 'Cartera & Lotes',
          mobileLabel: 'Cartera',
          icon: UsersIcon,
          badge: badges.totalClients > 0 ? badges.totalClients : null,
          badgeColor: 'blue'
        },
        {
          key: 'recategorizacion',
          label: 'Recategorización',
          mobileLabel: 'Recat',
          icon: ReceiptTaxIcon
        },
        {
          key: 'dfe',
          label: 'Central DFE',
          mobileLabel: 'DFE',
          icon: FileTextIcon
        },
        {
          key: 'riesgo_bancario',
          label: 'Riesgo Bancario',
          mobileLabel: 'Riesgo',
          icon: AlertTriangleIcon
        },
        {
          key: 'calendario',
          label: 'Calendario CUIT',
          mobileLabel: 'Calendario',
          icon: TableIcon
        },
        {
          key: 'honorarios',
          label: 'Honorarios del Estudio',
          mobileLabel: 'Honorarios',
          icon: ShieldCheckIcon
        }
      ];
    }

    if (role === 'superadmin') {
      return [
        {
          key: 'scales',
          label: 'Escalas ARCA',
          mobileLabel: 'Escalas',
          icon: TableIcon
        },
        {
          key: 'users',
          label: 'Usuarios & Suscripciones',
          mobileLabel: 'Usuarios',
          icon: UsersIcon,
          badge: badges.totalUsers > 0 ? badges.totalUsers : null,
          badgeColor: 'blue'
        }
      ];
    }

    return [];
  };

  const tabs = getTabsForRole();
  if (tabs.length === 0) return null;

  return (
    <nav className="navbar-desktop-segment" aria-label="Navegación principal">
      <div className="navbar-segment-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key || (tab.key === 'dashboard' && activeTab === 'fiscal');
          return (
            <button
              key={tab.key}
              type="button"
              className={`navbar-segment-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(tab.key)}
              aria-selected={isActive}
              role="tab"
              data-testid={`nav-tab-${tab.key}`}
            >
              <Icon size={15} />
              <span className="navbar-segment-label">{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span className={`navbar-segment-badge badge-${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
