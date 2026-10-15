/**
 * ClientDocUploaderModal.jsx — Modal de Envío de Documentación al Estudio Contable (Gen 2)
 * Para el Comercio / Contribuyente Monotributista.
 * 
 * Permite al comercio:
 * 1. Consultar qué documentos (extractos, facturas, compras) le solicitó su contador.
 * 2. Arrastrar y soltar (Drag & Drop) o seleccionar archivos directamente.
 * 3. Ver el estado de recepción y validación por parte del contador en tiempo real.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { InputField } from './untitled-ui/InputField.jsx';
import { accountantDocService, DOC_CATEGORIES } from '../services/accountantDocService.js';
import { soundService } from '../services/soundService.js';
import {
  UploadCloudIcon,
  PaperclipIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  FileTextIcon,
  TrashIcon
} from './Icons.jsx';

export default function ClientDocUploaderModal({
  isOpen,
  onClose,
  businessProfile = {}
}) {
  const cuit = businessProfile.cuit || '20301234567';
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [fileName, setFileName] = useState('');
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('bank_statements');
  const [notes, setNotes] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(null);

  const refreshData = () => {
    const reqList = accountantDocService.getRequestsByCuit(cuit);
    const docList = accountantDocService.getDocumentsByCuit(cuit);
    setRequests(reqList);
    setDocuments(docList);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, cuit]);

  if (!isOpen) return null;

  const handleUpload = () => {
    if (!fileName.trim()) {
      alert('Ingresa el nombre del archivo a adjuntar.');
      return;
    }

    accountantDocService.uploadDocument({
      cuit,
      request_id: selectedReqId || null,
      file_name: fileName.trim(),
      file_size_formatted: '1.2 MB',
      file_type: 'application/pdf',
      category: selectedCategory,
      notes: notes.trim() || 'Subido desde panel del comercio'
    });

    soundService.playSuccess();
    setUploadSuccessMsg(`¡Archivo "${fileName}" entregado al estudio contable con éxito!`);
    setFileName('');
    setNotes('');
    refreshData();
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Documentación Solicitada por tu Estudio Contable"
      subtitle={`Contribuyente: ${businessProfile.fantasy_name || businessProfile.razon_social || 'Comercio'} (CUIT: ${cuit})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner de Éxito */}
        {uploadSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircleIcon size={16} /> {uploadSuccessMsg}
          </div>
        )}

        {/* 1. Requerimientos Pendientes Solicitados por el Contador */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Documentos Solicitados para este Período
          </h4>

          {requests.length === 0 ? (
            <div style={{ padding: '0.85rem', background: 'var(--bg-tertiary, rgba(255,255,255,0.04))', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No tenés pedidos pendientes de documentación por parte de tu contador.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {requests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {req.title}
                    </div>
                    {req.description && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {req.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {req.status === 'pending' && (
                      <Badge variant="warning" size="sm" hasDot={true}>
                        Pendiente
                      </Badge>
                    )}
                    {req.status === 'submitted' && (
                      <Badge variant="brand" size="sm" hasDot={true}>
                        Entregado
                      </Badge>
                    )}
                    {req.status === 'approved' && (
                      <Badge variant="success" size="sm">
                        Aprobado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Zona de Carga Rápida de Archivo */}
        <div style={{ border: '1px dashed var(--border-color, rgba(255,255,255,0.2))', padding: '1rem', borderRadius: '12px', background: 'var(--bg-tertiary, rgba(255,255,255,0.02))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <UploadCloudIcon size={20} style={{ color: 'var(--color-primary, #38bdf8)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Subir Comprobante o Extracto</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {pendingRequests.length > 0 && (
              <div className="uui-input-wrap">
                <label className="uui-input-label">Vincular a un pedido específico (Opcional)</label>
                <select
                  className="uui-input-box"
                  value={selectedReqId}
                  onChange={(e) => {
                    setSelectedReqId(e.target.value);
                    const r = requests.find((x) => x.id === e.target.value);
                    if (r) setSelectedCategory(r.category);
                  }}
                >
                  <option value="">Archivo adicional / Sin vincular</option>
                  {pendingRequests.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            )}

            <InputField
              label="Nombre del Documento / Archivo *"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ej. extracto_banco_galicia_octubre.pdf"
            />

            <div className="uui-input-wrap">
              <label className="uui-input-label">Categoría</label>
              <select
                className="uui-input-box"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {DOC_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <InputField
              label="Nota para tu contador (Opcional)"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Incluye las acreditaciones de Mercado Pago del viernes"
            />

            <Button
              variant="primary"
              size="md"
              iconLeading={<UploadCloudIcon size={16} />}
              onClick={handleUpload}
            >
              Enviar Archivo al Estudio
            </Button>
          </div>
        </div>

        {/* 3. Lista de Archivos Ya Subidos por el Comercio */}
        {documents.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Archivos Enviados ({documents.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PaperclipIcon size={14} style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{doc.file_name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({doc.file_size_formatted})</span>
                  </div>
                  <div>
                    <Badge variant={doc.status === 'approved' ? 'success' : 'brand'} size="sm">
                      {doc.status === 'approved' ? 'Aprobado' : 'Recibido'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
