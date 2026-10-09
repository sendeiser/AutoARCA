import { describe, it, expect } from 'vitest';
import {
  calculateCategoryConsumption,
  getTrafficLightStatus,
  formatCurrencyARS
} from '../src/services/taxAlertEngine.js';

describe('taxAlertEngine', () => {
  const scaleD = {
    category: 'D',
    max_annual_billing: 16000000,
    max_monthly_average: 1333333.33
  };

  it('determina estado verde en consumo bajo (< 75%)', () => {
    const status = getTrafficLightStatus(65);
    expect(status.color).toBe('green');
    expect(status.severity).toBe('normal');
    expect(status.label).toMatch(/segura|en orden/i);
  });

  it('determina estado amarillo de advertencia entre 75% y 90%', () => {
    const status = getTrafficLightStatus(82);
    expect(status.color).toBe('yellow');
    expect(status.severity).toBe('warning');
    expect(status.label).toMatch(/preventiva|atención/i);
  });

  it('determina estado rojo crítico si supera el 90%', () => {
    const status = getTrafficLightStatus(93);
    expect(status.color).toBe('red');
    expect(status.severity).toBe('critical');
    expect(status.label).toMatch(/peligro|límite/i);
    expect(status.message).toMatch(/recategorización|exclusión/i);
  });

  it('calcula métricas impositivas anuales y proyección de fin de mes', () => {
    const metrics = calculateCategoryConsumption({
      currentMonthSales: 500000,
      rolling12mSales: 12000000,
      categoryScale: scaleD,
      dayOfMonth: 10,
      totalDaysInMonth: 30
    });

    expect(metrics.remainingAnnualMargin).toBe(4000000); // 16M - 12M
    expect(metrics.annualConsumptionPercentage).toBe(75.0);
    expect(metrics.projectedMonthTotal).toBe(1500000); // (500k / 10) * 30
    expect(metrics.trafficLight.color).toBe('yellow'); // 75% entra en advertencia
  });

  it('maneja valores que exceden el 100% con semáforo rojo y margen cero o negativo', () => {
    const metrics = calculateCategoryConsumption({
      currentMonthSales: 2000000,
      rolling12mSales: 17000000,
      categoryScale: scaleD,
      dayOfMonth: 20,
      totalDaysInMonth: 30
    });

    expect(metrics.remainingAnnualMargin).toBe(-1000000);
    expect(metrics.annualConsumptionPercentage).toBeGreaterThan(100);
    expect(metrics.trafficLight.color).toBe('red');
  });

  it('formatea moneda correctamente en formato argentino', () => {
    const formatted = formatCurrencyARS(1500000);
    expect(formatted).toContain('1.500.000');
    expect(formatted).toContain('$');
  });
});
