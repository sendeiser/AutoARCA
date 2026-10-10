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

/**
 * Cruce Bancario & Billeteras Virtuales vs Facturación (Art. 20 inc. f y g Ley 24.977)
 * Evalúa el riesgo de exclusión de oficio por depósitos no justificados o superiores al tope.
 */
export function calculateBankCrossingRisk({
  totalInvoiced = 0,
  totalBankDeposits = 0,
  nonTaxableDeposits = 0,
  categoryMaxAnnual = 16450000,
  categoryKMaxAnnual = 68000000
}) {
  const netCommercial = Math.max(0, Number(totalBankDeposits) - Number(nonTaxableDeposits));
  const uninvoicedGap = Math.max(0, netCommercial - Number(totalInvoiced));
  const gapPercentage = netCommercial > 0 ? Number(((uninvoicedGap / netCommercial) * 100).toFixed(1)) : 0;
  const bankVsCategoryPercentage = Number(((netCommercial / categoryMaxAnnual) * 100).toFixed(1));

  let status = 'green';
  let severity = 'normal';
  let title = 'Conciliación Bancaria Saludable';
  let message = 'Tus acreditaciones en bancos y billeteras están alineadas con la facturación emitida ante ARCA.';

  if (netCommercial > categoryKMaxAnnual) {
    status = 'red';
    severity = 'critical';
    title = 'Peligro Crítico: Exclusión de Oficio del Régimen';
    message = `Las acreditaciones netas (${formatCurrencyARS(netCommercial)}) superan el tope absoluto del Monotributo Cat. K (${formatCurrencyARS(categoryKMaxAnnual)}). ARCA puede dar la baja de oficio inmediata y transferirte a Responsable Inscripto.`;
  } else if (netCommercial > categoryMaxAnnual) {
    status = 'red';
    severity = 'critical';
    title = 'Alerta Roja: Depósitos Superan tu Categoría';
    message = `Tus acreditaciones (${formatCurrencyARS(netCommercial)}) exceden el tope anual de tu categoría actual (${formatCurrencyARS(categoryMaxAnnual)}). Riesgo inminente de recategorización de oficio por ARCA.`;
  } else if (uninvoicedGap > 0 && gapPercentage >= 20) {
    status = 'yellow';
    severity = 'warning';
    title = 'Alerta Preventiva: Brecha No Facturada Detectada';
    message = `Posees una brecha de ${formatCurrencyARS(uninvoicedGap)} (${gapPercentage}% de tus depósitos) sin comprobantes de respaldo emitidos. Recomendamos emitir facturas C para evitar intimaciones.`;
  }

  return {
    netCommercialDeposits: netCommercial,
    uninvoicedGap,
    gapPercentage,
    bankVsCategoryPercentage,
    status,
    severity,
    title,
    message
  };
}

/**
 * Control de Compras y Gastos Máximos Permitidos (Art. 20 inc. c Ley Monotributo)
 * Límite legal: 80% (Bienes) o 40% (Servicios) del tope de la Categoría K.
 */
export function calculateExpenseLimitRisk({
  totalExpenses = 0,
  activityType = 'servicios', // 'servicios' | 'bienes'
  categoryKMaxAnnual = 68000000
}) {
  const isBienes = activityType.toLowerCase() === 'bienes' || activityType.toLowerCase() === 'comercio';
  const ratio = isBienes ? 0.80 : 0.40;
  const legalLimit = Number((categoryKMaxAnnual * ratio).toFixed(2));
  const currentExpenses = Number(totalExpenses) || 0;
  const consumptionPercentage = Number(((currentExpenses / legalLimit) * 100).toFixed(1));
  const remainingMargin = Math.max(0, legalLimit - currentExpenses);

  let status = 'green';
  let label = 'Compras dentro de la Norma';
  let message = `Has utilizado el ${consumptionPercentage}% del tope legal de compras permitido (${isBienes ? '80%' : '40%'} de Cat. K).`;

  if (consumptionPercentage >= 90) {
    status = 'red';
    label = 'Riesgo Crítico de Exclusión por Compras Excesivas';
    message = `Atención: Compras acumuladas por ${formatCurrencyARS(currentExpenses)} están al ${consumptionPercentage}% del límite legal (${formatCurrencyARS(legalLimit)}). Superar este límite causa exclusión de pleno derecho.`;
  } else if (consumptionPercentage >= 75) {
    status = 'yellow';
    label = 'Atención a Compras e Insumos';
    message = `Tus compras acumuladas alcanzaron el ${consumptionPercentage}% del límite. Modera la recepción de comprobantes de compras comerciales.`;
  }

  return {
    activityType: isBienes ? 'Venta de Bienes Muebles (80%)' : 'Locación y Prestación de Servicios (40%)',
    legalLimit,
    currentExpenses,
    remainingMargin,
    consumptionPercentage,
    status,
    label,
    message
  };
}

