import { describe, it, expect, beforeEach } from 'vitest';
import { crmService } from '../src/services/crmService.js';

describe('crmService — CRM Comercial y Cuentas Corrientes', () => {
  beforeEach(() => {
    crmService.resetToDefaults();
  });

  it('obtiene la lista inicial de clientes semilla', () => {
    const customers = crmService.getCustomers();
    expect(customers.length).toBeGreaterThanOrEqual(4);
    const juan = customers.find((c) => c.name.includes('Juan Carlos Pérez'));
    expect(juan).toBeDefined();
    expect(juan.current_debt).toBe(24500);
    expect(juan.credit_limit).toBe(80000);
  });

  it('permite registrar un nuevo cliente con límite de crédito', () => {
    const newCust = crmService.saveCustomer({
      name: 'Lucía Fernández',
      doc_type: 'DNI',
      doc_number: '34567890',
      phone: '+5491155667788',
      email: 'lucia@test.com',
      credit_limit: 120000,
      notes: 'Clienta habitual'
    });

    expect(newCust.id).toBeDefined();
    expect(newCust.name).toBe('Lucía Fernández');
    expect(newCust.current_debt).toBe(0);

    const retrieved = crmService.getCustomerById(newCust.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.credit_limit).toBe(120000);
  });

  it('actualiza un cliente existente sin duplicarlo', () => {
    const customers = crmService.getCustomers();
    const target = customers[0];

    crmService.saveCustomer({
      id: target.id,
      name: 'Juan Carlos Pérez (Actualizado)',
      credit_limit: 95000
    });

    const updated = crmService.getCustomerById(target.id);
    expect(updated.name).toBe('Juan Carlos Pérez (Actualizado)');
    expect(updated.credit_limit).toBe(95000);
  });

  it('elimina un cliente correctamente', () => {
    const customers = crmService.getCustomers();
    const countBefore = customers.length;
    const target = customers[customers.length - 1];

    crmService.deleteCustomer(target.id);

    const customersAfter = crmService.getCustomers();
    expect(customersAfter.length).toBe(countBefore - 1);
    expect(crmService.getCustomerById(target.id)).toBeNull();
  });

  it('imputa una deuda (compra fiada / a cuenta) e incrementa el saldo', () => {
    const customer = crmService.getCustomerById('cust-1');
    const initialDebt = customer.current_debt;

    const { customer: updated, movement } = crmService.recordCustomerDebt('cust-1', {
      id: 'sale-999',
      amount: 5000,
      notes: 'Compra de mercadería'
    });

    expect(updated.current_debt).toBe(initialDebt + 5000);
    expect(movement.amount).toBe(5000);
    expect(movement.type).toBe('debt');
    expect(movement.payment_method).toBe('account');

    // Verificar en el libro mayor
    const movements = crmService.getCustomerMovements('cust-1');
    expect(movements.some((m) => m.id === movement.id)).toBe(true);
  });

  it('rechaza imputaciones de deuda con importe negativo o cero', () => {
    expect(() => {
      crmService.recordCustomerDebt('cust-1', { amount: 0 });
    }).toThrow(/mayor a cero/i);

    expect(() => {
      crmService.recordCustomerDebt('cust-1', { amount: -500 });
    }).toThrow(/mayor a cero/i);
  });

  it('registra pagos / cobros de deuda y amortiza el saldo deudor', () => {
    const customer = crmService.getCustomerById('cust-2'); // Tiene 68.000 de deuda
    expect(customer.current_debt).toBe(68000);

    const { customer: updated, movement } = crmService.recordCustomerPayment(
      'cust-2',
      20000,
      'transfer',
      'Transferencia Mercado Pago'
    );

    expect(updated.current_debt).toBe(48000);
    expect(movement.type).toBe('payment');
    expect(movement.amount).toBe(20000);
    expect(movement.payment_method).toBe('transfer');
  });

  it('no permite que el saldo sea negativo si el pago excede la deuda', () => {
    const { customer: updated } = crmService.recordCustomerPayment('cust-4', 50000, 'cash');
    expect(updated.current_debt).toBe(0);
  });

  it('calcula las estadísticas del CRM comercial adecuadamente', () => {
    const stats = crmService.getCrmStats();

    expect(stats.totalCustomers).toBeGreaterThanOrEqual(4);
    expect(stats.totalDebtReceivable).toBeGreaterThan(0);
    expect(stats.debtorsCount).toBeGreaterThan(0);
    expect(stats.totalCreditGranted).toBeGreaterThan(0);
    expect(stats.debtUtilizationRatio).toBeGreaterThan(0);
    expect(Array.isArray(stats.topDebtors)).toBe(true);
  });

  it('genera enlace y texto de recordatorio para WhatsApp con el saldo correcto', () => {
    const customer = crmService.getCustomerById('cust-1');
    const { text, url, phone } = crmService.generateWhatsAppDebtReminder(customer, {
      fantasy_name: 'Minimercado Central'
    });

    const expectedDebtStr = Number(customer.current_debt || 0).toLocaleString('es-AR');
    expect(text).toContain('Juan Carlos Pérez');
    expect(text).toContain('Minimercado Central');
    expect(text).toContain(expectedDebtStr);
    expect(url).toContain('https://wa.me/5491154829102');
    expect(url).toContain(encodeURIComponent(expectedDebtStr));
    expect(phone).toBe('5491154829102');
  });
});
