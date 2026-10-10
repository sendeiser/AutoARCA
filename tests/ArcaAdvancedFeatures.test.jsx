import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  calculateBankCrossingRisk,
  calculateExpenseLimitRisk,
  calculateVepStatus,
  calculateDfeBusinessDaysRemaining
} from '../src/services/taxAlertEngine.js';
import BankCrossingMonitor from '../src/components/BankCrossingMonitor.jsx';
import ExpensePurchaseLimitMonitor from '../src/components/ExpensePurchaseLimitMonitor.jsx';
import DfeNotificationCenter from '../src/components/DfeNotificationCenter.jsx';
import VepPaymentModal from '../src/components/VepPaymentModal.jsx';
import OfficialConstanciaInscripcionModal from '../src/components/OfficialConstanciaInscripcionModal.jsx';
import RecurringBillingManager from '../src/components/RecurringBillingManager.jsx';

describe('Suite de Funcionalidades Avanzadas ARCA 2026', () => {
  describe('1. Motor Analítico de Cruce Bancario (Art. 20 inc. f y g)', () => {
    it('detecta conciliación en orden cuando los depósitos coinciden con lo facturado', () => {
      const risk = calculateBankCrossingRisk({
        totalInvoiced: 5000000,
        totalBankDeposits: 5000000,
        nonTaxableDeposits: 0,
        categoryMaxAnnual: 16450000,
        categoryKMaxAnnual: 68000000
      });
      expect(risk.status).toBe('green');
      expect(risk.uninvoicedGap).toBe(0);
      expect(risk.severity).toBe('normal');
    });

    it('alerta brecha no facturada cuando depósitos superan facturación en más del 20%', () => {
      const risk = calculateBankCrossingRisk({
        totalInvoiced: 2000000,
        totalBankDeposits: 4000000,
        nonTaxableDeposits: 0,
        categoryMaxAnnual: 16450000,
        categoryKMaxAnnual: 68000000
      });
      expect(risk.status).toBe('yellow');
      expect(risk.uninvoicedGap).toBe(2000000);
      expect(risk.gapPercentage).toBe(50);
    });

    it('detecta peligro crítico de exclusión cuando los depósitos superan el tope de categoría o Cat K', () => {
      const risk = calculateBankCrossingRisk({
        totalInvoiced: 5000000,
        totalBankDeposits: 75000000,
        nonTaxableDeposits: 0,
        categoryMaxAnnual: 16450000,
        categoryKMaxAnnual: 68000000
      });
      expect(risk.status).toBe('red');
      expect(risk.severity).toBe('critical');
    });
  });

  describe('2. Control de Compras e Insumos Máximos (Art. 20 inc. c)', () => {
    it('calcula el 40% del tope de Cat K para servicios y el 80% para bienes', () => {
      const serv = calculateExpenseLimitRisk({
        totalExpenses: 10000000,
        activityType: 'servicios',
        categoryKMaxAnnual: 68000000
      });
      expect(serv.legalLimit).toBe(27200000); // 40% de 68M

      const bienes = calculateExpenseLimitRisk({
        totalExpenses: 20000000,
        activityType: 'bienes',
        categoryKMaxAnnual: 68000000
      });
      expect(bienes.legalLimit).toBe(54400000); // 80% de 68M
    });

    it('alerta rojo cuando las compras superan el 90% del límite legal', () => {
      const risk = calculateExpenseLimitRisk({
        totalExpenses: 25000000,
        activityType: 'servicios',
        categoryKMaxAnnual: 68000000
      });
      expect(risk.status).toBe('red');
      expect(risk.consumptionPercentage).toBeGreaterThanOrEqual(90);
    });
  });

  describe('3. Vencimiento de Cuota y VEP ARCA', () => {
    it('calcula la fecha de vencimiento del día 20 y los intereses por mora', () => {
      const onTime = calculateVepStatus({
        category: 'D',
        cuotaAmount: 52800,
        targetYear: 2026,
        targetMonth: 9, // Octubre
        today: new Date(2026, 9, 10)
      });
      expect(onTime.isOverdue).toBe(false);
      expect(onTime.totalAmountToPay).toBe(52800);

      const overdue = calculateVepStatus({
        category: 'D',
        cuotaAmount: 52800,
        targetYear: 2026,
        targetMonth: 9,
        today: new Date(2026, 9, 25)
      });
      expect(overdue.isOverdue).toBe(true);
      expect(overdue.compensatoryInterest).toBeGreaterThan(0);
      expect(overdue.totalAmountToPay).toBeGreaterThan(52800);
    });
  });

  describe('4. Plazos Legales DFE (15 días hábiles)', () => {
    it('calcula los días hábiles restantes excluyendo fines de semana', () => {
      const result = calculateDfeBusinessDaysRemaining({
        notificationDate: '2026-10-01',
        currentDate: '2026-10-05'
      });
      expect(result.remainingBusinessDays).toBeGreaterThan(0);
      expect(result.isExpired).toBe(false);
    });
  });

  describe('5. Componentes de UI de Novedades ARCA', () => {
    it('renderiza BankCrossingMonitor y permite simular depósitos extras', () => {
      render(
        <BankCrossingMonitor
          currentInvoiced={6850000}
          categoryScale={{ category: 'D', max_annual_billing: 16450000 }}
          categoryKMax={68000000}
        />
      );
      expect(screen.getByText(/Cruce Bancario & Billeteras Virtuales vs Facturación/i)).toBeInTheDocument();
      expect(screen.getByText(/Acreditaciones Netas/i)).toBeInTheDocument();

      // Click chip +$500.000
      const chip = screen.getByText('+ $500.000');
      fireEvent.click(chip);
      expect(chip).toBeInTheDocument();
    });

    it('renderiza ExpensePurchaseLimitMonitor y permite alternar actividad', () => {
      render(
        <ExpensePurchaseLimitMonitor
          categoryKMax={68000000}
          initialExpenses={10000000}
          initialActivity="servicios"
        />
      );
      expect(screen.getByText(/Control de Compras e Insumos Máximos Permitidos/i)).toBeInTheDocument();
      const bienesBtn = screen.getByText(/Bienes \/ Comercio \(80%\)/i);
      fireEvent.click(bienesBtn);
      expect(bienesBtn).toHaveClass('active');
    });

    it('renderiza DfeNotificationCenter con notificaciones activas y modal de descargo', () => {
      render(
        <DfeNotificationCenter
          cuit="20-38491029-4"
          businessName="Comercio Test"
        />
      );
      expect(screen.getByText(/Domicilio Fiscal Electrónico \(DFE ARCA\)/i)).toBeInTheDocument();
      const descargoBtns = screen.getAllByText(/Descargo/i);
      expect(descargoBtns.length).toBeGreaterThan(0);

      // Abre modal de descargo
      fireEvent.click(descargoBtns[0]);
      expect(screen.getByText(/Asistente de Descargo para Presentaciones Digitales ARCA/i)).toBeInTheDocument();
    });

    it('renderiza VepPaymentModal con QR interoperable y datos de pago', () => {
      render(
        <VepPaymentModal
          isOpen={true}
          onClose={vi.fn()}
          category="D"
          cuotaAmount={52800}
        />
      );
      expect(screen.getByText(/Pago de Cuota Mensual ARCA/i)).toBeInTheDocument();
      expect(screen.getByText(/Escaneá con Mercado Pago \/ MODO \/ BNA\+/i)).toBeInTheDocument();
      expect(screen.getByText(/982739481923/i)).toBeInTheDocument();
    });

    it('renderiza OfficialConstanciaInscripcionModal con constancia y Formulario 152', () => {
      render(
        <OfficialConstanciaInscripcionModal
          isOpen={true}
          onClose={vi.fn()}
          businessProfile={{
            cuit: '20-38491029-4',
            razon_social: 'Panadería La Espiga',
            fantasy_name: 'La Espiga',
            category: 'D',
            cur: '1029384'
          }}
        />
      );
      expect(screen.getAllByText(/CONSTANCIA DE INSCRIPCIÓN/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/20-38491029-4/i)).toBeInTheDocument();

      // Cambiar a pestaña Credencial F. 152
      const credencialTab = screen.getByText(/Credencial de Pago \(F\. 152\)/i);
      fireEvent.click(credencialTab);
      expect(screen.getByText(/FORMULARIO 152/i)).toBeInTheDocument();
      expect(screen.getByText('1029384')).toBeInTheDocument();
    });

    it('renderiza RecurringBillingManager y emite lote en 1 clic', async () => {
      const handleBatch = vi.fn();
      window.confirm = vi.fn().mockReturnValue(true);

      render(
        <RecurringBillingManager
          onEmitBatchSales={handleBatch}
          businessProfile={{ cuit: '20-38491029-4' }}
        />
      );

      expect(screen.getByText(/Facturación Recurrente de Abonos Mensuales/i)).toBeInTheDocument();
      const emitBtn = screen.getByText(/Emitir Lote/i);

      await act(async () => {
        fireEvent.click(emitBtn);
      });

      expect(handleBatch).toHaveBeenCalled();
    });
  });
});
