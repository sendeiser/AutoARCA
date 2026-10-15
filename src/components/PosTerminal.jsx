/**
 * Terminal POS Táctil — Arquitectura de Componentes Compuestos (Vercel Composition Patterns)
 * Sigue las guías oficiales de vercel-labs/agent-skills:
 * - Compound components con contexto compartido (state, actions, meta)
 * - Eliminación de boolean prop proliferation
 * - Desacoplamiento de estado y composición flexible
 */

import React, { useState, createContext, useContext, useMemo, useRef, useEffect } from 'react';
import { soundService } from '../services/soundService.js';
import { crmService } from '../services/crmService.js';
import {
  CashIcon,
  CardIcon,
  QrTransferIcon,
  BackspaceIcon,
  VolumeOnIcon,
  VolumeOffIcon,
  UserIcon,
  BoltIcon,
  EyeIcon,
  BookOpenIcon,
  SearchIcon,
  PlusIcon
} from './Icons.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { InputField } from './untitled-ui/InputField.jsx';
import OfficialFacturaCModal from './OfficialFacturaCModal.jsx';
import '../styles/posTerminal.css';
import '../styles/untitled-ui.css';

// 1. Contexto Compartido del Terminal POS
const PosTerminalContext = createContext(null);

export function usePosTerminal() {
  const context = useContext(PosTerminalContext);
  if (!context) {
    throw new Error('Los subcomponentes de PosTerminal deben usarse dentro de <PosTerminal.Provider>');
  }
  return context;
}

