import React, { useState } from 'react';
import { calculateExpenseLimitRisk, formatCurrencyARS } from '../services/taxAlertEngine.js';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { InputField } from './untitled-ui/InputField.jsx';
import { ShoppingCartIcon, AlertTriangleIcon, ShieldCheckIcon, PlusIcon } from './Icons.jsx';
import '../styles/expensePurchaseLimitMonitor.css';

export default function ExpensePurchaseLimitMonitor({
  categoryKMax = 68000000,
  initialExpenses = 14200000,
  initialActivity = 'servicios'
}) {
  const [activityType, setActivityType] = useState(initialActivity);
  const [totalExpenses, setTotalExpenses] = useState(initialExpenses);

  const riskData = calculateExpenseLimitRisk({
    totalExpenses,
    activityType,
    categoryKMaxAnnual: categoryKMax
  });

  const handleAddExpense = (amount) => {
    setTotalExpenses((prev) => Math.max(0, Number(prev) + amount));
  };

  return (
    <Card className="expense-limit-card">
      <CardHeader>
        <div className="expense-limit-header-flex">
          <div>
            <div className="expense-limit-badge-row">
              <Badge variant={riskData.status === 'red' ? 'error' : riskData.status === 'yellow' ? 'warning' : 'success'}>
                {riskData.status === 'red' ? 'PELIGRO DE EXCLUSIÓN' : riskData.status === 'yellow' ? 'ALERTA COMPRAS' : 'DENTRO DE LA NORMA'}
              </Badge>
              <span className="expense-law-tag">Art. 20 inc. c Ley 24.977 Monotributo</span>
            </div>
            <CardTitle>Control de Compras e Insumos Máximos Permitidos</CardTitle>
            <CardSubtitle>
              Las compras y gastos de la actividad no pueden superar el 80% (bienes) o 40% (servicios) del tope máximo de la Categoría K.
            </CardSubtitle>
          </div>
          <div className="expense-activity-toggle">
            <button
              type="button"
              className={`expense-toggle-btn ${activityType === 'servicios' ? 'active' : ''}`}
              onClick={() => setActivityType('servicios')}
            >
              Servicios (40%)
            </button>
            <button
              type="button"
              className={`expense-toggle-btn ${activityType === 'bienes' ? 'active' : ''}`}
              onClick={() => setActivityType('bienes')}
            >
              Bienes / Comercio (80%)
            </button>
          </div>
        </div>
      </CardHeader>

      <div className="expense-limit-body">
        <div className="expense-kpis-grid">
          <div className="expense-kpi-item">
            <span className="expense-kpi-label">Compras Acumuladas</span>
            <span className="expense-kpi-val text-primary font-mono">{formatCurrencyARS(riskData.currentExpenses)}</span>
            <span className="expense-kpi-sub">Comprobantes recibidos</span>
          </div>

          <div className="expense-kpi-item">
            <span className="expense-kpi-label">Límite Legal Máximo</span>
            <span className="expense-kpi-val font-mono">{formatCurrencyARS(riskData.legalLimit)}</span>
            <span className="expense-kpi-sub">{riskData.activityType}</span>
          </div>

          <div className="expense-kpi-item">
            <span className="expense-kpi-label">Margen de Compras Restante</span>
            <span className={`expense-kpi-val font-mono ${riskData.remainingMargin === 0 ? 'text-danger' : 'text-success'}`}>
              {formatCurrencyARS(riskData.remainingMargin)}
            </span>
            <span className="expense-kpi-sub">{riskData.consumptionPercentage}% consumido</span>
          </div>
        </div>

        {/* Barra de Progreso Legal */}
        <div className="expense-progress-box">
          <div className="expense-progress-header">
            <span>Consumo del Límite de Compras</span>
            <span className="font-mono font-bold">{riskData.consumptionPercentage}%</span>
          </div>
          <div className="expense-progress-track">
            <div
              className={`expense-progress-fill ${riskData.status}`}
              style={{ width: `${Math.min(100, riskData.consumptionPercentage)}%` }}
            />
          </div>
          <div className="expense-progress-scale">
            <span>$0</span>
            <span>75% (Preventivo)</span>
            <span>90% (Peligro)</span>
            <span>100% Exclusión: {formatCurrencyARS(riskData.legalLimit)}</span>
          </div>
        </div>

        {/* Mensaje de Alerta */}
        <div className={`expense-alert-box alert-${riskData.status}`}>
          <div className="expense-alert-icon">
            {riskData.status === 'red' ? <AlertTriangleIcon size={20} /> : <ShieldCheckIcon size={20} />}
          </div>
          <div>
            <strong>{riskData.label}</strong>
            <p>{riskData.message}</p>
          </div>
        </div>

        {/* Simulador rápido de compras */}
        <div className="expense-input-row">
          <InputField
            label="Simular o Actualizar Monto de Compras Acumuladas ($ ARS)"
            type="number"
            value={totalExpenses}
            onChange={(e) => setTotalExpenses(Number(e.target.value) || 0)}
          />
          <div className="expense-quick-chips">
            <button type="button" className="expense-chip" onClick={() => handleAddExpense(500000)}>+ $500.000</button>
            <button type="button" className="expense-chip" onClick={() => handleAddExpense(1000000)}>+ $1.000.000</button>
            <button type="button" className="expense-chip" onClick={() => handleAddExpense(2500000)}>+ $2.500.000</button>
          </div>
        </div>
      </div>
    </Card>
  );
}
