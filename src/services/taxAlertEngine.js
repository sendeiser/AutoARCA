/**
 * Motor de Alertas Fiscales y Monitoreo de Monotributo
 * Calcula límites en tiempo real, consumo anual/mensual y determina el estado del semáforo.
 */

/**
 * Formatea un número como moneda argentina (ARS)
 */
export function formatCurrencyARS(amount = 0) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Determina el estado del semáforo según el porcentaje consumido
 * Verde: < 75%
 * Amarillo: 75% - 90%
 * Rojo: > 90%
 */
export function getTrafficLightStatus(percentage = 0) {
  const pct = Number(percentage) || 0;

  if (pct >= 90) {
    return {
      color: 'red',
      severity: 'critical',
      label: 'Peligro Fiscal — Límite Próximo o Excedido',
      message: `Atención crítica: Has consumido el ${pct.toFixed(1)}% del tope anual. Estás en riesgo inminente de recategorización o exclusión del Monotributo.`
    };
  }

  if (pct >= 75) {
    return {
      color: 'yellow',
      severity: 'warning',
      label: 'Alerta Preventiva — Atención al Límite',
      message: `Has alcanzado el ${pct.toFixed(1)}% del tope de tu categoría. Te sugerimos moderar la emisión o consultar a tu contador.`
    };
  }

  return {
    color: 'green',
    severity: 'normal',
    label: 'Zona Segura — Categoría en Orden',
    message: 'Tu ritmo de facturación está dentro de los parámetros seguros para tu categoría actual.'
  };
}

/**
 * Realiza los cálculos analíticos integrales del perfil impositivo del cliente
 */
export function calculateCategoryConsumption({
  currentMonthSales = 0,
  rolling12mSales = 0,
  categoryScale = {},
  dayOfMonth = 1,
  totalDaysInMonth = 30
}) {
  const maxAnnual = Number(categoryScale.max_annual_billing) || 1;
  const maxMonthly = Number(categoryScale.max_monthly_average) || (maxAnnual / 12);

  const remainingAnnualMargin = Number((maxAnnual - rolling12mSales).toFixed(2));
  const annualConsumptionPercentage = Number(((rolling12mSales / maxAnnual) * 100).toFixed(1));
  const currentMonthPercentage = Number(((currentMonthSales / maxMonthly) * 100).toFixed(1));

  // Proyección de facturación a fin de mes según el día transcurrido
  const safeDay = Math.max(1, Math.min(dayOfMonth, totalDaysInMonth));
  const projectedMonthTotal = Number(((currentMonthSales / safeDay) * totalDaysInMonth).toFixed(2));

  const trafficLight = getTrafficLightStatus(annualConsumptionPercentage);

  return {
    category: categoryScale.category || 'A',
    maxAnnualBilling: maxAnnual,
    maxMonthlyAverage: maxMonthly,
    currentMonthSales: Number(currentMonthSales.toFixed(2)),
    rolling12mSales: Number(rolling12mSales.toFixed(2)),
    remainingAnnualMargin,
    annualConsumptionPercentage,
    currentMonthPercentage,
    projectedMonthTotal,
    trafficLight
  };
}
