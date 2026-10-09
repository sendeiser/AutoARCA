import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaxTrafficLight from '../src/components/TaxTrafficLight.jsx';

describe('TaxTrafficLight Component', () => {
  const safeMetrics = {
    category: 'D',
    maxAnnualBilling: 16000000,
    maxMonthlyAverage: 1333333.33,
    currentMonthSales: 350000,
    rolling12mSales: 6000000,
    remainingAnnualMargin: 10000000,
    annualConsumptionPercentage: 37.5,
    currentMonthPercentage: 26.3,
    projectedMonthTotal: 1050000,
    trafficLight: {
      color: 'green',
      severity: 'normal',
      label: 'Zona Segura — Categoría en Orden',
      message: 'Tu ritmo de facturación está dentro de los parámetros seguros.'
    }
  };

  const dangerMetrics = {
    category: 'C',
    maxAnnualBilling: 13250000,
    maxMonthlyAverage: 1104166.67,
    currentMonthSales: 1200000,
    rolling12mSales: 12500000,
    remainingAnnualMargin: 750000,
    annualConsumptionPercentage: 94.3,
    currentMonthPercentage: 108.7,
    projectedMonthTotal: 1800000,
    trafficLight: {
      color: 'red',
      severity: 'critical',
      label: 'Peligro Fiscal — Límite Próximo o Excedido',
      message: 'Atención: Has consumido el 94.3% de tu categoría C. Riesgo de salto a categoría D.'
    }
  };

  it('renderiza la barra de consumo y el badge de estado verde', () => {
    render(<TaxTrafficLight metrics={safeMetrics} />);
    expect(screen.getByText(/Categoría D/i)).toBeInTheDocument();
    expect(screen.getByText(/Zona Segura/i)).toBeInTheDocument();
    expect(screen.getByText('37.5%')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-light-badge')).toHaveClass('color-green');
  });

  it('renderiza alerta critica y badge rojo cuando supera el 90%', () => {
    render(<TaxTrafficLight metrics={dangerMetrics} />);
    expect(screen.getByText(/Peligro Fiscal/i)).toBeInTheDocument();
    expect(screen.getByText('94.3%')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-light-badge')).toHaveClass('color-red');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
