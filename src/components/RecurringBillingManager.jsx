import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle } from './untitled-ui/Card.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { InputField } from './untitled-ui/InputField.jsx';
import { Modal } from './untitled-ui/Modal.jsx';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import {
  UsersIcon,
  PlusIcon,
  BoltIcon,
  CheckCircleIcon,
  TrashIcon,
  ReceiptTaxIcon
} from './Icons.jsx';
import '../styles/recurringBilling.css';

const DEFAULT_SUBSCRIPTIONS = [
  {
    id: 'sub-1',
    clientName: 'Estudio Jurídico Morales & Asoc.',
    docType: 'CUIT',
    docNumber: '30-71829304-8',
    concept: 'Honorarios Mensuales — Asesoramiento IT & Cloud',
    amount: 180000,
    active: true
  },
  {
    id: 'sub-2',
    clientName: 'Dra. Silvina Gómez',
    docType: 'CUIT',
    docNumber: '27-32948192-3',
    concept: 'Mantenimiento Preventivo y Licenciamiento SaaS',
    amount: 145000,
    active: true
  },
  {
    id: 'sub-3',
    clientName: 'Gimnasio & Fitness Center Spartan',
    docType: 'CUIT',
    docNumber: '30-68491029-1',
    concept: 'Servicios de Infraestructura de Facturación',
    amount: 220000,
    active: true
  }
];

export default function RecurringBillingManager({
  onEmitBatchSales,
  businessProfile = {}
}) {
  const [subscriptions, setSubscriptions] = useState(DEFAULT_SUBSCRIPTIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDocType, setNewDocType] = useState('CUIT');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newConcept, setNewConcept] = useState('Servicios Mensuales Profesionales');
  const [newAmount, setNewAmount] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeSubs = subscriptions.filter((s) => s.active);
  const totalMonthlyRecurring = activeSubs.reduce((acc, s) => acc + Number(s.amount || 0), 0);

  const handleToggleActive = (id) => {
    soundService.playTap();
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDelete = (id) => {
    soundService.playWarning();
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSubscription = (e) => {
    e.preventDefault();
    if (!newName || !newDocNumber || !newAmount) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    soundService.playSuccessChime();
    const newSub = {
      id: `sub-${Date.now()}`,
      clientName: newName,
      docType: newDocType,
      docNumber: newDocNumber,
      concept: newConcept || 'Servicios Profesionales',
      amount: Number(newAmount),
      active: true
    };

    setSubscriptions((prev) => [...prev, newSub]);
    setShowAddModal(false);
    setNewName('');
    setNewDocNumber('');
    setNewAmount('');
  };

  const handleEmitBatch = async () => {
    if (activeSubs.length === 0) {
      alert('No hay abonos recurrentes activos para emitir.');
      return;
    }

    if (!window.confirm(`¿Emitir ${activeSubs.length} comprobantes de abono por un total de ${formatCurrencyARS(totalMonthlyRecurring)}?`)) {
      return;
    }

    setIsProcessing(true);
    soundService.playKeyTap();

    try {
      const generatedSales = activeSubs.map((sub, idx) => ({
        id: Date.now() + idx,
        amount: sub.amount,
        payment_method: 'transfer',
        customer_doc_type: sub.docType,
        customer_doc_number: sub.docNumber,
        customer_name: sub.clientName,
        concept: sub.concept,
        date: new Date().toISOString().slice(0, 10),
        cae: `742918${Math.floor(10000000 + Math.random() * 90000000)}`
      }));

      if (onEmitBatchSales) {
        await onEmitBatchSales(generatedSales);
      }

      soundService.playSuccessChime();
      setToastMessage(`¡Éxito! Se generaron ${generatedSales.length} facturas C por ${formatCurrencyARS(totalMonthlyRecurring)}.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Error al emitir el lote recurrente: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="recurring-billing-card">
      <CardHeader>
        <div className="recurring-header-flex">
          <div>
            <div className="recurring-badge-row">
              <Badge variant="primary">{activeSubs.length} ABONOS ACTIVOS</Badge>
              <span className="recurring-sub-pill">Facturación en 1 clic para Profesionales</span>
            </div>
            <CardTitle>Facturación Recurrente de Abonos Mensuales</CardTitle>
            <CardSubtitle>
              Gestiona honorarios y cuotas mensuales fijas. Emite todo el lote mensual a ARCA en un solo clic.
            </CardSubtitle>
          </div>
          <div className="recurring-header-actions">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
              <PlusIcon size={14} /> Nuevo Abono
            </Button>
            <Button variant="primary" size="sm" onClick={handleEmitBatch} disabled={isProcessing || activeSubs.length === 0}>
              <BoltIcon size={14} /> {isProcessing ? 'Generando...' : `Emitir Lote (${formatCurrencyARS(totalMonthlyRecurring)})`}
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="recurring-body">
        {toastMessage && (
          <div className="recurring-toast-banner">
            <CheckCircleIcon size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="recurring-table-container">
          <table className="recurring-table">
            <thead>
              <tr>
                <th>Cliente / Razón Social</th>
                <th>Identificación</th>
                <th>Concepto de Facturación</th>
                <th>Monto Mensual</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className={!sub.active ? 'recurring-row-inactive' : ''}>
                  <td>
                    <strong>{sub.clientName}</strong>
                  </td>
                  <td className="font-mono text-muted">
                    {sub.docType}: {sub.docNumber}
                  </td>
                  <td className="text-muted" style={{ maxWidth: '240px' }}>
                    {sub.concept}
                  </td>
                  <td className="font-mono font-bold text-primary">
                    {formatCurrencyARS(sub.amount)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`recurring-status-toggle ${sub.active ? 'active' : 'paused'}`}
                      onClick={() => handleToggleActive(sub.id)}
                    >
                      {sub.active ? 'Activo' : 'Pausado'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(sub.id)}>
                      <TrashIcon size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para agregar nuevo abono */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Agregar Cliente de Abono Recurrente"
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleAddSubscription}>
                Guardar Abono
              </Button>
            </div>
          }
        >
          <form onSubmit={handleAddSubscription} className="recurring-modal-form">
            <InputField
              label="Nombre o Razón Social del Cliente"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Clínica Dental San Martín"
            />

            <div className="uui-input-wrap">
              <label className="uui-input-label">Tipo de Documento</label>
              <select
                className="uui-input-box"
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
              >
                <option value="CUIT">CUIT</option>
                <option value="DNI">DNI</option>
              </select>
            </div>

            <InputField
              label="Número de CUIT o DNI"
              type="text"
              required
              value={newDocNumber}
              onChange={(e) => setNewDocNumber(e.target.value)}
              placeholder="Ej. 30718293841"
            />

            <InputField
              label="Concepto a Facturar"
              type="text"
              value={newConcept}
              onChange={(e) => setNewConcept(e.target.value)}
              placeholder="Ej. Mantenimiento y soporte mensual"
            />

            <InputField
              label="Monto Mensual ($ ARS)"
              type="number"
              required
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Ej. 150000"
            />
          </form>
        </Modal>
      )}
    </Card>
  );
}