// 2. Proveedor de Estado (State Decoupling & Interface)
export function PosTerminalProvider({
  children,
  businessProfile = {},
  onRecordSale,
  anonymousMaxLimit = 10000000 // RG ARCA 5700/2025: Unificado en $10.000.000
}) {
  const [amountRaw, setAmountRaw] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerDocType, setCustomerDocType] = useState('SIN_IDENTIFICAR');
  const [customerDocNumber, setCustomerDocNumber] = useState('0');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [crmCustomerId, setCrmCustomerId] = useState(null);
  const [crmCustomerMeta, setCrmCustomerMeta] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [emittedSuccessSale, setEmittedSuccessSale] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const pulseTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const numericAmount = Number(amountRaw) || 0;
  const displayFormatted = numericAmount.toLocaleString('es-AR');

  const triggerPulse = () => {
    setIsPulsing(true);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 120);
  };

  const actions = useMemo(() => ({
    handleDigit(digit) {
      soundService.playTap();
      triggerPulse();
      setAmountRaw((prev) => {
        if (prev === '0') return digit === '00' ? '0' : digit;
        if (prev.length >= 9) return prev;
        return prev + digit;
      });
    },
    handleClear() {
      soundService.playTap();
      triggerPulse();
      setAmountRaw('0');
    },
    handleBackspace() {
      soundService.playTap();
      triggerPulse();
      setAmountRaw((prev) => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
    },
    handleQuickAdd(value) {
      soundService.playTap();
      triggerPulse();
      setAmountRaw((prev) => {
        const current = Number(prev) || 0;
        return String(current + value);
      });
    },
    toggleSound() {
      setIsMuted((prev) => {
        const next = !prev;
        soundService.setMuted(next);
        return next;
      });
    },
    showToast(msg) {
      setToastMessage(msg);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1800);
    },
    setPaymentMethod(pm) {
      soundService.playTap();
      setPaymentMethod(pm);
      if (pm === 'account' && (customerDocType === 'SIN_IDENTIFICAR' || !crmCustomerId)) {
        setShowClientModal(true);
      }
    },
    selectCrmCustomer(customer) {
      if (!customer) {
        setCrmCustomerId(null);
        setCrmCustomerMeta(null);
        setCustomerDocType('SIN_IDENTIFICAR');
        setCustomerDocNumber('0');
        setCustomerName('Consumidor Final');
        return;
      }
      setCrmCustomerId(customer.id);
      setCrmCustomerMeta(customer);
      setCustomerDocType(customer.doc_type || 'DNI');
      setCustomerDocNumber(customer.doc_number || '');
      setCustomerName(customer.name || '');
    },
    setCustomerDocType,
    setCustomerDocNumber,
    setCustomerName,
    setShowClientModal,
    async emitSale() {
      if (numericAmount <= 0) {
        soundService.playWarning();
        actions.showToast('Ingresa un importe mayor a cero');
        return;
      }

      if (paymentMethod === 'account') {
        if (customerDocType === 'SIN_IDENTIFICAR' || !customerName || customerName === 'Consumidor Final') {
          soundService.playWarning();
          actions.showToast('Para vender A Cuenta debes seleccionar un cliente registrado');
          setShowClientModal(true);
          return;
        }

        // Alerta informativa si excede límite de crédito
        if (crmCustomerMeta && crmCustomerMeta.credit_limit > 0) {
          const projectedDebt = (crmCustomerMeta.current_debt || 0) + numericAmount;
          if (projectedDebt > crmCustomerMeta.credit_limit) {
            actions.showToast(`Aviso: Supera límite de crédito ($${crmCustomerMeta.credit_limit.toLocaleString('es-AR')})`);
          }
        }
      } else if (customerDocType === 'SIN_IDENTIFICAR' && numericAmount > anonymousMaxLimit) {
        soundService.playWarning();
        setShowClientModal(true);
        return;
      }

      setIsSubmitting(true);
      try {
        const saleRecord = {
          id: Date.now(),
          amount: numericAmount,
          payment_method: paymentMethod,
          customer_doc_type: customerDocType,
          customer_doc_number: customerDocNumber,
          customer_name: customerName,
          date: new Date().toISOString().slice(0, 10),
          cae: '74291823910293'
        };

        // Si fue a cuenta (fiado), impactar en cuenta corriente del CRM
        if (paymentMethod === 'account') {
          if (crmCustomerId) {
            try {
              const { customer } = crmService.recordCustomerDebt(crmCustomerId, saleRecord);
              setCrmCustomerMeta(customer);
            } catch (errCrm) {
              console.warn('Advertencia CRM:', errCrm.message);
            }
          } else {
            // Si el cliente fue cargado manualmente con documento y nombre
            const allC = crmService.getCustomers();
            let match = allC.find((c) => c.doc_number === customerDocNumber);
            if (!match) {
              match = crmService.saveCustomer({
                name: customerName,
                doc_type: customerDocType,
                doc_number: customerDocNumber,
                credit_limit: 100000,
                current_debt: 0
              });
            }
            try {
              const { customer } = crmService.recordCustomerDebt(match.id, saleRecord);
              setCrmCustomerId(customer.id);
              setCrmCustomerMeta(customer);
            } catch (errCrm) {
              console.warn('Advertencia CRM:', errCrm.message);
            }
          }
        }

        if (onRecordSale) {
          await onRecordSale(saleRecord);
        }
        setLastSale(saleRecord);
        setEmittedSuccessSale(saleRecord);
        soundService.playSuccess();
        actions.showToast(paymentMethod === 'account' ? '¡Venta A Cuenta registrada en CRM!' : '¡Comprobante emitido con éxito!');
        setAmountRaw('0');
        setCustomerDocType('SIN_IDENTIFICAR');
        setCustomerDocNumber('0');
        setCustomerName('Consumidor Final');
        setCrmCustomerId(null);
        setCrmCustomerMeta(null);
      } catch (err) {
        soundService.playWarning();
        actions.showToast(err.message || 'Error al emitir comprobante');
      } finally {
        setIsSubmitting(false);
      }
    },
    setShowFacturaModal,
    setEmittedSuccessSale
  }), [numericAmount, customerDocType, customerDocNumber, customerName, paymentMethod, anonymousMaxLimit, onRecordSale, crmCustomerId, crmCustomerMeta]);

  const value = {
    state: {
      amountRaw,
      numericAmount,
      displayFormatted,
      paymentMethod,
      customerDocType,
      customerDocNumber,
      customerName,
      crmCustomerId,
      crmCustomerMeta,
      showClientModal,
      lastSale,
      showFacturaModal,
      toastMessage,
      emittedSuccessSale,
      isSubmitting,
      isMuted,
      isPulsing
    },
    actions,
    meta: {
      businessProfile,
      anonymousMaxLimit
    }
  };

  return (
    <PosTerminalContext.Provider value={value}>
      <div className="pos-container">
        {children}
        <OfficialFacturaCModal
          isOpen={showFacturaModal}
          onClose={() => setShowFacturaModal(false)}
          sale={lastSale}
          businessProfile={businessProfile}
        />
      </div>
    </PosTerminalContext.Provider>
  );
}

