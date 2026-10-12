import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { calculateCommercialBalance } from '../services/financialBalanceService.js';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { reportPdfService } from '../services/reportPdfService.js';
import { soundService } from '../services/soundService.js';
import {
  DownloadIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  FileTextIcon
} from './Icons.jsx';
import '../styles/accountantBalance.css';

export default function AccountantFinancialStatements({
  clients = [],
  accountantProfile = null
}) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [rubro, setRubro] = useState('comercio');

  // Sliders de calibración rápida
  const [customCash, setCustomCash] = useState(null);
  const [customInventory, setCustomInventory] = useState(null);
  const [customFixedAssets, setCustomFixedAssets] = useState(null);
  const [customTradePayables, setCustomTradePayables] = useState(null);
  const [customBankDebt, setCustomBankDebt] = useState(0);

  // Cliente activo
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || {
      id: 'mock-1',
      fantasy_name: 'Kiosco El Sol',
      razon_social: 'Kiosco El Sol SRL',
      cuit: '20301234567',
      monotributo_category: 'D',
      rolling12mSales: 8400000
    };
  }, [clients, selectedClientId]);

  // Balance calculado
  const balanceData = useMemo(() => {
    return calculateCommercialBalance({
      client: selectedClient,
      annualSales: selectedClient.rolling12mSales,
      rubro,
      customCash,
      customInventory,
      customFixedAssets,
      customTradePayables,
      customBankDebt
    });
  }, [selectedClient, rubro, customCash, customInventory, customFixedAssets, customTradePayables, customBankDebt]);

  const bs = balanceData.financialStatements.balanceSheet;
  const is = balanceData.financialStatements.incomeStatement;
  const ratios = balanceData.ratios;

  const handleDownloadPdf = () => {
    soundService.playKeyTap();
    reportPdfService.generateCommercialBalancePdf({
      client: selectedClient,
      balanceData,
      accountantProfile
    });
    soundService.playSuccessChime();
  };

  const handleResetDefaults = () => {
    soundService.playTap();
    setCustomCash(null);
    setCustomInventory(null);
    setCustomFixedAssets(null);
    setCustomTradePayables(null);
    setCustomBankDebt(0);
  };

  const getWhatsAppMessageUrl = () => {
    const text =
      `Hola ${selectedClient.fantasy_name || selectedClient.razon_social}.\n\n` +
      `Te compartimos el informe contable de tu Balance Comercial & Rendición Operativa (${balanceData.period}):\n\n` +
      `• Facturación Anual: ${formatCurrencyARS(is.annualSales)}\n` +
      `• Activo Total (Bienes + Caja): ${formatCurrencyARS(bs.assets.totalAssets)}\n` +
      `• Pasivo Total (Deudas): ${formatCurrencyARS(bs.liabilities.totalLiabilities)}\n` +
      `• Patrimonio Neto: ${formatCurrencyARS(bs.netWorth)}\n` +
      `• Ganancia Neta Anual: ${formatCurrencyARS(is.netOperatingIncome)} (${formatCurrencyARS(is.monthlyNetIncome)} / mes)\n\n` +
      `📊 Calificación Bancaria: ${ratios.creditScoreText} (Liquidez: ${ratios.currentRatio}x | Capacidad cuota max: ${formatCurrencyARS(ratios.maxCreditInstallmentMonthly)}/mes).\n\n` +
      `Ya tenés disponible el informe oficial firmado para presentar ante Bancos o SGR. Estudio Contable Méndez & Asoc.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="accountant-balance-wrap">
      <Card className="balance-card">
        <CardHeader>
          <div className="balance-header-flex">
            <div>
              <div className="balance-badge-row">
                <Badge variant={ratios.badgeVariant}>
                  {ratios.creditRating === 'APROBADO_BANCARIO' ? '✓ APTO CRÉDITO BANCARIO' : ratios.creditRating}
                </Badge>
                <span className="balance-legal-tag">
                  Normas FACPCE & Criterios de Riesgo Crediticio BCRA / SGR
                </span>
              </div>
              <CardTitle>Balances Comerciales y Estados Contables para Créditos</CardTitle>
              <CardSubtitle>
                Generación automatizada de Estado de Situación Patrimonial, Rendición Operativa y Ratios de Liquidez/Solvencia para bancos.
              </CardSubtitle>
            </div>

            <div className="balance-header-actions">
              <a
                href={getWhatsAppMessageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-balance-wa"
                onClick={() => soundService.playSuccessChime()}
                title="Enviar resumen del balance al cliente por WhatsApp"
              >
                💬 Enviar por WhatsApp
              </a>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPdf}
                iconLeading={<DownloadIcon size={14} />}
              >
                Descargar Balance PDF (Bancos)
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Panel de Control: Selector de Cliente y Rubro Comercial */}
        <div className="balance-control-panel">
          <div className="balance-ctrl-group">
            <label className="balance-ctrl-label" htmlFor="balance-client-select">
              Cliente a Auditar / Presentar
            </label>
            <select
              id="balance-client-select"
              className="balance-client-select"
              value={selectedClientId}
              onChange={(e) => {
                soundService.playTap();
                setSelectedClientId(e.target.value);
              }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fantasy_name || c.razon_social} (CUIT: {c.cuit} — Cat. {c.monotributo_category || 'D'})
                </option>
              ))}
            </select>
          </div>

          <div className="balance-ctrl-group">
            <span className="balance-ctrl-label">Rubro y Estructura de Costos</span>
            <div className="rubro-pills" role="radiogroup" aria-label="Rubro comercial">
              <button
                type="button"
                className={`rubro-pill-btn ${rubro === 'comercio' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setRubro('comercio'); }}
              >
                🛒 Comercio General
              </button>
              <button
                type="button"
                className={`rubro-pill-btn ${rubro === 'gastronomia' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setRubro('gastronomia'); }}
              >
                ☕ Gastronomía
              </button>
              <button
                type="button"
                className={`rubro-pill-btn ${rubro === 'servicios' ? 'active' : ''}`}
                onClick={() => { soundService.playTap(); setRubro('servicios'); }}
              >
                💼 Servicios / Prof.
              </button>
            </div>
          </div>
        </div>

        {/* Scorecard de Calificación Bancaria y Ratios */}
        <div className="balance-score-strip">
          <div className="balance-score-left">
            <div className="balance-score-icon">
              {ratios.badgeVariant === 'success' ? '🏦' : ratios.badgeVariant === 'warning' ? '⚠️' : '🚨'}
            </div>
            <div>
              <h4 className="balance-score-title">{ratios.creditScoreText}</h4>
              <p className="balance-score-verdict">{ratios.creditVerdict}</p>
            </div>
          </div>

          <div className="balance-score-kpis">
            <div className="score-mini-kpi">
              <span className="score-mini-lbl">Liquidez Corriente</span>
              <span className={`score-mini-val font-mono ${ratios.currentRatio >= 1.2 ? 'text-success' : 'text-warning'}`}>
                {ratios.currentRatio}x
              </span>
            </div>
            <div className="score-mini-kpi">
              <span className="score-mini-lbl">Solvencia</span>
              <span className={`score-mini-val font-mono ${ratios.solvencyRatio >= 1.0 ? 'text-success' : 'text-warning'}`}>
                {ratios.solvencyRatio}x
              </span>
            </div>
            <div className="score-mini-kpi">
              <span className="score-mini-lbl">Endeudamiento</span>
              <span className={`score-mini-val font-mono ${ratios.leveragePct < 65 ? 'text-success' : 'text-danger'}`}>
                {ratios.leveragePct}%
              </span>
            </div>
            <div className="score-mini-kpi">
              <span className="score-mini-lbl">Cuota Máx. Mensual</span>
              <span className="score-mini-val font-mono text-brand">
                {formatCurrencyARS(ratios.maxCreditInstallmentMonthly)}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Principal: Estado de Situación Patrimonial y Estado de Resultados */}
        <div className="balance-main-grid">
          {/* 1. Estado de Situación Patrimonial */}
          <div className="balance-section-box">
            <div className="section-box-title-row">
              <h4 className="section-box-title">Estado de Situación Patrimonial</h4>
              <span className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>Cierre de Ejercicio</span>
            </div>

            <div className="accounting-rows">
              <div className="acc-row">
                <span className="acc-row-lbl">Disponibilidades (Caja & CBU Bancario / MP)</span>
                <span className="acc-row-val font-mono">{formatCurrencyARS(bs.assets.current.cashAndBank)}</span>
              </div>
              <div className="acc-row">
                <span className="acc-row-lbl">Créditos por Ventas / Cupones POS</span>
                <span className="acc-row-val font-mono">{formatCurrencyARS(bs.assets.current.accountsReceivable)}</span>
              </div>
              <div className="acc-row">
                <span className="acc-row-lbl">Bienes de Cambio (Stock e Inventario)</span>
                <span className="acc-row-val font-mono">{formatCurrencyARS(bs.assets.current.inventory)}</span>
              </div>
              <div className="acc-row">
                <span className="acc-row-lbl">Bienes de Uso (Instalaciones & Equipamiento)</span>
                <span className="acc-row-val font-mono">{formatCurrencyARS(bs.assets.nonCurrent.fixedAssets)}</span>
              </div>
              <div className="acc-row total-row">
                <span className="acc-row-lbl">TOTAL ACTIVO DECLARADO (A)</span>
                <span className="acc-row-val font-mono text-cyan">{formatCurrencyARS(bs.assets.totalAssets)}</span>
              </div>

              <div style={{ margin: '0.4rem 0' }} />

              <div className="acc-row">
                <span className="acc-row-lbl">Deudas Comerciales (Proveedores)</span>
                <span className="acc-row-val font-mono">{formatCurrencyARS(bs.liabilities.current.tradePayables)}</span>
              </div>
              <div className="acc-row">
                <span className="acc-row-lbl">Cargas Fiscales Devengadas (ARCA / IIBB)</span>
                <span className="acc-row-val font-mono">{formatCurrencyARS(bs.liabilities.current.taxPayables)}</span>
              </div>
              {bs.liabilities.current.shortTermDebt > 0 && (
                <div className="acc-row">
                  <span className="acc-row-lbl">Préstamos Bancarios a Corto Plazo</span>
                  <span className="acc-row-val font-mono">{formatCurrencyARS(bs.liabilities.current.shortTermDebt)}</span>
                </div>
              )}
              <div className="acc-row total-row">
                <span className="acc-row-lbl">TOTAL PASIVO EXIGIBLE (B)</span>
                <span className="acc-row-val font-mono text-danger">{formatCurrencyARS(bs.liabilities.totalLiabilities)}</span>
              </div>

              <div style={{ margin: '0.4rem 0' }} />

              <div className="acc-row net-worth-row">
                <span className="acc-row-lbl">PATRIMONIO NETO CONSOLIDADO (A - B)</span>
                <span className="acc-row-val font-mono text-success">{formatCurrencyARS(bs.netWorth)}</span>
              </div>
            </div>
          </div>

          {/* 2. Estado de Resultados (12 Meses) */}
          <div className="balance-section-box">
            <div className="section-box-title-row">
              <h4 className="section-box-title">Rendición Operativa (Últimos 12 Meses)</h4>
              <span className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>Base AutoARCA</span>
            </div>

            <div className="income-cascade">
              <div className="cascade-step gross-sales">
                <div>
                  <strong>Facturación Anual Emitida</strong>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Comprobantes ARCA computados</div>
                </div>
                <span className="font-mono font-bold text-cyan">{formatCurrencyARS(is.annualSales)}</span>
              </div>

              <div className="cascade-step cost-sub">
                <div>
                  <span>(-) Costo de Mercaderías Vendidas (CMV)</span>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Insumos directos ({((is.costOfSales / is.annualSales) * 100).toFixed(0)}%)</div>
                </div>
                <span className="font-mono text-danger">-{formatCurrencyARS(is.costOfSales)}</span>
              </div>

              <div className="cascade-step operating-margin">
                <div>
                  <strong>(=) Margen Bruto Operativo</strong>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Contribución marginal</div>
                </div>
                <span className="font-mono font-bold">{formatCurrencyARS(is.grossProfit)}</span>
              </div>

              <div className="cascade-step expenses-sub">
                <div>
                  <span>(-) Gastos de Estructura y Alquileres</span>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Servicios, POS, logística ({((is.operatingExpenses / is.annualSales) * 100).toFixed(0)}%)</div>
                </div>
                <span className="font-mono text-danger">-{formatCurrencyARS(is.operatingExpenses)}</span>
              </div>

              <div className="cascade-step net-result">
                <div>
                  <strong>(=) Resultado Neto Disponible</strong>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Ganancia líquida ({is.netMarginPct}% margen)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="font-mono font-bold text-success" style={{ fontSize: '1.05rem' }}>
                    {formatCurrencyARS(is.netOperatingIncome)}
                  </span>
                  <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                    {formatCurrencyARS(is.monthlyNetIncome)} / mes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Calibrador Rápido What-If: Ajuste de Parámetros Reales */}
        <div className="balance-calibrator-card">
          <div className="calibrator-header">
            <div>
              <h5 className="calibrator-title">Calibrador Rápido de Balance (Ajuste en Tiempo Real)</h5>
              <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                Ajustá los saldos bancarios reales o el inventario del cliente para adaptar el informe a los requerimientos del banco.
              </span>
            </div>
            <button
              type="button"
              className="rubro-pill-btn"
              onClick={handleResetDefaults}
              style={{ border: '1px solid var(--border-color)' }}
            >
              Restablecer Valores Base
            </button>
          </div>

          <div className="calibrator-grid">
            <div className="slider-group">
              <div className="slider-lbl-row">
                <span className="slider-lbl-title">Disponibilidades (Caja/Bancos):</span>
                <span className="slider-lbl-val font-mono">{formatCurrencyARS(bs.assets.current.cashAndBank)}</span>
              </div>
              <input
                type="range"
                className="balance-slider"
                min={0}
                max={Math.round(is.annualSales * 0.40)}
                step={50000}
                value={bs.assets.current.cashAndBank}
                onChange={(e) => setCustomCash(Number(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-lbl-row">
                <span className="slider-lbl-title">Inventario / Stock Valorizado:</span>
                <span className="slider-lbl-val font-mono">{formatCurrencyARS(bs.assets.current.inventory)}</span>
              </div>
              <input
                type="range"
                className="balance-slider"
                min={0}
                max={Math.round(is.annualSales * 0.50)}
                step={50000}
                value={bs.assets.current.inventory}
                onChange={(e) => setCustomInventory(Number(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-lbl-row">
                <span className="slider-lbl-title">Bienes de Uso (Equipamiento):</span>
                <span className="slider-lbl-val font-mono">{formatCurrencyARS(bs.assets.nonCurrent.fixedAssets)}</span>
              </div>
              <input
                type="range"
                className="balance-slider"
                min={0}
                max={Math.round(is.annualSales * 0.60)}
                step={100000}
                value={bs.assets.nonCurrent.fixedAssets}
                onChange={(e) => setCustomFixedAssets(Number(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-lbl-row">
                <span className="slider-lbl-title">Deudas Comerciales (Proveedores):</span>
                <span className="slider-lbl-val font-mono">{formatCurrencyARS(bs.liabilities.current.tradePayables)}</span>
              </div>
              <input
                type="range"
                className="balance-slider"
                min={0}
                max={Math.round(is.annualSales * 0.30)}
                step={25000}
                value={bs.liabilities.current.tradePayables}
                onChange={(e) => setCustomTradePayables(Number(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-lbl-row">
                <span className="slider-lbl-title">Préstamos Bancarios Actuales:</span>
                <span className="slider-lbl-val font-mono">{formatCurrencyARS(bs.liabilities.current.shortTermDebt)}</span>
              </div>
              <input
                type="range"
                className="balance-slider"
                min={0}
                max={Math.round(is.annualSales * 0.25)}
                step={50000}
                value={bs.liabilities.current.shortTermDebt}
                onChange={(e) => setCustomBankDebt(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