/**
 * Cálculo de Vencimiento de Cuota y Estado de VEP
 * Vence el 20 de cada mes (o siguiente día hábil).
 */
export function calculateVepStatus({
  category = 'D',
  cuotaAmount = 52800,
  targetYear,
  targetMonth,
  today = new Date()
}) {
  const now = today instanceof Date ? today : new Date(today);
  const year = targetYear || now.getFullYear();
  const month = targetMonth !== undefined ? targetMonth : now.getMonth();

  // Día 20 del mes actual
  let dueDate = new Date(year, month, 20);
  // Si cae sábado (6), pasa a lunes (día 22). Si cae domingo (0), pasa a lunes (día 21)
  if (dueDate.getDay() === 6) {
    dueDate.setDate(22);
  } else if (dueDate.getDay() === 0) {
    dueDate.setDate(21);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / msPerDay);
  const isOverdue = diffDays < 0;
  const overdueDays = isOverdue ? Math.abs(diffDays) : 0;

  // Tasa de interés resarcitorio estimada diaria (~0.13% diario)
  const dailyInterestRate = 0.0013;
  const compensatoryInterest = isOverdue ? Number((cuotaAmount * dailyInterestRate * overdueDays).toFixed(2)) : 0;
  const totalAmountToPay = Number((cuotaAmount + compensatoryInterest).toFixed(2));

  return {
    category,
    cuotaAmount,
    dueDate: dueDate.toISOString().slice(0, 10),
    dueDateFormatted: dueDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    diffDays,
    isOverdue,
    overdueDays,
    compensatoryInterest,
    totalAmountToPay
  };
}

/**
 * Cálculo de Días Hábiles Restantes para Notificaciones DFE de ARCA (15 días hábiles)
 */
export function calculateDfeBusinessDaysRemaining({
  notificationDate,
  daysAllowed = 15,
  currentDate = new Date()
}) {
  const notif = new Date(notificationDate);
  const now = currentDate instanceof Date ? currentDate : new Date(currentDate);

  let addedBusinessDays = 0;
  let cursor = new Date(notif);

  // Calcula la fecha límite sumando 15 días hábiles (excluyendo sábados y domingos)
  while (addedBusinessDays < daysAllowed) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      addedBusinessDays++;
    }
  }

  const deadlineDate = new Date(cursor);
  
  // Calcula días hábiles restantes desde hoy hasta deadlineDate
  let remainingBusinessDays = 0;
  let countCursor = new Date(now);
  countCursor.setHours(0, 0, 0, 0);
  const targetEnd = new Date(deadlineDate);
  targetEnd.setHours(0, 0, 0, 0);

  const isExpired = countCursor > targetEnd;

  if (!isExpired) {
    while (countCursor < targetEnd) {
      countCursor.setDate(countCursor.getDate() + 1);
      const day = countCursor.getDay();
      if (day !== 0 && day !== 6) {
        remainingBusinessDays++;
      }
    }
  }

  return {
    notificationDate: notif.toISOString().slice(0, 10),
    deadlineDate: deadlineDate.toISOString().slice(0, 10),
    deadlineFormatted: deadlineDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    remainingBusinessDays,
    isExpired
  };
}
