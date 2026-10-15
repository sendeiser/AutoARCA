/**
 * CrmAccountView.jsx — Panel Integral de CRM Comercial & Cuentas Corrientes (Gen 2)
 * Permite a los comercios AutoARCA:
 * - Administrar clientes frecuentes y autorizaciones de fiado.
 * - Monitorear saldos adeudados en tiempo real.
 * - Registrar pagos y amortizaciones de deuda.
 * - Consultar el libro mayor de cuenta corriente.
 * - Enviar resúmenes y recordatorios de pago directamente a WhatsApp.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { crmService } from '../services/crmService.js';
import { soundService } from '../services/soundService.js';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { StatCard, StatGrid } from './untitled-ui/StatCard.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Modal } from './untitled-ui/Modal.jsx';
import { InputField } from './untitled-ui/InputField.jsx';
import {
  Table,
  TableContainer,
  TableToolbar,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from './untitled-ui/Table.jsx';
import {
  UsersIcon,
  SearchIcon,
  PlusIcon,
  BookOpenIcon,
  WhatsAppIcon,
  CheckCircleIcon,
  CashIcon,
  QrTransferIcon,
  CardIcon,
  ReceiptTaxIcon,
  BoltIcon,
  ClockIcon,
  AlertTriangleIcon
} from './Icons.jsx';
import '../styles/crmAccountView.css';

export default function CrmAccountView({
  businessProfile = {},
  onNavigateToPos
}) {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'debtors' | 'cleared'
  
  // Modales
  const [paymentModalCustomer, setPaymentModalCustomer] = useState(null);
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Formulario de Cobro
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Formulario de Cliente (Nuevo/Editar)
  const [formName, setFormName] = useState('');
  const [formDocType, setFormDocType] = useState('DNI');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('100000');
  const [formNotes, setFormNotes] = useState('');

  // Mensaje de feedback
  const [toastMessage, setToastMessage] = useState(null);

  const refreshData = () => {
    const list = crmService.getCustomers();
    setCustomers(list);
    setStats(crmService.getCrmStats());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Clientes filtrados
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Filtro por tab
      if (filterTab === 'debtors' && (c.current_debt || 0) <= 0) return false;
      if (filterTab === 'cleared' && (c.current_debt || 0) > 0) return false;

      // Filtro por búsqueda
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.doc_number || '').includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
  }, [customers, filterTab, searchTerm]);

  // Manejador para abrir modal de cobro
  const handleOpenPaymentModal = (customer) => {
    soundService.playKeyTap();
    setPaymentModalCustomer(customer);
    setPaymentAmount(String(customer.current_debt || ''));
    setPaymentMethod('cash');
    setPaymentNote('Cobro de saldo en local');
  };

  // Confirmar cobro de saldo
  const handleConfirmPayment = () => {
    if (!paymentModalCustomer) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Ingresa un importe válido a cobrar.');
      return;
    }

    try {
      crmService.recordCustomerPayment(
        paymentModalCustomer.id,
        amount,
        paymentMethod,
        paymentNote
      );
      soundService.playSuccess();
      showToast(`¡Pago de ${formatCurrencyARS(amount)} registrado para ${paymentModalCustomer.name}!`);
      setPaymentModalCustomer(null);
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Manejador para guardar cliente (nuevo o editar)
  const handleSaveCustomer = () => {
    if (!formName.trim()) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }

    try {
      crmService.saveCustomer({
        id: editingCustomer ? editingCustomer.id : undefined,
        name: formName,
        doc_type: formDocType,
        doc_number: formDocNumber,
        phone: formPhone,
        email: formEmail,
        credit_limit: Number(formCreditLimit) || 0,
        notes: formNotes,
        current_debt: editingCustomer ? editingCustomer.current_debt : 0
      });
      soundService.playSuccess();
      showToast(editingCustomer ? '¡Cliente actualizado con éxito!' : '¡Nuevo cliente registrado en CRM!');
      setIsNewCustomerModalOpen(false);
      setEditingCustomer(null);
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Abrir modal de nuevo cliente
  const handleOpenNewModal = () => {
    soundService.playKeyTap();
    setEditingCustomer(null);
    setFormName('');
    setFormDocType('DNI');
    setFormDocNumber('');
    setFormPhone('+54 9 11 ');
    setFormEmail('');
    setFormCreditLimit('100000');
    setFormNotes('');
    setIsNewCustomerModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (cust) => {
    soundService.playKeyTap();
    setEditingCustomer(cust);
    setFormName(cust.name || '');
    setFormDocType(cust.doc_type || 'DNI');
    setFormDocNumber(cust.doc_number || '');
    setFormPhone(cust.phone || '');
    setFormEmail(cust.email || '');
    setFormCreditLimit(String(cust.credit_limit || 0));
    setFormNotes(cust.notes || '');
    setIsNewCustomerModalOpen(true);
  };

  // Abrir libro mayor de cliente
  const handleOpenLedger = (cust) => {
    soundService.playKeyTap();
    setLedgerModalCustomer(cust);
  };

  // Enviar mensaje por WhatsApp
  const handleSendWhatsApp = (cust) => {
    soundService.playKeyTap();
    const { url } = crmService.generateWhatsAppDebtReminder(cust, businessProfile);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="crm-view-container">
      {/* Toast Feedback */}
      {toastMessage && <div className="crm-toast">{toastMessage}</div>}

      {/* Encabezado Principal */}
      <div className="crm-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="crm-title">Cuentas Corrientes & Clientes (CRM)</h1>
            <Badge variant="brand" hasDot={true}>
              Gen 2 Retail
            </Badge>
          </div>
          <p className="crm-subtitle">
            Control de fiados, límites de crédito comercial, cobros en mostrador y resúmenes de deuda por WhatsApp.
          </p>
        </div>

        <div className="crm-header-actions">
          <Button
            variant="secondary"
            size="md"
            iconLeading={<BoltIcon size={16} />}
            onClick={() => {
              soundService.playKeyTap();
              if (onNavigateToPos) onNavigateToPos();
            }}
          >
            Terminal POS
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeading={<PlusIcon size={16} />}
            onClick={handleOpenNewModal}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Métricas Estadísticas Ejecutivas */}
      <StatGrid>
        <StatCard
          label="Total por Cobrar (En la Calle)"
          value={formatCurrencyARS(stats?.totalDebtReceivable || 0)}
          icon={<ReceiptTaxIcon size={20} />}
          caption={`${stats?.debtorsCount || 0} clientes con deuda`}
          trend={stats?.totalDebtReceivable > 0 ? 'up' : 'neutral'}
          change={stats?.debtorsCount > 0 ? `${stats.debtorsCount} deudores` : 'Sin deuda'}
        />

        <StatCard
          label="Cobranzas del Mes"
          value={formatCurrencyARS(stats?.totalCollectedMonth || 0)}
          icon={<CashIcon size={20} />}
          caption="Pagos recibidos en el período"
          trend="up"
          change="Al día"
        />

        <StatCard
          label="Límite Total Concedido"
          value={formatCurrencyARS(stats?.totalCreditGranted || 0)}
          icon={<BookOpenIcon size={20} />}
          caption={`${(stats?.debtUtilizationRatio || 0).toFixed(1)}% utilizado`}
          trend="neutral"
        />

        <StatCard
          label="Cartera de Clientes"
          value={String(stats?.totalCustomers || 0)}
          icon={<UsersIcon size={20} />}
          caption="Libreta comercial activa"
          trend="neutral"
        />
      </StatGrid>

      {/* Barra de Filtros y Búsqueda */}
      <div className="crm-toolbar">
        <div className="crm-filter-tabs">
          <button
            type="button"
            className={`crm-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setFilterTab('all'); }}
          >
            Todos ({customers.length})
          </button>
          <button
            type="button"
            className={`crm-tab-btn ${filterTab === 'debtors' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setFilterTab('debtors'); }}
          >
            Con Saldo Deudor ({customers.filter((c) => (c.current_debt || 0) > 0).length})
          </button>
          <button
            type="button"
            className={`crm-tab-btn ${filterTab === 'cleared' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setFilterTab('cleared'); }}
          >
            Al Día ({customers.filter((c) => (c.current_debt || 0) <= 0).length})
          </button>
        </div>

        <div className="crm-search-wrap">
          <SearchIcon size={16} className="crm-search-icon" />
          <input
            type="text"
            className="crm-search-input"
            placeholder="Buscar por cliente, CUIT/DNI o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla Principal de Clientes */}
      <TableContainer>
        <TableToolbar>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Libreta de Cuentas Corrientes
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </TableToolbar>

        {filteredCustomers.length === 0 ? (
          <div className="crm-empty-state">
            <UsersIcon size={36} />
            <p>No se encontraron clientes para los filtros seleccionados.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Saldo Deudor</TableHead>
                <TableHead>Límite de Crédito</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((cust) => {
                const debt = Number(cust.current_debt || 0);
                const limit = Number(cust.credit_limit || 0);
                const pctUsed = limit > 0 ? Math.min(100, (debt / limit) * 100) : 0;
                const isOverLimit = limit > 0 && debt > limit;

                return (
                  <TableRow key={cust.id}>
                    {/* Cliente con Avatar */}
                    <TableCell>
                      <div className="crm-customer-cell">
                        <div className="crm-avatar">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="crm-customer-name">{cust.name}</div>
                          {cust.notes && <div className="crm-customer-notes">{cust.notes}</div>}
                        </div>
                      </div>
                    </TableCell>

                    {/* DNI / CUIT */}
                    <TableCell>
                      <span className="crm-doc-badge">
                        {cust.doc_type} {cust.doc_number || 'S/D'}
                      </span>
                    </TableCell>

                    {/* Contacto & WhatsApp */}
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {cust.phone || 'Sin tel'}
                        </span>
                        {cust.phone && (
                          <button
                            type="button"
                            className="crm-wa-mini-btn"
                            title="Abrir chat en WhatsApp"
                            onClick={() => handleSendWhatsApp(cust)}
                          >
                            <WhatsAppIcon size={13} />
                          </button>
                        )}
                      </div>
                    </TableCell>

                    {/* Saldo Deudor */}
                    <TableCell>
                      {debt > 0 ? (
                        <div>
                          <span className="crm-debt-amount">
                            {formatCurrencyARS(debt)}
                          </span>
                          {isOverLimit && (
                            <Badge variant="error" size="sm" hasDot={true}>
                              Supera Límite
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="brand" size="sm">
                          Al Día
                        </Badge>
                      )}
                    </TableCell>

                    {/* Límite de Crédito y Progreso */}
                    <TableCell>
                      <div className="crm-limit-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          <span>{formatCurrencyARS(limit)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{pctUsed.toFixed(0)}%</span>
                        </div>
                        <div className="crm-progress-track">
                          <div
                            className={`crm-progress-bar ${isOverLimit ? 'overlimit' : ''}`}
                            style={{ width: `${pctUsed}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell style={{ textAlign: 'right' }}>
                      <div className="crm-actions-row">
                        {debt > 0 && (
                          <Button
                            variant="primary"
                            size="sm"
                            iconLeading={<CashIcon size={14} />}
                            onClick={() => handleOpenPaymentModal(cust)}
                          >
                            Cobrar
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeading={<BookOpenIcon size={14} />}
                          onClick={() => handleOpenLedger(cust)}
                        >
                          Cuenta
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditModal(cust)}
                        >
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* MODAL 1: REGISTRAR COBRO / PAGO DE SALDO */}
      {paymentModalCustomer && (
        <Modal
          isOpen={Boolean(paymentModalCustomer)}
          onClose={() => setPaymentModalCustomer(null)}
          title={`Registrar Cobro: ${paymentModalCustomer.name}`}
          subtitle={`Saldo total pendiente: ${formatCurrencyARS(paymentModalCustomer.current_debt || 0)}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPaymentModalCustomer(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                iconLeading={<CheckCircleIcon size={16} />}
                onClick={handleConfirmPayment}
              >
                Confirmar Cobro
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Atajos Rápidos de Pago */}
            <div>
              <label className="uui-input-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                Atajos de Cancelación
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="crm-quick-pay-btn"
                  onClick={() => setPaymentAmount(String(paymentModalCustomer.current_debt || 0))}
                >
                  Total: {formatCurrencyARS(paymentModalCustomer.current_debt || 0)}
                </button>
                <button
                  type="button"
                  className="crm-quick-pay-btn"
                  onClick={() => setPaymentAmount(String(Math.round((paymentModalCustomer.current_debt || 0) / 2)))}
                >
                  50%: {formatCurrencyARS(Math.round((paymentModalCustomer.current_debt || 0) / 2))}
                </button>
                <button
                  type="button"
                  className="crm-quick-pay-btn"
                  onClick={() => setPaymentAmount(String(Math.round((paymentModalCustomer.current_debt || 0) / 4)))}
                >
                  25%: {formatCurrencyARS(Math.round((paymentModalCustomer.current_debt || 0) / 4))}
                </button>
              </div>
            </div>

            <InputField
              label="Importe Recibido ($)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
            />

            {/* Medio de Cobro */}
            <div className="uui-input-wrap">
              <label className="uui-input-label">Medio de Cobro</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`payment-chip ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <CashIcon size={14} /> Efectivo
                </button>
                <button
                  type="button"
                  className={`payment-chip ${paymentMethod === 'transfer' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('transfer')}
                >
                  <QrTransferIcon size={14} /> Transf.
                </button>
                <button
                  type="button"
                  className={`payment-chip ${paymentMethod === 'debit' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('debit')}
                >
                  <CardIcon size={14} /> Débito
                </button>
                <button
                  type="button"
                  className={`payment-chip ${paymentMethod === 'credit' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('credit')}
                >
                  <CardIcon size={14} /> Crédito
                </button>
              </div>
            </div>

            <InputField
              label="Detalle / Observaciones"
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Ej. Cobro en efectivo en mostrador"
            />
          </div>
        </Modal>
      )}

      {/* MODAL 2: LIBRO MAYOR / CUENTA CORRIENTE */}
      {ledgerModalCustomer && (
        <Modal
          isOpen={Boolean(ledgerModalCustomer)}
          onClose={() => setLedgerModalCustomer(null)}
          title={`Cuenta Corriente: ${ledgerModalCustomer.name}`}
          subtitle={`DNI/CUIT: ${ledgerModalCustomer.doc_number || 'S/D'} · Saldo Actual: ${formatCurrencyARS(ledgerModalCustomer.current_debt || 0)}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                variant="secondary"
                size="md"
                iconLeading={<WhatsAppIcon size={16} />}
                onClick={() => handleSendWhatsApp(ledgerModalCustomer)}
              >
                Enviar Resumen por WhatsApp
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setLedgerModalCustomer(null)}
              >
                Cerrar
              </Button>
            </div>
          }
        >
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {crmService.getCustomerMovements(ledgerModalCustomer.id).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No hay movimientos registrados para este cliente.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-muted)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Concepto</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Debe</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Haber</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {crmService.getCustomerMovements(ledgerModalCustomer.id).map((m) => {
                    const isDebt = m.type === 'debt';
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                        <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                          {new Date(m.date).toLocaleDateString('es-AR')}
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{m.concept}</div>
                          {m.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.notes}</div>}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: isDebt ? '#f59e0b' : 'inherit' }}>
                          {isDebt ? formatCurrencyARS(m.amount) : '-'}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: !isDebt ? '#10b981' : 'inherit' }}>
                          {!isDebt ? formatCurrencyARS(m.amount) : '-'}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrencyARS(m.running_balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 3: NUEVO O EDITAR CLIENTE */}
      {isNewCustomerModalOpen && (
        <Modal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          title={editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : 'Registrar Nuevo Cliente'}
          subtitle="Completa los datos comerciales y asigna el límite de crédito para fiados."
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsNewCustomerModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveCustomer}
              >
                Guardar Cliente
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <InputField
              label="Nombre Completo / Razón Social *"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Juan Carlos Pérez"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
              <div className="uui-input-wrap">
                <label className="uui-input-label">Tipo Doc.</label>
                <select
                  className="uui-input-box"
                  value={formDocType}
                  onChange={(e) => setFormDocType(e.target.value)}
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              <InputField
                label="Número de Documento"
                type="text"
                value={formDocNumber}
                onChange={(e) => setFormDocNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ej. 28491823"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <InputField
                label="Teléfono Celular (WhatsApp)"
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+54 9 11 1234 5678"
              />

              <InputField
                label="Email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </div>

            <InputField
              label="Límite de Crédito / Fiado Autorizado ($)"
              type="number"
              value={formCreditLimit}
              onChange={(e) => setFormCreditLimit(e.target.value)}
              placeholder="100000"
            />

            <InputField
              label="Notas / Horarios / Observaciones"
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Ej. Paga todos los viernes, retira empleado autorizado"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
