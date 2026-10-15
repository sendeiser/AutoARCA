/**
 * Servicio de CRM Comercial y Gestión de Cuentas Corrientes (Fiados / Créditos de Clientes)
 * Para comercios minoristas y monotributistas AutoARCA (Gen 2).
 * 
 * Permite:
 * 1. Directorio de clientes frecuentes con límite de crédito asignado.
 * 2. Imputación de ventas "A Cuenta / Fiado" desde la terminal POS.
 * 3. Registro de cobros / pagos parciales o totales de deuda.
 * 4. Libro mayor (ledger) con saldo histórico cronológico.
 * 5. Generación de resúmenes de deuda con enlace directo a WhatsApp.
 */

const STORAGE_CUSTOMERS_KEY = 'autoarca_crm_customers';
const STORAGE_MOVEMENTS_KEY = 'autoarca_crm_movements';

// Clientes semilla de demostración realistas para comercio argentino
export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Juan Carlos Pérez',
    doc_type: 'DNI',
    doc_number: '28491823',
    phone: '+5491154829102',
    email: 'juancarlos.perez@gmail.com',
    credit_limit: 80000,
    current_debt: 24500,
    notes: 'Cliente vecino, retira mercadería y liquida los viernes',
    status: 'active',
    created_at: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'cust-2',
    name: 'María Elena Gómez',
    doc_type: 'DNI',
    doc_number: '31920144',
    phone: '+5491140928172',
    email: 'mariagomez.estudio@hotmail.com',
    credit_limit: 150000,
    current_debt: 68000,
    notes: 'Cuenta abierta autorizada. Paga por transferencia mensual',
    status: 'active',
    created_at: '2026-09-01T14:30:00.000Z'
  },
  {
    id: 'cust-3',
    name: 'Panadería San Cayetano (Carlos Rossi)',
    doc_type: 'CUIT',
    doc_number: '20184920194',
    phone: '+5491168291044',
    email: 'sancayetano.pedidos@yahoo.com.ar',
    credit_limit: 200000,
    current_debt: 0,
    notes: 'Proveedor y cliente mayorista cruzado. Siempre al día',
    status: 'active',
    created_at: '2026-09-10T09:15:00.000Z'
  },
  {
    id: 'cust-4',
    name: 'Dra. Silvina Batakis',
    doc_type: 'DNI',
    doc_number: '26102934',
    phone: '+5491138291022',
    email: 'silvina.batakis@consultorios.com.ar',
    credit_limit: 60000,
    current_debt: 12800,
    notes: 'Consultorio a la vuelta. Retira insumos semanalmente',
    status: 'active',
    created_at: '2026-09-20T11:45:00.000Z'
  }
];

// Movimientos iniciales de cuenta corriente
export const INITIAL_MOVEMENTS = [
  {
    id: 'mov-1',
    customer_id: 'cust-1',
    type: 'debt', // 'debt' (compra a crédito) | 'payment' (cobro / entrega)
    amount: 15000,
    concept: 'Compra en POS - Comprobante Factura C #0001-00001045',
    payment_method: 'account',
    date: '2026-10-05T12:30:00.000Z',
    notes: 'Retiro de mercadería'
  },
  {
    id: 'mov-2',
    customer_id: 'cust-1',
    type: 'debt',
    amount: 9500,
    concept: 'Compra en POS - Comprobante Factura C #0001-00001089',
    payment_method: 'account',
    date: '2026-10-09T18:15:00.000Z',
    notes: 'Gasto de almacén'
  },
  {
    id: 'mov-3',
    customer_id: 'cust-2',
    type: 'debt',
    amount: 98000,
    concept: 'Compra a cuenta - Comprobante Factura C #0001-00000998',
    payment_method: 'account',
    date: '2026-10-02T16:00:00.000Z',
    notes: 'Insumos varios'
  },
  {
    id: 'mov-4',
    customer_id: 'cust-2',
    type: 'payment',
    amount: 30000,
    concept: 'Pago a cuenta - Transferencia Bancaria',
    payment_method: 'transfer',
    date: '2026-10-08T11:00:00.000Z',
    notes: 'Comprobante transf. banco Galicia #849102'
  },
  {
    id: 'mov-5',
    customer_id: 'cust-4',
    type: 'debt',
    amount: 12800,
    concept: 'Compra en POS - Comprobante Factura C #0001-00001112',
    payment_method: 'account',
    date: '2026-10-10T15:20:00.000Z',
    notes: 'Artículos de oficina'
  }
];