// 3. Subcomponentes Declarativos (Compound Components)
export function PosHeader() {
  const { state: { isMuted }, actions: { toggleSound }, meta: { businessProfile } } = usePosTerminal();
  return (
    <div className="pos-header">
      <div className="pos-header-info">
        <h2>{businessProfile.fantasy_name || businessProfile.razon_social || 'Terminal POS'}</h2>
        <small>
          CUIT: {businessProfile.cuit || 'Sin configurar'} · PV: {String(businessProfile.pos_number || 1).padStart(5, '0')}
        </small>
      </div>
      <div className="pos-header-actions">
        <button
          type="button"
          className="sound-toggle-btn"
          onClick={toggleSound}
          title={isMuted ? 'Activar sonido táctil' : 'Silenciar'}
        >
          {isMuted ? <VolumeOffIcon size={16} /> : <VolumeOnIcon size={16} />}
        </button>
        <Badge variant="brand" hasDot={true}>
          Factura C
        </Badge>
      </div>
    </div>
  );
}

export function PosDisplay() {
  const { state: { isPulsing, displayFormatted } } = usePosTerminal();
  return (
    <div className={`pos-display-card ${isPulsing ? 'pulsing' : ''}`}>
      <div className="pos-display-label">Total a Cobrar</div>
      <div className="pos-amount-display" data-testid="pos-amount-display">
        <span>$ </span>
        {displayFormatted}
      </div>
    </div>
  );
}

export function PosCustomerBadge() {
  const {
    state: { customerName, customerDocType, customerDocNumber, lastSale, crmCustomerMeta, paymentMethod },
    actions: { setShowClientModal, setShowFacturaModal }
  } = usePosTerminal();

  return (
    <div className="pos-client-badge-row">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
          <UserIcon size={14} />
          {customerName} {customerDocType !== 'SIN_IDENTIFICAR' ? `(${customerDocType} ${customerDocNumber})` : ''}
        </span>
        {crmCustomerMeta && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
              background: (crmCustomerMeta.current_debt || 0) > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
              color: (crmCustomerMeta.current_debt || 0) > 0 ? '#f59e0b' : '#10b981',
              border: `0.5px solid ${(crmCustomerMeta.current_debt || 0) > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              fontWeight: 600
            }}
          >
            Deuda: ${Number(crmCustomerMeta.current_debt || 0).toLocaleString('es-AR')}
          </span>
        )}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        {lastSale && (
          <button
            type="button"
            className="pos-last-invoice-btn"
            onClick={() => {
              soundService.playKeyTap();
              setShowFacturaModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: '0.72rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
            title="Ver o imprimir Factura C oficial del último cobro emitido"
          >
            <EyeIcon size={12} /> Factura C
          </button>
        )}
        <button
          type="button"
          className="pos-client-link"
          onClick={() => setShowClientModal(true)}
        >
          {customerDocType === 'SIN_IDENTIFICAR' ? '+ Identificar Cliente' : 'Editar Cliente'}
        </button>
      </div>
    </div>
  );
}

export function PosPaymentSelector() {
  const { state: { paymentMethod }, actions: { setPaymentMethod } } = usePosTerminal();
  return (
    <div className="pos-payment-selector">
      <button
        type="button"
        className={`payment-chip ${paymentMethod === 'cash' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('cash')}
      >
        <CashIcon size={15} /> Efectivo
      </button>
      <button
        type="button"
        className={`payment-chip ${paymentMethod === 'transfer' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('transfer')}
      >
        <QrTransferIcon size={15} /> Transfer.
      </button>
      <button
        type="button"
        className={`payment-chip ${paymentMethod === 'debit' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('debit')}
      >
        <CardIcon size={15} /> Débito
      </button>
      <button
        type="button"
        className={`payment-chip ${paymentMethod === 'credit' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('credit')}
      >
        <CardIcon size={15} /> Crédito
      </button>
      <button
        type="button"
        className={`payment-chip account-chip ${paymentMethod === 'account' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('account')}
        title="Venta A Cuenta / Fiado con cuenta corriente de cliente"
      >
        <BookOpenIcon size={15} /> A Cuenta
      </button>
    </div>
  );
}

export function PosQuickAmounts() {
  const { actions: { handleQuickAdd } } = usePosTerminal();
  return (
    <div className="pos-quick-amounts">
      <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(500)}>+ $500</button>
      <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(1000)}>+ $1.000</button>
      <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(2000)}>+ $2.000</button>
      <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(5000)}>+ $5.000</button>
    </div>
  );
}

export function PosKeypad() {
  const { actions: { handleDigit, handleClear, handleBackspace } } = usePosTerminal();
  return (
    <div className="pos-keypad">
      <button type="button" className="keypad-btn" onClick={() => handleDigit('1')}>1</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('2')}>2</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('3')}>3</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('4')}>4</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('5')}>5</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('6')}>6</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('7')}>7</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('8')}>8</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('9')}>9</button>
      <button type="button" className="keypad-btn action" onClick={handleClear}>C</button>
      <button type="button" className="keypad-btn" onClick={() => handleDigit('0')}>0</button>
      <button type="button" className="keypad-btn action" onClick={handleBackspace} aria-label="Borrar último dígito">
        <BackspaceIcon size={18} />
      </button>
    </div>
  );
}

