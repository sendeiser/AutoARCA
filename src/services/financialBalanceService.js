/**
 * AutoARCA — Servicio de Balances y Estados Financieros Comerciales
 * Diseñado para Contadores Públicos (Presentación ante Bancos, SGR y Créditos).
 * Permite modelar el Estado de Situación Patrimonial, Estado de Resultados y Ratios Bancarios.
 */

export function calculateCommercialBalance({
  client = {},
  annualSales = null,
  rubro = 'comercio', // 'comercio' | 'gastronomia' | 'servicios'
  customCash = null,
  customInventory = null,
  customFixedAssets = null,
  customTradePayables = null,
  customBankDebt = null,
  customExpenseRatio = null
}) {
  const sales = Number(annualSales ?? client.rolling12mSales ?? 8400000);

  // 1. Parámetros típicos del rubro según estándares de la FACPCE y AFIP/ARCA
  const rubroDefaults = {
    comercio: { costRatio: 0.58, expenseRatio: 0.22, invRatio: 0.18, fixedRatio: 0.20 },
    gastronomia: { costRatio: 0.38, expenseRatio: 0.35, invRatio: 0.10, fixedRatio: 0.30 },
    servicios: { costRatio: 0.15, expenseRatio: 0.28, invRatio: 0.05, fixedRatio: 0.18 }
  };
  const activeParams = rubroDefaults[rubro] || rubroDefaults.comercio;

  // 2. Estado de Resultados (12 Meses)
  const costOfSales = Math.round(sales * activeParams.costRatio);
  const grossProfit = Math.max(0, sales - costOfSales);
  const effectiveExpenseRatio = customExpenseRatio !== null ? Number(customExpenseRatio) : activeParams.expenseRatio;
  const operatingExpenses = Math.round(sales * effectiveExpenseRatio);
  const netOperatingIncome = Math.max(0, grossProfit - operatingExpenses);
  const netMarginPct = sales > 0 ? Number(((netOperatingIncome / sales) * 100).toFixed(1)) : 0;
  const monthlyNetIncome = Math.round(netOperatingIncome / 12);

  // 3. Estado de Situación Patrimonial
  // Activo Corriente
  const cashAndBank = customCash !== null ? Number(customCash) : Math.round(sales * 0.14);
  const accountsReceivable = Math.round(sales * 0.08); // Ventas en cuenta corriente / cupones POS a acreditar
  const inventory = customInventory !== null ? Number(customInventory) : Math.round(sales * activeParams.invRatio);
  const totalCurrentAssets = cashAndBank + accountsReceivable + inventory;

  // Activo No Corriente
  const fixedAssets = customFixedAssets !== null ? Number(customFixedAssets) : Math.round(sales * activeParams.fixedRatio);
  const totalNonCurrentAssets = fixedAssets;
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  // Pasivo Corriente
  const tradePayables = customTradePayables !== null ? Number(customTradePayables) : Math.round(costOfSales * 0.12);
  const taxPayables = Math.round(sales * 0.025); // Monotributo mensual e IIBB devengados
  const shortTermDebt = customBankDebt !== null ? Number(customBankDebt) : 0;
  const totalCurrentLiabilities = tradePayables + taxPayables + shortTermDebt;

  // Pasivo No Corriente
  const totalNonCurrentLiabilities = 0;
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  // Patrimonio Neto
  const netWorth = Math.max(1, totalAssets - totalLiabilities);

  // 4. Ratios Financieros para Calificación Bancaria (BCRA / SGR)
  // Ratio de Liquidez Corriente (Activo Corriente / Pasivo Corriente)
  const currentRatio = totalCurrentLiabilities > 0
    ? Number((totalCurrentAssets / totalCurrentLiabilities).toFixed(2))
    : 3.5;

  // Ratio de Solvencia (Patrimonio Neto / Pasivo Total)
  const solvencyRatio = totalLiabilities > 0
    ? Number((netWorth / totalLiabilities).toFixed(2))
    : 4.0;

  // Ratio de Endeudamiento (Pasivo Total / Activo Total) en %
  const leveragePct = totalAssets > 0
    ? Number(((totalLiabilities / totalAssets) * 100).toFixed(1))
    : 0;

  // Capacidad Máxima de Cuota Crediticia Mensual (Afectación max 30% del ingreso neto disponible)
  const maxCreditInstallmentMonthly = Math.round(monthlyNetIncome * 0.30);

  // Evaluación Crediticia Bancaria
  let creditRating = 'APROBADO_BANCARIO';
  let creditScoreText = 'Excelente Perfil Crediticio';
  let creditVerdict = 'Apto para Préstamos Comerciales y Descubierto en C/C';
  let badgeVariant = 'success';

  if (currentRatio < 1.1 || leveragePct > 70) {
    creditRating = 'OBSERVADO';
    creditScoreText = 'Perfil con Endeudamiento Ajustado';
    creditVerdict = 'Requiere Fianza o Garantía de SGR para Aprobación';
    badgeVariant = 'warning';
  } else if (currentRatio < 0.9 || netMarginPct < 5) {
    creditRating = 'RIESGO';
    creditScoreText = 'Capacidad de Repago Reducida';
    creditVerdict = 'No Recomendado para Nuevas Líneas de Crédito sin Aval Real';
    badgeVariant = 'error';
  }

  return {
    client,
    period: `${new Date().getFullYear() - 1} - ${new Date().getFullYear()}`,
    rubro,
    financialStatements: {
      incomeStatement: {
        annualSales: sales,
        costOfSales,
        grossProfit,
        operatingExpenses,
        netOperatingIncome,
        netMarginPct,
        monthlyNetIncome
      },
      balanceSheet: {
        assets: {
          current: {
            cashAndBank,
            accountsReceivable,
            inventory,
            total: totalCurrentAssets
          },
          nonCurrent: {
            fixedAssets,
            total: totalNonCurrentAssets
          },
          totalAssets
        },
        liabilities: {
          current: {
            tradePayables,
            taxPayables,
            shortTermDebt,
            total: totalCurrentLiabilities
          },
          nonCurrent: {
            total: totalNonCurrentLiabilities
          },
          totalLiabilities
        },
        netWorth
      }
    },
    ratios: {
      currentRatio,
      solvencyRatio,
      leveragePct,
      maxCreditInstallmentMonthly,
      creditRating,
      creditScoreText,
      creditVerdict,
      badgeVariant
    }
  };
}
