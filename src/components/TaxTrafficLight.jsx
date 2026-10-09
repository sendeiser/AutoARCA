import React from 'react';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { AlertTriangleIcon } from './Icons.jsx';
import '../styles/taxTrafficLight.css';

export default function TaxTrafficLight({ metrics }) {
  if (!metrics) return null;

  const {
    category = 'A',
    maxAnnualBilling = 0,
    remainingAnnualMargin = 0,
    annualConsumptionPercentage = 0,
    currentMonthSales = 0,
    projectedMonthTotal = 0,
    trafficLight = { color: 'green', severity: 'normal', label: 'Zona Segura', message: '' }
  } = metrics;

  const isCritical = trafficLight.color === 'red';
  const isWarning = trafficLight.color === 'yellow';
  const boundedPercentage = Math.min(Math.max(annualConsumptionPercentage, 0), 100);

  return (
    <div className="traffic-light-card">
      {/* Cabecera con Categoría y Badge de Estado */}
      <div className="traffic-light-header">
        <div className="traffic-category-badge">
          Categoría {category} · Monotributo
        </div>
        <div
          data-testid="traffic-light-badge"
          className={`traffic-status-badge color-${trafficLight.color}`}
        >
          <span>{trafficLight.color === 'green' ? '🟢' : trafficLight.color === 'yellow' ? '🟡' : '🔴'}</span>
          <span>{trafficLight.label}</span>
        </div>
      </div>

      {/* Barra de Progreso de Consumo Anual */}
      <div className="progress-container">
        <div className="progress-labels">
          <span>Consumo de escala anual</span>
          <span className="progress-pct-value">{annualConsumptionPercentage}%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill fill-${trafficLight.color}`}
            style={{ width: `${boundedPercentage}%` }}
          />
        </div>
        <div className="progress-milestones">
          <span>0%</span>
          <span>50%</span>
          <span>85% Alerta</span>
          <span>100% Límite</span>
        </div>
      </div>

      {/* Grilla de Métricas en Tarjetas */}
      <div className="traffic-metrics-grid">
        <div className="metric-card">
          <div className="metric-card-title">Margen Anual Restante</div>
          <div className="metric-card-value" style={{ color: remainingAnnualMargin < 0 ? '#ef4444' : '#10b981' }}>
            {formatCurrencyARS(remainingAnnualMargin)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">Ventas Mes Actual</div>
          <div className="metric-card-value">
            {formatCurrencyARS(currentMonthSales)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">Proyección Fin de Mes</div>
          <div className="metric-card-value" style={{ color: '#38bdf8' }}>
            {formatCurrencyARS(projectedMonthTotal)}
          </div>
        </div>
      </div>

      {/* Banner de Advertencia Impositiva */}
      {(isWarning || isCritical) && (
        <div
          role="alert"
          className={`traffic-alert-banner ${isCritical ? 'critical' : 'warning'}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
            <AlertTriangleIcon size={20} />
          </span>
          <div>
            <strong>{isCritical ? 'Alerta Crítica de Recategorización:' : 'Sugerencia Impositiva:'}</strong>{' '}
            {trafficLight.message}
          </div>
        </div>
      )}
    </div>
  );
}
