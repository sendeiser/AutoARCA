import React, { useState } from 'react';
import { soundService } from '../services/soundService.js';
import { CashIcon, CardIcon, QrTransferIcon, BackspaceIcon, VolumeOnIcon, VolumeOffIcon, UserIcon } from './Icons.jsx';
import '../styles/posTerminal.css';

export default function PosTerminal({
  businessProfile = {},
  onRecordSale,
  anonymousMaxLimit = 250000
}) {
  const [amountRaw, setAmountRaw] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerDocType, setCustomerDocType] = useState('SIN_IDENTIFICAR');
  const [customerDocNumber, setCustomerDocNumber] = useState('0');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [showClientModal, setShowClientModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Formato visual en pantalla
  const numericAmount = Number(amountRaw) || 0;
  const displayFormatted = numericAmount.toLocaleString('es-AR');

  const triggerPulse = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 120);
  };

  const handleDigit = (digit) => {
    soundService.playTap();
    triggerPulse();
    setAmountRaw((prev) => {
      if (prev === '0') return digit === '00' ? '0' : digit;
      if (prev.length >= 9) return prev; // Límite de seguridad
      return prev + digit;
    });
  };

  const handleClear = () => {
    soundService.playTap();
    triggerPulse();
    setAmountRaw('0');
  };

  const handleBackspace = () => {
    soundService.playTap();
    triggerPulse();
    setAmountRaw((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleQuickAdd = (value) => {
    soundService.playTap();
    triggerPulse();
    setAmountRaw((prev) => {
      const current = Number(prev) || 0;
      return String(current + value);
    });
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1500);
  };

  const handleEmit = async () => {
    if (numericAmount <= 0) {
      soundService.playWarning();
      showToast('Ingresa un importe mayor a cero');
      return;
    }

    // Validación legal ARCA: si supera el tope sin identificar, forzar carga de DNI/CUIT
    if (customerDocType === 'SIN_IDENTIFICAR' && numericAmount > anonymousMaxLimit) {
      soundService.playWarning();
      setShowClientModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onRecordSale) {
        await onRecordSale({
          amount: numericAmount,
          payment_method: paymentMethod,
          customer_doc_type: customerDocType,
          customer_doc_number: customerDocNumber,
          customer_name: customerName,
          date: new Date().toISOString().slice(0, 10)
        });
      }
      soundService.playSuccess();
      showToast('¡Comprobante emitido con éxito!');
      setAmountRaw('0');
      // Reset cliente a consumidor final por defecto
      setCustomerDocType('SIN_IDENTIFICAR');
      setCustomerDocNumber('0');
      setCustomerName('Consumidor Final');
    } catch (err) {
      soundService.playWarning();
      showToast(err.message || 'Error al emitir comprobante');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pos-container">
      {/* Cabecera del Comercio */}
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
          <div className="pos-header-badge">Factura C</div>
        </div>
      </div>

      {/* Visor de Importe Digital */}
      <div className={`pos-display-card ${isPulsing ? 'pulsing' : ''}`}>
        <div className="pos-display-label">Total a Cobrar</div>
        <div className="pos-amount-display" data-testid="pos-amount-display">
          <span>$ </span>
          {displayFormatted}
        </div>
      </div>

      {/* Fila Informativa de Cliente */}
      <div className="pos-client-badge-row">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserIcon size={14} />
          {customerName} {customerDocType !== 'SIN_IDENTIFICAR' ? `(${customerDocType} ${customerDocNumber})` : ''}
        </span>
        <button
          type="button"
          className="pos-client-link"
          onClick={() => setShowClientModal(true)}
        >
          {customerDocType === 'SIN_IDENTIFICAR' ? '+ Identificar Cliente' : 'Editar Cliente'}
        </button>
      </div>

      {/* Selectores de Medio de Pago */}
      <div className="pos-payment-selector">
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'cash' ? 'active' : ''}`}
          onClick={() => { soundService.playTap(); setPaymentMethod('cash'); }}
        >
          <CashIcon size={15} /> Efectivo
        </button>
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'transfer' ? 'active' : ''}`}
          onClick={() => { soundService.playTap(); setPaymentMethod('transfer'); }}
        >
          <QrTransferIcon size={15} /> Transfer.
        </button>
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'debit' ? 'active' : ''}`}
          onClick={() => { soundService.playTap(); setPaymentMethod('debit'); }}
        >
          <CardIcon size={15} /> Débito
        </button>
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'credit' ? 'active' : ''}`}
          onClick={() => { soundService.playTap(); setPaymentMethod('credit'); }}
        >
          <CardIcon size={15} /> Crédito
        </button>
      </div>

      {/* Atajos Rápidos de Dinero */}
      <div className="pos-quick-amounts">
        <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(500)}>+ $500</button>
        <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(1000)}>+ $1.000</button>
        <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(2000)}>+ $2.000</button>
        <button type="button" className="quick-amount-chip" onClick={() => handleQuickAdd(5000)}>+ $5.000</button>
      </div>

      {/* Botonera Numérica Táctil */}
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

      {/* Botón Grande de Emisión */}
      <button
        type="button"
        className="pos-emit-btn"
        onClick={handleEmit}
        disabled={isSubmitting}
      >
        ⚡ Emitir Comprobante
      </button>

      {/* Toast Animado */}
      {toastMessage && <div className="pos-toast">{toastMessage}</div>}

      {/* Modal de Identificación de Cliente */}
      {showClientModal && (
        <div className="auth-overlay">
          <div className="auth-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem' }}>Identificación del Cliente</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Para ventas mayores a ${anonymousMaxLimit.toLocaleString('es-AR')} o a pedido del cliente, registra sus datos fiscales exigidos por ARCA.
            </p>

            <div className="auth-form-group">
              <label className="auth-label">Tipo Documento</label>
              <select
                className="auth-select"
                value={customerDocType}
                onChange={(e) => setCustomerDocType(e.target.value)}
              >
                <option value="SIN_IDENTIFICAR">Consumidor Final (Sin identificar)</option>
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
              </select>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Número de Documento</label>
              <input
                type="text"
                className="auth-input"
                value={customerDocNumber}
                onChange={(e) => setCustomerDocNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ej. 30712345678"
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Nombre o Razón Social</label>
              <input
                type="text"
                className="auth-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="auth-btn-primary"
                onClick={() => setShowClientModal(false)}
                style={{ margin: 0, padding: '0.65rem 1.25rem' }}
              >
                Confirmar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
