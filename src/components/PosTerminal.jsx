/**
 * Terminal POS Táctil — Arquitectura de Componentes Compuestos (Vercel Composition Patterns)
 * Sigue las guías oficiales de vercel-labs/agent-skills:
 * - Compound components con contexto compartido (state, actions, meta)
 * - Eliminación de boolean prop proliferation
 * - Desacoplamiento de estado y composición flexible
 */

import React, { useState, createContext, useContext, useMemo, useRef, useEffect } from 'react';
import { soundService } from '../services/soundService.js';
import {
  CashIcon,
  CardIcon,
  QrTransferIcon,
  BackspaceIcon,
  VolumeOnIcon,
  VolumeOffIcon,
  UserIcon,
  BoltIcon,
  EyeIcon
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
  const [showClientModal, setShowClientModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
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
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1500);
    },
    setPaymentMethod(pm) {
      soundService.playTap();
      setPaymentMethod(pm);
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

      if (customerDocType === 'SIN_IDENTIFICAR' && numericAmount > anonymousMaxLimit) {
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
        if (onRecordSale) {
          await onRecordSale(saleRecord);
        }
        setLastSale(saleRecord);
        soundService.playSuccess();
        actions.showToast('¡Comprobante emitido con éxito!');
        setAmountRaw('0');
        setCustomerDocType('SIN_IDENTIFICAR');
        setCustomerDocNumber('0');
        setCustomerName('Consumidor Final');
      } catch (err) {
        soundService.playWarning();
        actions.showToast(err.message || 'Error al emitir comprobante');
      } finally {
        setIsSubmitting(false);
      }
    },
    setShowFacturaModal
  }), [numericAmount, customerDocType, customerDocNumber, customerName, paymentMethod, anonymousMaxLimit, onRecordSale]);

  const value = {
    state: {
      amountRaw,
      numericAmount,
      displayFormatted,
      paymentMethod,
      customerDocType,
      customerDocNumber,
      customerName,
      showClientModal,
      lastSale,
      showFacturaModal,
      toastMessage,
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
    state: { customerName, customerDocType, customerDocNumber, lastSale },
    actions: { setShowClientModal, setShowFacturaModal }
  } = usePosTerminal();

  return (
    <div className="pos-client-badge-row">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <UserIcon size={14} />
        {customerName} {customerDocType !== 'SIN_IDENTIFICAR' ? `(${customerDocType} ${customerDocNumber})` : ''}
      </span>
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
    state: { showClientModal, customerDocType, customerDocNumber, customerName },
    actions: { setShowClientModal, setCustomerDocType, setCustomerDocNumber, setCustomerName },
    meta: { anonymousMaxLimit }
  } = usePosTerminal();

  if (!showClientModal) return null;

  return (
    <Modal
      isOpen={showClientModal}
      onClose={() => setShowClientModal(false)}
      title="Identificación del Cliente"
      subtitle={`Para ventas mayores a $${anonymousMaxLimit.toLocaleString('es-AR')} o a pedido del cliente, registra sus datos fiscales exigidos por ARCA.`}
      footer={
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowClientModal(false)}
        >
          Confirmar Datos
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      </div>
    </Modal>
  );
}

export function PosToast() {
  const { state: { toastMessage } } = usePosTerminal();
  if (!toastMessage) return null;
  return <div className="pos-toast">{toastMessage}</div>;
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
