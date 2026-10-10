import React, { useState } from 'react';
import { calculateBankCrossingRisk, formatCurrencyARS } from '../services/taxAlertEngine.js';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { InputField } from './untitled-ui/InputField.jsx';
import { ShieldCheckIcon, AlertTriangleIcon, TrendingUpIcon, BoltIcon, RefreshIcon } from './Icons.jsx';
import '../styles/bankCrossingMonitor.css';

export default function BankCrossingMonitor({
  currentInvoiced = 6850000,
  categoryScale = { category: 'D', max_annual_billing: 16450000 },
  categoryKMax = 68000000
}) {
  const [bankDeposits, setBankDeposits] = useState(7200000);
  const [nonTaxableTransfers, setNonTaxableTransfers] = useState(500000);

  const riskAnalysis = calculateBankCrossingRisk({
    totalInvoiced: currentInvoiced,
    totalBankDeposits: bankDeposits,
    nonTaxableDeposits: nonTaxableTransfers,
    categoryMaxAnnual: categoryScale.max_annual_billing || 16450000,
    categoryKMaxAnnual: categoryKMax
  });

  const handleSimulateAdd = (amount) => {
    setBankDeposits((prev) => Math.max(0, Number(prev) + amount));
  };

  const handleReset = () => {
    setBankDeposits(currentInvoiced);
    setNonTaxableTransfers(0);
  };

  return (
    <Card className="bank-crossing-card">
      <CardHeader>
        <div className="bank-crossing-header-flex">
          <div>
            <div className="bank-crossing-badge-row">
              <Badge variant={riskAnalysis.status === 'red' ? 'error' : riskAnalysis.status === 'yellow' ? 'warning' : 'success'}>
                {riskAnalysis.status === 'red' ? 'PELIGRO FISCAL' : riskAnalysis.status === 'yellow' ? 'ALERTA BRECHA' : 'CONCILIACIÓN EN ORDEN'}
              </Badge>
              <span className="bank-crossing-law-pill">Art. 20 inc. f y g Ley 24.977 — RG 4298 ARCA</span>
            </div>
            <CardTitle>Cruce Bancario & Billeteras Virtuales vs Facturación</CardTitle>
            <CardSubtitle>
              Control en tiempo real de acreditaciones en cuentas bancarias (CBU) y billeteras (CVU Mercado Pago / Ualá) para prevenir la exclusión de oficio.
            </CardSubtitle>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RefreshIcon size={14} /> Reajustar
          </Button>
        </div>
      </CardHeader>

      <div className="bank-crossing-body">
        {/* Métricas Principales */}
        <div className="bank-crossing-kpis">
          <div className="bank-kpi-item">
            <span className="bank-kpi-label">Facturación Oficial (ARCA)</span>
            <span className="bank-kpi-val text-success">{formatCurrencyARS(currentInvoiced)}</span>
            <span className="bank-kpi-sub">Comprobantes C registrados</span>
          </div>

          <div className="bank-kpi-item">
            <span className="bank-kpi-label">Acreditaciones Netas (Bancos/CVU)</span>
            <span className="bank-kpi-val text-primary">{formatCurrencyARS(riskAnalysis.netCommercialDeposits)}</span>
            <span className="bank-kpi-sub">Total computable para fiscalización</span>
          </div>

          <div className="bank-kpi-item">
            <span className="bank-kpi-label">Brecha Descubierta</span>
            <span className={`bank-kpi-val ${riskAnalysis.uninvoicedGap > 0 ? 'text-danger' : 'text-success'}`}>
              {formatCurrencyARS(riskAnalysis.uninvoicedGap)}
            </span>
            <span className="bank-kpi-sub">{riskAnalysis.gapPercentage}% sin comprobantes</span>
          </div>
        </div>

        {/* Barra Visual Comparativa */}
        <div className="bank-crossing-meter-box">
          <div className="bank-meter-header">
            <span>Relación Depósitos / Facturación</span>
            <span className="bank-meter-ratio font-mono">
              {riskAnalysis.netCommercialDeposits > 0 
                ? `${((currentInvoiced / riskAnalysis.netCommercialDeposits) * 100).toFixed(1)}% facturado`
                : '100%'}
            </span>
          </div>
          <div className="bank-meter-track">
            <div 
              className={`bank-meter-fill ${riskAnalysis.status}`}
              style={{ width: `${Math.min(100, Math.max(10, (riskAnalysis.netCommercialDeposits / (categoryScale.max_annual_billing || 16450000)) * 100))}%` }}
            />
          </div>
          <div className="bank-meter-labels">
            <span>$0</span>
            <span>Tope Cat. {categoryScale.category}: {formatCurrencyARS(categoryScale.max_annual_billing || 16450000)}</span>
            <span>Tope Máx. Cat. K: {formatCurrencyARS(categoryKMax)}</span>
          </div>
        </div>

        {/* Mensaje Dinámico del Motor Fiscal */}
        <div className={`bank-alert-banner banner-${riskAnalysis.status}`}>
          <div className="bank-banner-icon">
            {riskAnalysis.status === 'red' ? <AlertTriangleIcon size={20} /> : <ShieldCheckIcon size={20} />}
          </div>
          <div>
            <div className="bank-banner-title">{riskAnalysis.title}</div>
            <p className="bank-banner-desc">{riskAnalysis.message}</p>
          </div>
        </div>

        {/* Editor de Parámetros y Simulación */}
        <div className="bank-controls-grid">
          <InputField
            label="Total Acreditaciones Brutas (Bancos + Mercado Pago)"
            type="number"
            value={bankDeposits}
            onChange={(e) => setBankDeposits(Number(e.target.value) || 0)}
          />

          <InputField
            label="Acreditaciones Justificadas no comerciales (Cuentas propias, préstamos)"
            type="number"
            value={nonTaxableTransfers}
            onChange={(e) => setNonTaxableTransfers(Number(e.target.value) || 0)}
          />
        </div>

        {/* Chips de Simulación Rápida */}
        <div className="bank-sim-chips">
          <span className="bank-sim-label">Simular impacto de depósitos extras:</span>
          <button type="button" className="bank-chip" onClick={() => handleSimulateAdd(250000)}>+ $250.000</button>
          <button type="button" className="bank-chip" onClick={() => handleSimulateAdd(500000)}>+ $500.000</button>
          <button type="button" className="bank-chip" onClick={() => handleSimulateAdd(1000000)}>+ $1.000.000</button>
          <button type="button" className="bank-chip" onClick={() => handleSimulateAdd(2500000)}>+ $2.500.000</button>
        </div>
      </div>
    </Card>
  );
}
