import React, { useState, useMemo } from 'react';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { INITIAL_SCALES } from '../services/authService.js';
import {
  AlertTriangleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  SlidersIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ReceiptTaxIcon
} from './Icons.jsx';
import { soundService } from '../services/soundService.js';
import '../styles/taxTrafficLight.css';

// Cuotas fijas mensuales estimadas de Monotributo ARCA por categoría (Impuesto integrado + Aporte jubilatorio + Obra social)
const CATEGORY_TAX_QUOTAS = {
  A: 37085,
  B: 42170,
  C: 48740,
  D: 58120,
  E: 75390,
  F: 93680,
  G: 112500,
  H: 170800,
  I: 255100,
  J: 311900,
  K: 377000
};

export default function TaxTrafficLight({ metrics }) {
  if (!metrics) return null;

  const {
    category = 'A',
    maxAnnualBilling = 0,
    remainingAnnualMargin = 0,
    annualConsumptionPercentage = 0,
    rolling12mSales = 0,
    currentMonthSales = 0,
    projectedMonthTotal = 0,
    trafficLight = { color: 'green', severity: 'normal', label: 'Zona Segura', message: '' }
  } = metrics;

  const [showSimulator, setShowSimulator] = useState(false);
  const [simExtraBilling, setSimExtraBilling] = useState(0);

  const isCritical = trafficLight.color === 'red';
  const isWarning = trafficLight.color === 'yellow';

  const rawPct = Number(
    annualConsumptionPercentage ||
    metrics.percentageConsumed ||
    (maxAnnualBilling > 0 ? (rolling12mSales / maxAnnualBilling) * 100 : 0)
  );

  const displayPct = isNaN(rawPct) ? '0.0' : rawPct.toFixed(1);
  const boundedPercentage = Math.min(Math.max(rawPct, 0), 100);
  const remainingMarginPct = Math.max(0, 100 - boundedPercentage).toFixed(1);

  // Proyección anualizada a fin de mes
  const projectedAnnualSales = Math.max(0, rolling12mSales - currentMonthSales + projectedMonthTotal);
  const projectedAnnualPct = maxAnnualBilling > 0 ? (projectedAnnualSales / maxAnnualBilling) * 100 : 0;
  const boundedProjectedPct = Math.min(Math.max(projectedAnnualPct, 0), 100);

  // Límite diario recomendado para no recategorizar (calculado a 180 días / 6 meses)
  const safeDailyBudget = Math.max(0, remainingAnnualMargin > 0 ? remainingAnnualMargin / 180 : 0);

  // Simulación de Recategorización ARCA
  const simResults = useMemo(() => {
    const totalSimAnnual = rolling12mSales + Number(simExtraBilling || 0);
    const sortedScales = [...INITIAL_SCALES].sort((a, b) => a.max_annual_billing - b.max_annual_billing);
    
    // Escala actual del contribuyente
    const currentScale = sortedScales.find((sc) => sc.category === category) || sortedScales[3]; // default Cat D
    const hasExceededCurrent = totalSimAnnual > currentScale.max_annual_billing;

    // Determinar escala mínima que contiene la facturación total
    let targetScale = sortedScales.find((sc) => totalSimAnnual <= sc.max_annual_billing);
    let isExceededAll = false;

    if (!targetScale) {
      targetScale = sortedScales[sortedScales.length - 1];
      isExceededAll = true;
    }

    // Categoría resultante: si supera la actual asciende; si no, se mantiene en la actual
    const effectiveCategory = hasExceededCurrent ? targetScale.category : category;
    const effectiveScale = sortedScales.find((sc) => sc.category === effectiveCategory) || targetScale;

    const currentQuota = CATEGORY_TAX_QUOTAS[category] || 58120;
    const projectedQuota = isExceededAll ? 500000 : (CATEGORY_TAX_QUOTAS[effectiveCategory] || currentQuota);
    const quotaDiff = projectedQuota - currentQuota;
    const simPct = ((totalSimAnnual / (currentScale.max_annual_billing || 1)) * 100).toFixed(1);

    return {
      totalSimAnnual,
      targetCategory: effectiveCategory,
      isExceededAll,
      hasExceededCurrent,
      targetMaxAnnual: effectiveScale.max_annual_billing,
      currentQuota,
      projectedQuota,
      quotaDiff,
      simPct: Number(simPct),
      suggestedLowerCategory: !hasExceededCurrent && targetScale.category !== category ? targetScale.category : null
    };
  }, [rolling12mSales, simExtraBilling, category]);

  return (
    <div className="traffic-light-card">
      {/* Cabecera con Categoría, Badge de Estado y Toggle de Simulador */}
      <div className="traffic-light-header">
        <div className="traffic-header-left">
          <div className="traffic-category-badge">
            <ShieldCheckIcon size={16} />
            <span>Categoría {category} · Monotributo ARCA</span>
            <span className="traffic-category-tope">Tope: {formatCurrencyARS(maxAnnualBilling)}</span>
          </div>

          <button
            type="button"
            className={`traffic-simulator-toggle-btn ${showSimulator ? 'active' : ''}`}
            onClick={() => {
              soundService.playKeyTap();
              setShowSimulator((prev) => !prev);
            }}
            title="Abrir o cerrar el simulador predictivo de recategorización semestral"
          >
            <SlidersIcon size={14} />
            <span>{showSimulator ? 'Ocultar Simulador' : 'Simulador ARCA'}</span>
          </button>
        </div>

        <div
          data-testid="traffic-light-badge"
          className={`traffic-status-badge color-${trafficLight.color}`}
        >
          <span className="status-beacon-dot" />
          {trafficLight.color === 'green' ? (
            <ShieldCheckIcon size={15} />
          ) : (
            <AlertTriangleIcon size={15} />
          )}
          <span>{trafficLight.label}</span>
        </div>
      </div>

      {/* Barra de Progreso de Consumo Anual Calibrada y Enriquecida */}
      <div className="progress-container">
        <div className="progress-labels">
          <div className="progress-meta-text">
            <span className="progress-title">Consumo de Escala Anual (12 Meses)</span>
            <div className="progress-subtitle">
              <strong style={{ color: 'var(--text-main, #fff)' }}>{formatCurrencyARS(rolling12mSales)}</strong> facturados de {formatCurrencyARS(maxAnnualBilling)} (Tope Cat. {category})
            </div>
          </div>

          <div className="progress-pct-display">
            <div className="progress-pct-row">
              <span className={`progress-pct-value text-${trafficLight.color}`}>{displayPct}%</span>
              <span className="progress-margin-tag">
                {remainingAnnualMargin >= 0 ? `${remainingMarginPct}% margen disponible` : 'Escala superada'}
              </span>
            </div>
            {rawPct > 100 && (
              <span className="progress-overflow-badge">Excedido +{(rawPct - 100).toFixed(1)}%</span>
            )}
          </div>
        </div>

        {/* Riel Calibrado con Ticks, Gradiente Vivo y Marcador de Proyección */}
        <div className="progress-track" title={`Consumo actual: ${displayPct}% de la escala anual`}>
          {/* Relleno Dinámico Luminoso */}
          <div
            className={`progress-fill fill-${trafficLight.color}`}
            style={{ width: `${boundedPercentage}%` }}
          >
            <div className="progress-fill-glow" />
            <div className="progress-fill-shimmer" />
            {/* Indicador de punta con halo pulsante */}
            <div className="progress-needle-thumb" title={`Actual: ${displayPct}%`} />
          </div>

          {/* Marcador Fantasma de Proyección a Fin de Mes */}
          {boundedProjectedPct > boundedPercentage && boundedProjectedPct <= 100 && (
            <div
              className="progress-ghost-marker"
              style={{ left: `${boundedProjectedPct}%` }}
              title={`Proyección fin de mes: ${boundedProjectedPct.toFixed(1)}%`}
            >
              <div className="ghost-marker-line" />
              <div className="ghost-marker-label">▲ Proy. Mes</div>
            </div>
          )}

          {/* Marcas de porcentaje en el riel */}
          <div className="progress-track-tick tick-25" style={{ left: '25%' }} />
          <div className="progress-track-tick tick-50" style={{ left: '50%' }} />
          <div className="progress-track-tick tick-75" style={{ left: '75%' }} />
          <div className="progress-track-tick tick-90" style={{ left: '90%' }} />
        </div>

        {/* Escala graduada con posiciones porcentuales reales */}
        <div className="progress-milestones-calibrated">
          <span className="milestone-mark" style={{ left: '0%' }}>
            <span className="milestone-pct">0%</span>
            <span className="milestone-sub">Base</span>
          </span>
          <span className="milestone-mark" style={{ left: '50%' }}>
            <span className="milestone-pct">50%</span>
            <span className="milestone-sub">Mitad</span>
          </span>
          <span className="milestone-mark alert-warning" style={{ left: '75%' }}>
            <span className="milestone-pct">75%</span>
            <span className="milestone-sub">Alerta</span>
          </span>
          <span className="milestone-mark alert-danger" style={{ left: '90%' }}>
            <span className="milestone-pct">90%</span>
            <span className="milestone-sub">Crítico</span>
          </span>
          <span className="milestone-mark alert-limit" style={{ left: '100%' }}>
            <span className="milestone-pct">100%</span>
            <span className="milestone-sub">Tope Cat. {category}</span>
          </span>
        </div>

        {/* Consejo Inteligente de Presupuesto Diario */}
        <div className="smart-budget-banner">
          <span className="budget-icon">💡</span>
          <span>
            <strong>Presupuesto diario recomendado:</strong> Podés facturar un promedio de{' '}
            <strong style={{ color: '#38bdf8' }}>{formatCurrencyARS(safeDailyBudget)}/día</strong> durante los próximos 6 meses para permanecer en tu categoría actual sin recategorizar.
          </span>
        </div>
      </div>

      {/* Grilla de Métricas en Tarjetas Estilo Glassmorphism */}
      <div className="traffic-metrics-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-title">Margen Anual Restante</span>
            <span className={`metric-trend-badge ${remainingAnnualMargin < 0 ? 'negative' : 'positive'}`}>
              {remainingAnnualMargin < 0 ? 'Excedido' : `${remainingMarginPct}% libre`}
            </span>
          </div>
          <div
            className="metric-card-value"
            style={{ color: remainingAnnualMargin < 0 ? '#ef4444' : '#10b981' }}
          >
            {formatCurrencyARS(remainingAnnualMargin)}
          </div>
          <div className="metric-card-hint">
            {remainingAnnualMargin >= 0
              ? 'Disponible antes del límite de escala'
              : 'Requiere recategorización inmediata'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-title">Ventas Mes Actual</span>
            <span className="metric-trend-badge info">Mes en curso</span>
          </div>
          <div className="metric-card-value">
            {formatCurrencyARS(currentMonthSales)}
          </div>
          <div className="metric-card-hint">
            Promedio mensual de escala: {formatCurrencyARS(maxAnnualBilling / 12)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-title">Proyección Fin de Mes</span>
            <span className="metric-trend-badge neutral">
              <TrendingUpIcon size={12} /> Estimado
            </span>
          </div>
          <div className="metric-card-value" style={{ color: '#38bdf8' }}>
            {formatCurrencyARS(projectedMonthTotal)}
          </div>
          <div className="metric-card-hint">
            {projectedMonthTotal > (maxAnnualBilling / 12) * 1.2
              ? 'Ritmo elevado vs promedio mensual'
              : 'Ritmo comercial alineado con la escala'}
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

      {/* SIMULADOR INTERACTIVO DE RECATEGORIZACIÓN SEMESTRAL ARCA (ENERO / JULIO) */}
      {showSimulator && (
        <div className="arca-simulator-drawer">
          <div className="simulator-header">
            <div className="simulator-title-group">
              <div className="simulator-icon-wrap">
                <CalculatorIcon size={18} />
              </div>
              <div>
                <h4 className="simulator-title">Simulador de Recategorización Semestral ARCA (Enero / Julio)</h4>
                <p className="simulator-subtitle">
                  Proyectá el impacto impositivo si aumentás o proyectás mayor facturación en este período.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="simulator-reset-btn"
              onClick={() => {
                soundService.playKeyTap();
                setSimExtraBilling(0);
              }}
            >
              Reiniciar
            </button>
          </div>

          <div className="simulator-controls">
            <div className="simulator-slider-row">
              <label htmlFor="sim-slider" className="simulator-slider-label">
                <span>Facturación adicional a simular:</span>
                <span className="sim-amount-badge">{formatCurrencyARS(simExtraBilling)}</span>
              </label>
              <input
                id="sim-slider"
                type="range"
                min="0"
                max={Math.max(10000000, maxAnnualBilling)}
                step="50000"
                value={simExtraBilling}
                onChange={(e) => setSimExtraBilling(Number(e.target.value))}
                className="simulator-slider-input"
              />
              <div className="simulator-slider-ticks">
                <span>$ 0</span>
                <span>{formatCurrencyARS(Math.max(10000000, maxAnnualBilling) / 2)}</span>
                <span>{formatCurrencyARS(Math.max(10000000, maxAnnualBilling))}</span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="simulator-quick-buttons">
              {[250000, 500000, 1000000, 2500000, 5000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`sim-quick-btn ${simExtraBilling === val ? 'active' : ''}`}
                  onClick={() => {
                    soundService.playKeyTap();
                    setSimExtraBilling(val);
                  }}
                >
                  +{formatCurrencyARS(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados de la Simulación */}
          <div className="simulator-results-grid">
            <div className="sim-result-card">
              <span className="sim-card-label">Categoría Proyectada</span>
              <div className="sim-category-result">
                <span className="sim-cat-badge">Cat. {simResults.targetCategory}</span>
                {simResults.hasExceededCurrent ? (
                  <span className="sim-status-chip warning">
                    Salta de {category} a {simResults.targetCategory}
                  </span>
                ) : (
                  <span className="sim-status-chip safe">
                    <CheckCircleIcon size={13} /> Se mantiene en {category}
                  </span>
                )}
              </div>
              <span className="sim-card-hint">
                Tope máximo anual: {formatCurrencyARS(simResults.targetMaxAnnual)}
              </span>
            </div>

            <div className="sim-result-card">
              <span className="sim-card-label">Cuota Mensual ARCA Estimada</span>
              <div className="sim-quota-value">
                {formatCurrencyARS(simResults.projectedQuota)}
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 400 }}> / mes</span>
              </div>
              <span className={`sim-card-hint ${simResults.quotaDiff > 0 ? 'text-amber' : ''}`}>
                {simResults.quotaDiff > 0
                  ? `+${formatCurrencyARS(simResults.quotaDiff)}/mes vs categoría actual`
                  : 'Misma cuota fija actual'}
              </span>
            </div>

            <div className="sim-result-card">
              <span className="sim-card-label">Consumo Anual Simulado</span>
              <div className="sim-quota-value" style={{ color: simResults.simPct > 90 ? '#ef4444' : '#10b981' }}>
                {simResults.simPct}%
              </div>
              <span className="sim-card-hint">
                Total anual: {formatCurrencyARS(simResults.totalSimAnnual)}
              </span>
            </div>
          </div>

          {/* Veredicto del Asesor Algorítmico */}
          <div className="simulator-verdict-box">
            <ReceiptTaxIcon size={16} />
            <span>
              {simResults.hasExceededCurrent ? (
                <>
                  <strong>Alerta de Recategorización Obligatoria:</strong> Con {formatCurrencyARS(simExtraBilling)} adicionales, tu facturación acumulada ({formatCurrencyARS(simResults.totalSimAnnual)}) superará el límite de la Categoría {category}. En la próxima recategorización de ARCA (Enero/Julio) deberás ascender a <strong>Categoría {simResults.targetCategory}</strong>, lo que implicará una cuota mensual estimada de <strong>{formatCurrencyARS(simResults.projectedQuota)}</strong> (+{formatCurrencyARS(simResults.quotaDiff)}/mes).
                </>
              ) : (
                <>
                  <strong>Zona Segura Confirmada:</strong> Con {formatCurrencyARS(simExtraBilling)} adicionales, tu facturación total proyectada ({formatCurrencyARS(simResults.totalSimAnnual)}) permanece cómodamente dentro del tope de tu <strong>Categoría {category}</strong> ({formatCurrencyARS(simResults.targetMaxAnnual)}). Podés emitir tus comprobantes sin riesgo de recategorización ni incrementos en tus cuotas mensuales de ARCA.
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