class CrmService {
  constructor() {
    this._customers = null;
    this._movements = null;
  }

  _loadCustomers() {
    if (this._customers) return this._customers;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
        if (stored) {
          this._customers = JSON.parse(stored);
          return this._customers;
        }
      }
    } catch {
      // fallback
    }
    this._customers = [...INITIAL_CUSTOMERS];
    this._saveCustomers();
    return this._customers;
  }

  _saveCustomers() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(this._customers));
      }
    } catch {
      // ignore
    }
  }

  _loadMovements() {
    if (this._movements) return this._movements;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_MOVEMENTS_KEY);
        if (stored) {
          this._movements = JSON.parse(stored);
          return this._movements;
        }
      }
    } catch {
      // fallback
    }
    this._movements = [...INITIAL_MOVEMENTS];
    this._saveMovements();
    return this._movements;
  }

  _saveMovements() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_MOVEMENTS_KEY, JSON.stringify(this._movements));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Obtiene todos los clientes del CRM
   */
  getCustomers() {
    const list = this._loadCustomers();
    return [...list].sort((a, b) => (b.current_debt || 0) - (a.current_debt || 0));
  }

  /**
   * Obtiene cliente por ID
   */
  getCustomerById(id) {
    const list = this._loadCustomers();
    return list.find((c) => c.id === id) || null;
  }

  /**
   * Guarda o actualiza un cliente
   */
  saveCustomer(customerData) {
    const list = this._loadCustomers();
    const existingIndex = list.findIndex((c) => c.id === customerData.id);

    const safeData = {
      id: customerData.id || `cust-${Date.now()}`,
      name: String(customerData.name || '').trim(),
      doc_type: customerData.doc_type || 'DNI',
      doc_number: String(customerData.doc_number || '').trim(),
      phone: String(customerData.phone || '').trim(),
      email: String(customerData.email || '').trim(),
      credit_limit: Number(customerData.credit_limit) || 0,
      current_debt: Number(customerData.current_debt) || 0,
      notes: String(customerData.notes || '').trim(),
      status: customerData.status || 'active',
      created_at: customerData.created_at || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...safeData };
    } else {
      list.push(safeData);
    }

    this._customers = list;
    this._saveCustomers();
    return safeData;
  }

  /**
   * Elimina un cliente
   */
  deleteCustomer(id) {
    const list = this._loadCustomers();
    this._customers = list.filter((c) => c.id !== id);
    this._saveCustomers();
    return true;
  }

  /**
   * Imputa una compra a crédito (deuda / fiado) generada en POS
   */
  recordCustomerDebt(customerId, saleData) {
    const customer = this.getCustomerById(customerId);
    if (!customer) {
      throw new Error(`Cliente con ID ${customerId} no encontrado en el CRM.`);
    }

    const amount = Number(saleData.amount) || 0;
    if (amount <= 0) {
      throw new Error('El importe de la deuda debe ser mayor a cero.');
    }

    const newDebt = (customer.current_debt || 0) + amount;
    customer.current_debt = newDebt;

    const movement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customer_id: customerId,
      type: 'debt',
      amount,
      concept: `Venta POS #0001-${String(saleData.id || Date.now()).slice(-6)} - A Cuenta`,
      payment_method: 'account',
      date: new Date().toISOString(),
      notes: saleData.notes || 'Compra en Terminal POS (A Cuenta / Fiado)'
    };

    const movements = this._loadMovements();
    movements.push(movement);
    this._movements = movements;
    this._saveMovements();

    this.saveCustomer(customer);
    return { customer, movement };
  }

  /**
   * Registra un pago / cobro parcial o total de deuda
   */
  recordCustomerPayment(customerId, amount, paymentMethod = 'cash', notes = '') {
    const customer = this.getCustomerById(customerId);
    if (!customer) {
      throw new Error(`Cliente con ID ${customerId} no encontrado en el CRM.`);
    }

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      throw new Error('El importe del pago debe ser mayor a cero.');
    }

    const updatedDebt = Math.max(0, (customer.current_debt || 0) - numAmount);
    customer.current_debt = updatedDebt;

    const paymentLabels = {
      cash: 'Efectivo',
      transfer: 'Transferencia Bancaria / QR',
      debit: 'Tarjeta de Débito',
      credit: 'Tarjeta de Crédito'
    };

    const movement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customer_id: customerId,
      type: 'payment',
      amount: numAmount,
      concept: `Cobro de Saldo - ${paymentLabels[paymentMethod] || paymentMethod}`,
      payment_method: paymentMethod,
      date: new Date().toISOString(),
      notes: notes || 'Entrega a cuenta de saldo deudor'
    };

    const movements = this._loadMovements();
    movements.push(movement);
    this._movements = movements;
    this._saveMovements();

    this.saveCustomer(customer);
    return { customer, movement };
  }

  /**
   * Obtiene todos los movimientos históricos de cuenta corriente de un cliente
   */
  getCustomerMovements(customerId) {
    const all = this._loadMovements();
    const customerMovements = all
      .filter((m) => m.customer_id === customerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calcular saldo acumulado paso a paso
    let runningBalance = 0;
    return customerMovements.map((m) => {
      if (m.type === 'debt') {
        runningBalance += Number(m.amount);
      } else {
        runningBalance -= Number(m.amount);
      }
      return {
        ...m,
        running_balance: Math.max(0, runningBalance)
      };
    }).reverse(); // Más recientes primero para visualización
  }

  /**
   * Estadísticas ejecutivas de CRM para el dashboard comercial
   */
  getCrmStats() {
    const customers = this.getCustomers();
    const movements = this._loadMovements();

    const totalDebtReceivable = customers.reduce((acc, c) => acc + (Number(c.current_debt) || 0), 0);
    const debtors = customers.filter((c) => (Number(c.current_debt) || 0) > 0);
    const totalCreditGranted = customers.reduce((acc, c) => acc + (Number(c.credit_limit) || 0), 0);

    // Cobrado en el mes en curso
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const totalCollectedMonth = movements
      .filter((m) => {
        if (m.type !== 'payment') return false;
        const d = new Date(m.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, m) => acc + Number(m.amount || 0), 0);

    return {
      totalCustomers: customers.length,
      totalDebtReceivable,
      debtorsCount: debtors.length,
      totalCreditGranted,
      totalCollectedMonth,
      debtUtilizationRatio: totalCreditGranted > 0 ? (totalDebtReceivable / totalCreditGranted) * 100 : 0,
      topDebtors: [...debtors].sort((a, b) => b.current_debt - a.current_debt).slice(0, 5)
    };
  }

  /**
   * Genera el mensaje y enlace para WhatsApp Web / App
   */
  generateWhatsAppDebtReminder(customer, businessProfile = {}) {
    if (!customer) return { text: '', url: '' };

    const bizName = businessProfile.fantasy_name || businessProfile.razon_social || 'Nuestro Comercio';
    const debtFormatted = `$ ${Number(customer.current_debt || 0).toLocaleString('es-AR')}`;
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');

    const text = `Hola *${customer.name}*! 👋 Te saludamos de *${bizName}*.\n\nTe compartimos el estado de tu cuenta corriente al día de hoy:\n• Saldo pendiente: *${debtFormatted}*\n\nPodés abonarlo en el local o enviarnos el comprobante de transferencia a este mismo chat.\n\n¡Muchas gracias por tu confianza!`;

    const encodedText = encodeURIComponent(text);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

    return { text, url, phone: cleanPhone };
  }

  /**
   * Reinicia datos a los valores semilla iniciales (útil para pruebas y demos)
   */
  resetToDefaults() {
    this._customers = [...INITIAL_CUSTOMERS];
    this._movements = [...INITIAL_MOVEMENTS];
    this._saveCustomers();
    this._saveMovements();
    return true;
  }
}

export const crmService = new CrmService();