export function PosSubmitButton() {
  const { state: { isSubmitting }, actions: { emitSale } } = usePosTerminal();
  return (
    <button
      type="button"
      className="pos-emit-btn"
      onClick={emitSale}
      disabled={isSubmitting}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
    >
      <BoltIcon size={17} />
      <span>Emitir Comprobante</span>
    </button>
  );
}

export function PosCustomerModal() {
  const {
    state: { showClientModal, customerDocType, customerDocNumber, customerName, crmCustomerId },
    actions: { setShowClientModal, setCustomerDocType, setCustomerDocNumber, setCustomerName, selectCrmCustomer },
    meta: { anonymousMaxLimit }
  } = usePosTerminal();

  const [modalTab, setModalTab] = useState('crm'); // 'crm' | 'manual'
  const [searchTerm, setSearchTerm] = useState('');
  const [saveToCrm, setSaveToCrm] = useState(true);
  const [newCreditLimit, setNewCreditLimit] = useState('100000');

  const crmCustomers = useMemo(() => {
    return crmService.getCustomers();
  }, [showClientModal]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return crmCustomers;
    const q = searchTerm.toLowerCase();
    return crmCustomers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.doc_number || '').includes(q) ||
        (c.phone || '').includes(q)
    );
  }, [crmCustomers, searchTerm]);

  if (!showClientModal) return null;

  const handleSelectCustomer = (cust) => {
    soundService.playKeyTap();
    selectCrmCustomer(cust);
    setShowClientModal(false);
  };

  const handleConfirmManual = () => {
    if (saveToCrm && customerName && customerName !== 'Consumidor Final' && customerDocType !== 'SIN_IDENTIFICAR') {
      try {
        const saved = crmService.saveCustomer({
          name: customerName,
          doc_type: customerDocType,
          doc_number: customerDocNumber,
          credit_limit: Number(newCreditLimit) || 100000,
          current_debt: 0
        });
        selectCrmCustomer(saved);
      } catch (err) {
        console.warn('Error al guardar cliente en CRM:', err);
      }
    }
    setShowClientModal(false);
  };

  return (
    <Modal
      isOpen={showClientModal}
      onClose={() => setShowClientModal(false)}
      title="Identificación de Cliente & Cuenta Corriente"
      subtitle={`Selecciona un cliente de tu libreta comercial o ingresa los datos exigidos por ARCA para ventas > $${anonymousMaxLimit.toLocaleString('es-AR')}.`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              selectCrmCustomer(null);
              setShowClientModal(false);
            }}
          >
            Consumidor Final
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={modalTab === 'manual' ? handleConfirmManual : () => setShowClientModal(false)}
          >
            Confirmar Datos
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Selector de Pestaña */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: 'var(--bg-tertiary, rgba(255,255,255,0.06))', padding: '0.25rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setModalTab('crm')}
            style={{
              padding: '0.45rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: modalTab === 'crm' ? 'var(--bg-primary, #1e293b)' : 'transparent',
              color: modalTab === 'crm' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
              boxShadow: modalTab === 'crm' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            Clientes Frecuentes (CRM)
          </button>
          <button
            type="button"
            onClick={() => setModalTab('manual')}
            style={{
              padding: '0.45rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: modalTab === 'manual' ? 'var(--bg-primary, #1e293b)' : 'transparent',
              color: modalTab === 'manual' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
              boxShadow: modalTab === 'manual' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            Carga Manual / Nuevo
          </button>
        </div>

        {modalTab === 'crm' ? (
          <div>
            <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '0.82rem',
                  borderRadius: '9px',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.25))',
                  color: 'var(--text-main, #ffffff)'
                }}
              />
              <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                <SearchIcon size={14} />
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
              {filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem' }}>
                  No se encontraron clientes. Podés cargarlo en la pestaña "Carga Manual".
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = crmCustomerId === cust.id;
                  const hasDebt = (cust.current_debt || 0) > 0;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '9px',
                        border: `1px solid ${isSelected ? 'var(--color-primary, #38bdf8)' : 'var(--border-color, rgba(255,255,255,0.1))'}`,
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main, #fff)' }}>
                          {cust.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {cust.doc_type} {cust.doc_number} · Tel: {cust.phone || 'Sin tel'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: hasDebt ? '#f59e0b' : '#10b981' }}>
                          {hasDebt ? `Debe $${cust.current_debt.toLocaleString('es-AR')}` : 'Al Día'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>
                          Límite: ${Number(cust.credit_limit || 0).toLocaleString('es-AR')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="uui-input-wrap">
              <label className="uui-input-label">Tipo Documento</label>
              <select
                className="uui-input-box"
                value={customerDocType}
                onChange={(e) => setCustomerDocType(e.target.value)}
              >
                <option value="SIN_IDENTIFICAR">Consumidor Final (Sin identificar)</option>
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
              </select>
            </div>

            <InputField
              label="Número de Documento"
              type="text"
              value={customerDocNumber}
              onChange={(e) => setCustomerDocNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Ej. 30712345678"
            />

            <InputField
              label="Nombre o Razón Social"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <input
                type="checkbox"
                id="chk-save-crm"
                checked={saveToCrm}
                onChange={(e) => setSaveToCrm(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="chk-save-crm" style={{ fontSize: '0.78rem', color: 'var(--text-main, #ffffff)', cursor: 'pointer' }}>
                Guardar automáticamente en Libreta CRM para ventas fiadas futuras
              </label>
            </div>

            {saveToCrm && (
              <InputField
                label="Límite de Crédito / Fiado Autorizado ($)"
                type="number"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                placeholder="100000"
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function PosToast() {
  const { state: { toastMessage } } = usePosTerminal();
  if (!toastMessage) return null;
  return <div className="pos-toast">{toastMessage}</div>;
}

export function PosSuccessFeedback() {
  const { state: { emittedSuccessSale }, actions: { setEmittedSuccessSale, setShowFacturaModal } } = usePosTerminal();

  if (!emittedSuccessSale) return null;

  return (
    <div className="pos-success-overlay" onClick={() => setEmittedSuccessSale(null)}>
      <div className="pos-success-card" onClick={(e) => e.stopPropagation()}>
        <div className="pos-spring-check-wrapper">
          <svg className="pos-spring-check-svg" viewBox="0 0 52 52">
            <circle className="pos-spring-check-circle" cx="26" cy="26" r="23" fill="none" />
            <path className="pos-spring-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h3 className="pos-success-title">¡Comprobante Emitido!</h3>
        <div className="pos-success-amount">
          ${Number(emittedSuccessSale.amount || 0).toLocaleString('es-AR')}
        </div>
        <div className="pos-success-meta">
          <span>CAE Oficial: <strong>{emittedSuccessSale.cae}</strong></span>
          <span>Cliente: <strong>{emittedSuccessSale.customer_name}</strong></span>
        </div>
        <div className="pos-success-actions">
          <button
            type="button"
            className="pos-success-btn-view"
            onClick={() => {
              setShowFacturaModal(true);
              setEmittedSuccessSale(null);
            }}
          >
            <EyeIcon size={15} /> Ver Factura C
          </button>
          <button
            type="button"
            className="pos-success-btn-close"
            onClick={() => setEmittedSuccessSale(null)}
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. Componente Compuesto por defecto (Compatibilidad Total & Simplicidad)
export default function PosTerminal({
  businessProfile = {},
  onRecordSale,
  anonymousMaxLimit = 10000000
}) {
  return (
    <PosTerminalProvider
      businessProfile={businessProfile}
      onRecordSale={onRecordSale}
      anonymousMaxLimit={anonymousMaxLimit}
    >
      <PosHeader />
      <PosDisplay />
      <PosCustomerBadge />
      <PosPaymentSelector />
      <PosQuickAmounts />
      <PosKeypad />
      <PosSubmitButton />
      <PosToast />
      <PosSuccessFeedback />
      <PosCustomerModal />
    </PosTerminalProvider>
  );
}

// Exportación como Compound Component (Vercel composition pattern)
PosTerminal.Provider = PosTerminalProvider;
PosTerminal.Header = PosHeader;
PosTerminal.Display = PosDisplay;
PosTerminal.CustomerBadge = PosCustomerBadge;
PosTerminal.PaymentSelector = PosPaymentSelector;
PosTerminal.QuickAmounts = PosQuickAmounts;
PosTerminal.Keypad = PosKeypad;
PosTerminal.SubmitButton = PosSubmitButton;
PosTerminal.CustomerModal = PosCustomerModal;
PosTerminal.Toast = PosToast;
PosTerminal.SuccessFeedback = PosSuccessFeedback;
PosTerminal.Toast = PosToast;
