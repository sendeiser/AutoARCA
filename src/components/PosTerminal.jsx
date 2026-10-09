import React, { useState } from 'react';
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

  // Formato visual en pantalla
  const numericAmount = Number(amountRaw) || 0;
  const displayFormatted = numericAmount.toLocaleString('es-AR');

  const handleDigit = (digit) => {
    setAmountRaw((prev) => {
      if (prev === '0') return digit === '00' ? '0' : digit;
      if (prev.length >= 9) return prev; // Límite de seguridad
      return prev + digit;
    });
  };

  const handleClear = () => {
    setAmountRaw('0');
  };

  const handleBackspace = () => {
    setAmountRaw((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleQuickAdd = (value) => {
    setAmountRaw((prev) => {
      const current = Number(prev) || 0;
      return String(current + value);
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1500);
  };

  const handleEmit = async () => {
    if (numericAmount <= 0) {
      showToast('Ingresa un importe mayor a cero');
      return;
    }

    // Validación legal ARCA: si supera el tope sin identificar, forzar carga de DNI/CUIT
    if (customerDocType === 'SIN_IDENTIFICAR' && numericAmount > anonymousMaxLimit) {
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
      showToast('¡Comprobante emitido!');
      setAmountRaw('0');
      // Reset cliente a consumidor final por defecto
      setCustomerDocType('SIN_IDENTIFICAR');
      setCustomerDocNumber('0');
      setCustomerName('Consumidor Final');
    } catch (err) {
      showToast(err.message || 'Error al emitir comprobante');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pos-container">
      {/* Cabecera del Comercio */}
      <div className="pos-header">
        <div>
          <h2>{businessProfile.fantasy_name || businessProfile.razon_social || 'Terminal POS'}</h2>
          <small style={{ color: 'var(--pos-text-muted)' }}>
            CUIT: {businessProfile.cuit || 'Sin configurar'} · PV: {String(businessProfile.pos_number || 1).padStart(5, '0')}
          </small>
        </div>
        <div className="pos-header-badge">Factura C</div>
      </div>

      {/* Visor de Importe */}
      <div className="pos-display-card">
        <div className="pos-display-label">Total a Cobrar</div>
        <div className="pos-amount-display" data-testid="pos-amount-display">
          <span>$ </span>
          {displayFormatted}
        </div>
      </div>

      {/* Fila Informativa de Cliente */}
      <div className="pos-client-badge-row">
        <span>👤 {customerName} {customerDocType !== 'SIN_IDENTIFICAR' ? `(${customerDocType} ${customerDocNumber})` : ''}</span>
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
          onClick={() => setPaymentMethod('cash')}
        >
          💵 Efectivo
        </button>
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'transfer' ? 'active' : ''}`}
          onClick={() => setPaymentMethod('transfer')}
        >
          📱 Transfer.
        </button>
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'debit' ? 'active' : ''}`}
          onClick={() => setPaymentMethod('debit')}
        >
          💳 Débito
        </button>
        <button
          type="button"
          className={`payment-chip ${paymentMethod === 'credit' ? 'active' : ''}`}
          onClick={() => setPaymentMethod('credit')}
        >
          💳 Crédito
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
        <button type="button" className="keypad-btn action" onClick={handleBackspace}>⌫</button>
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 999
          }}
        >
          <div
            style={{
              background: '#1e293b',
              padding: '1.5rem',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '100%',
              color: '#fff'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Identificación del Cliente</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Para ventas mayores a ${anonymousMaxLimit.toLocaleString('es-AR')} o a pedido del cliente, registra sus datos fiscales.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Tipo Documento</label>
              <select
                value={customerDocType}
                onChange={(e) => setCustomerDocType(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none' }}
              >
                <option value="SIN_IDENTIFICAR">Consumidor Final (Sin identificar)</option>
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Número de Documento</label>
              <input
                type="text"
                value={customerDocNumber}
                onChange={(e) => setCustomerDocNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ej. 30712345678"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Nombre o Razón Social</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: '#475569', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
