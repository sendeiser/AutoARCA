/**
 * AccountantDocPortal.jsx — Portal de Gestión Documental y Requerimientos de Clientes (Gen 2)
 * Para Estudios Contables AutoARCA.
 * 
 * Permite:
 * 1. Monitorear los pedidos de documentación (extractos bancarios, facturas, compras) por cliente.
 * 2. Crear nuevos requerimientos con fecha de vencimiento y categorías contables.
 * 3. Enviar links de carga seguros y recordatorios formateados por WhatsApp.
 * 4. Auditar, aprobar o solicitar correcciones de los archivos entregados.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { accountantDocService, DOC_CATEGORIES } from '../services/accountantDocService.js';
import { soundService } from '../services/soundService.js';
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
  FolderIcon,
  UploadCloudIcon,
  PaperclipIcon,
  WhatsAppIcon,
  SearchIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  UsersIcon,
  TrashIcon,
  LinkIcon
} from './Icons.jsx';
import '../styles/accountantDocPortal.css';

export default function AccountantDocPortal({
  clients = [],
  accountantProfile = {}
}) {
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  
  // Filtros
  const [selectedCuitFilter, setSelectedCuitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'submitted' | 'approved'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubView, setActiveSubView] = useState('requests'); // 'requests' | 'files' | 'portal_preview'

  // Modales
  const [isNewReqModalOpen, setIsNewReqModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedClientForShare, setSelectedClientForShare] = useState(null);

  // Formulario de Nuevo Requerimiento
  const [formCuit, setFormCuit] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('bank_statements');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  // Estado para el simulador de subida del cliente
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [simulatedCategory, setSimulatedCategory] = useState('bank_statements');
  const [simulatedTargetReqId, setSimulatedTargetReqId] = useState('');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState(null);

  const refreshAll = () => {
    setRequests(accountantDocService.getAllRequests());
    setDocuments(accountantDocService.getAllDocuments());
    setMetrics(accountantDocService.getDocMetrics(clients));
  };

  useEffect(() => {
    refreshAll();
  }, [clients]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Requerimientos filtrados
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (selectedCuitFilter !== 'all' && r.cuit.replace(/[^0-9]/g, '') !== selectedCuitFilter.replace(/[^0-9]/g, '')) {
        return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.business_name.toLowerCase().includes(q) ||
        r.cuit.includes(q)
      );
    });
  }, [requests, selectedCuitFilter, statusFilter, searchQuery]);

  // Documentos filtrados
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (selectedCuitFilter !== 'all' && d.cuit.replace(/[^0-9]/g, '') !== selectedCuitFilter.replace(/[^0-9]/g, '')) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.file_name.toLowerCase().includes(q) ||
        d.cuit.includes(q)
      );
    });
  }, [documents, selectedCuitFilter, searchQuery]);

  // Manejador para crear requerimiento
  const handleCreateRequest = () => {
    if (!formCuit) {
      alert('Debes seleccionar un cliente de la cartera.');
      return;
    }
    if (!formTitle.trim()) {
      alert('Ingresa el título del documento solicitado.');
      return;
    }

    const matchedClient = clients.find((c) => c.cuit.replace(/[^0-9]/g, '') === formCuit.replace(/[^0-9]/g, ''));
    const bizName = matchedClient ? (matchedClient.fantasy_name || matchedClient.razon_social) : 'Comercio';

    accountantDocService.createRequest({
      cuit: formCuit,
      business_name: bizName,
      title: formTitle,
      category: formCategory,
      description: formDescription,
      due_date: formDueDate
    });

    soundService.playSuccess();
    showToast('¡Requerimiento creado y añadido a la libreta del cliente!');
    setIsNewReqModalOpen(false);
    setFormTitle('');
    setFormDescription('');
    refreshAll();
  };

  // Cambiar estado de requerimiento (Aprobar o Rechazar)
  const handleUpdateStatus = (reqId, newStatus) => {
    soundService.playKeyTap();
    accountantDocService.updateRequestStatus(reqId, newStatus);
    showToast(newStatus === 'approved' ? '¡Requerimiento aprobado!' : 'Estado actualizado.');
    refreshAll();
  };

  // Abrir modal de compartir
  const handleOpenShare = (client) => {
    soundService.playKeyTap();
    setSelectedClientForShare(client);
    setIsShareModalOpen(true);
  };

  // Abrir WhatsApp con el mensaje prearmado
  const handleSendWhatsApp = (client) => {
    soundService.playKeyTap();
    const { url } = accountantDocService.generateWhatsAppDocRequestMessage(
      client.cuit,
      client.fantasy_name || client.razon_social,
      'Octubre 2026',
      accountantProfile
    );
    window.open(url, '_blank');
  };

  // Manejador de subida simulada desde el portal del cliente
  const handleSimulateClientUpload = () => {
    if (!simulatedFileName.trim()) {
      alert('Ingresa el nombre del archivo para simular la subida.');
      return;
    }

    const targetCuit = selectedCuitFilter !== 'all' ? selectedCuitFilter : (clients[0]?.cuit || '20301234567');
    accountantDocService.uploadDocument({
      cuit: targetCuit,
      file_name: simulatedFileName,
      file_size_formatted: '1.4 MB',
      file_type: 'application/pdf',
      category: simulatedCategory,
      request_id: simulatedTargetReqId || null,
      notes: 'Archivo cargado mediante portal web interactivo'
    });

    soundService.playSuccess();
    showToast(`¡Archivo "${simulatedFileName}" recibido y notificado al estudio!`);
    setSimulatedFileName('');
    refreshAll();
  };

  return (
    <div className="doc-portal-container">
      {/* Toast Feedback */}
      {toastMsg && <div className="doc-toast">{toastMsg}</div>}

      {/* Header Principal */}
      <div className="doc-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="doc-title">Portal Documental & Requerimientos</h1>
            <Badge variant="brand" hasDot={true}>
              Gen 2 Onboarding
            </Badge>
          </div>
          <p className="doc-subtitle">
            Centraliza la recepción de extractos bancarios, facturas de compras y comprobantes de tu cartera con links únicos y WhatsApp.
          </p>
        </div>

        <div className="doc-header-actions">
          <Button
            variant="secondary"
            size="md"
            iconLeading={<LinkIcon size={16} />}
            onClick={() => handleOpenShare(clients[0])}
            disabled={clients.length === 0}
          >
            Link de Carga
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeading={<PlusIcon size={16} />}
            onClick={() => {
              soundService.playKeyTap();
              setFormCuit(clients[0]?.cuit || '');
              setIsNewReqModalOpen(true);
            }}
          >
            Nuevo Requerimiento
          </Button>
        </div>
      </div>

      {/* Tarjetas Estadísticas Ejecutivas */}
      <StatGrid>
        <StatCard
          label="Requerimientos Totales"
          value={String(metrics?.totalRequests || 0)}
          icon={<FolderIcon size={20} />}
          caption={`${metrics?.pendingCount || 0} pendientes de entrega`}
          trend={metrics?.pendingCount > 0 ? 'up' : 'neutral'}
          change={`${metrics?.pendingCount || 0} pendientes`}
        />

        <StatCard
          label="Documentos Recibidos"
          value={String(metrics?.totalDocuments || 0)}
          icon={<PaperclipIcon size={20} />}
          caption={`${metrics?.submittedCount || 0} listos para auditar`}
          trend="up"
          change="Recibidos"
        />

        <StatCard
          label="Aprobados / Auditados"
          value={String(metrics?.approvedCount || 0)}
          icon={<CheckCircleIcon size={20} />}
          caption="Papeles en regla para DJ"
          trend="neutral"
        />

        <StatCard
          label="Tasa de Cumplimiento"
          value={`${(metrics?.complianceRate || 0).toFixed(0)}%`}
          icon={<UsersIcon size={20} />}
          caption="Cartera con papeles al día"
          trend="up"
        />
      </StatGrid>

      {/* Sub-navegación de Vistas */}
      <div className="doc-subnav-row">
        <div className="doc-subnav-tabs">
          <button
            type="button"
            className={`doc-subnav-btn ${activeSubView === 'requests' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setActiveSubView('requests'); }}
          >
            Bandeja de Requerimientos ({requests.length})
          </button>
          <button
            type="button"
            className={`doc-subnav-btn ${activeSubView === 'files' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setActiveSubView('files'); }}
          >
            Archivos Entregados ({documents.length})
          </button>
          <button
            type="button"
            className={`doc-subnav-btn ${activeSubView === 'portal_preview' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setActiveSubView('portal_preview'); }}
          >
            Simulador Portal Cliente (Subida en Vivo)
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="doc-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Filtro por Cliente */}
          <div className="uui-input-wrap" style={{ minWidth: '220px', margin: 0 }}>
            <select
              className="uui-input-box"
              value={selectedCuitFilter}
              onChange={(e) => setSelectedCuitFilter(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
            >
              <option value="all">Todos los Clientes de la Cartera</option>
              {clients.map((c) => (
                <option key={c.id} value={c.cuit}>
                  {c.fantasy_name || c.razon_social} ({c.cuit})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado (si está en la vista de requerimientos) */}
          {activeSubView === 'requests' && (
            <div className="doc-filter-chips">
              <button
                type="button"
                className={`doc-chip ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`doc-chip ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pendientes
              </button>
              <button
                type="button"
                className={`doc-chip ${statusFilter === 'submitted' ? 'active' : ''}`}
                onClick={() => setStatusFilter('submitted')}
              >
                Entregados
              </button>
              <button
                type="button"
                className={`doc-chip ${statusFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('approved')}
              >
                Aprobados
              </button>
            </div>
          )}
        </div>

        <div className="doc-search-wrap">
          <SearchIcon size={15} className="doc-search-icon" />
          <input
            type="text"
            className="doc-search-input"
            placeholder="Buscar por título, cliente o CUIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* VISTA 1: TABLA DE REQUERIMIENTOS */}
      {activeSubView === 'requests' && (
        <TableContainer>
          <TableToolbar>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Requerimientos Contables por Cliente
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {filteredRequests.length} requerimiento{filteredRequests.length !== 1 ? 's' : ''} filtrado{filteredRequests.length !== 1 ? 's' : ''}
              </span>
            </div>
          </TableToolbar>

          {filteredRequests.length === 0 ? (
            <div className="doc-empty-state">
              <FolderIcon size={36} />
              <p>No se encontraron requerimientos para los criterios seleccionados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / CUIT</TableHead>
                  <TableHead>Documento Solicitado</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Período / Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => {
                  const clientObj = clients.find((c) => c.cuit.replace(/[^0-9]/g, '') === req.cuit.replace(/[^0-9]/g, ''));
                  return (
                    <TableRow key={req.id}>
                      {/* Cliente */}
                      <TableCell>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {req.business_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          CUIT: {req.cuit}
                        </div>
                      </TableCell>

                      {/* Título & Detalle */}
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{req.title}</div>
                        {req.description && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                            {req.description}
                          </div>
                        )}
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>
                        <Badge variant="gray" size="sm">
                          {DOC_CATEGORIES.find((c) => c.id === req.category)?.label || req.category}
                        </Badge>
                      </TableCell>

                      {/* Período / Vence */}
                      <TableCell>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{req.period}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Vence: {req.due_date}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        {req.status === 'pending' && (
                          <Badge variant="warning" size="sm" hasDot={true}>
                            Pendiente Entrega
                          </Badge>
                        )}
                        {req.status === 'submitted' && (
                          <Badge variant="brand" size="sm" hasDot={true}>
                            Entregado (A Revisar)
                          </Badge>
                        )}
                        {req.status === 'approved' && (
                          <Badge variant="success" size="sm">
                            Aprobado
                          </Badge>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {req.status === 'submitted' && (
                            <Button
                              variant="primary"
                              size="sm"
                              iconLeading={<CheckCircleIcon size={14} />}
                              onClick={() => handleUpdateStatus(req.id, 'approved')}
                            >
                              Aprobar
                            </Button>
                          )}
                          {req.status === 'pending' && clientObj && (
                            <button
                              type="button"
                              className="doc-wa-btn"
                              title="Pedir documento por WhatsApp"
                              onClick={() => handleSendWhatsApp(clientObj)}
                            >
                              <WhatsAppIcon size={14} /> Pedir
                            </button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenShare(clientObj || { cuit: req.cuit, fantasy_name: req.business_name })}
                          >
                            Link
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
      )}

      {/* VISTA 2: LISTA DE ARCHIVOS ENTREGADOS */}
      {activeSubView === 'files' && (
        <TableContainer>
          <TableToolbar>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Archivos y Documentos Recibidos
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {filteredDocs.length} archivo{filteredDocs.length !== 1 ? 's' : ''} disponibles para descarga y auditoría
              </span>
            </div>
          </TableToolbar>

          {filteredDocs.length === 0 ? (
            <div className="doc-empty-state">
              <PaperclipIcon size={36} />
              <p>No hay archivos recibidos para el filtro actual.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>CUIT Cliente</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tamaño / Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="doc-file-icon">
                          <PaperclipIcon size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.file_name}</div>
                          {doc.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.notes}</div>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="doc-cuit-badge">{doc.cuit}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="gray" size="sm">
                        {DOC_CATEGORIES.find((c) => c.id === doc.category)?.label || doc.category}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{doc.file_size_formatted}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(doc.uploaded_at).toLocaleDateString('es-AR')}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={doc.status === 'approved' ? 'success' : 'brand'} size="sm">
                        {doc.status === 'approved' ? 'Aprobado' : 'Revisión Pendiente'}
                      </Badge>
                    </TableCell>

                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeading={<DownloadIcon size={14} />}
                          onClick={() => {
                            soundService.playKeyTap();
                            showToast(`Descargando ${doc.file_name}...`);
                          }}
                        >
                          Descargar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeading={<TrashIcon size={14} />}
                          onClick={() => {
                            accountantDocService.deleteDocument(doc.id);
                            soundService.playKeyTap();
                            showToast('Documento eliminado.');
                            refreshAll();
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* VISTA 3: SIMULADOR DE PORTAL DEL CLIENTE (DRAG & DROP) */}
      {activeSubView === 'portal_preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Simulador: Experiencia del Cliente al Cargar Documentos</CardTitle>
            <CardSubtitle>
              Así ve tu cliente su portal privado cuando hace clic en el enlace de WhatsApp. Podés probar la subida de un archivo de prueba.
            </CardSubtitle>
          </CardHeader>

          <div className="doc-client-portal-preview">
            <div className="doc-upload-box">
              <UploadCloudIcon size={44} className="doc-upload-icon-pulse" />
              <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontWeight: 700 }}>
                Arrastrá aquí tus comprobantes o hacé clic para seleccionar
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Admite PDF, Excel (XLSX, CSV) o imágenes claras de comprobantes (PNG, JPG) hasta 25 MB
              </p>

              <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <InputField
                  label="Nombre del archivo a simular"
                  type="text"
                  value={simulatedFileName}
                  onChange={(e) => setSimulatedFileName(e.target.value)}
                  placeholder="ej. resumen_bancario_galicia_octubre.pdf"
                />

                <div className="uui-input-wrap">
                  <label className="uui-input-label">Categoría del Documento</label>
                  <select
                    className="uui-input-box"
                    value={simulatedCategory}
                    onChange={(e) => setSimulatedCategory(e.target.value)}
                  >
                    {DOC_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  iconLeading={<UploadCloudIcon size={16} />}
                  onClick={handleSimulateClientUpload}
                >
                  Subir y Enviar al Estudio Contable
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL 1: NUEVO REQUERIMIENTO */}
      {isNewReqModalOpen && (
        <Modal
          isOpen={isNewReqModalOpen}
          onClose={() => setIsNewReqModalOpen(false)}
          title="Crear Requerimiento de Documentación"
          subtitle="Solicita a tu cliente los comprobantes fiscales necesarios para su liquidación mensual."
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsNewReqModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateRequest}
              >
                Crear Requerimiento
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="uui-input-wrap">
              <label className="uui-input-label">Cliente de la Cartera *</label>
              <select
                className="uui-input-box"
                value={formCuit}
                onChange={(e) => setFormCuit(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.cuit}>
                    {c.fantasy_name || c.razon_social} (CUIT: {c.cuit})
                  </option>
                ))}
              </select>
            </div>

            <InputField
              label="Título del Documento *"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ej. Extracto Bancario Banco Galicia Octubre 2026"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="uui-input-wrap">
                <label className="uui-input-label">Categoría</label>
                <select
                  className="uui-input-box"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {DOC_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <InputField
                label="Fecha Límite de Entrega"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>

            <InputField
              label="Instrucciones para el Cliente (Opcional)"
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ej. Descargarlo en formato Excel o PDF completo desde Online Banking"
            />
          </div>
        </Modal>
      )}

      {/* MODAL 2: COMPARTIR ENLACE DE CARGA & WHATSAPP */}
      {isShareModalOpen && selectedClientForShare && (
        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={`Enlace de Carga: ${selectedClientForShare.fantasy_name || selectedClientForShare.razon_social}`}
          subtitle="Comparte este link seguro con tu cliente para que suba sus archivos sin logueos complejos."
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                variant="secondary"
                size="md"
                iconLeading={<WhatsAppIcon size={16} />}
                onClick={() => handleSendWhatsApp(selectedClientForShare)}
              >
                Enviar por WhatsApp
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsShareModalOpen(false)}
              >
                Listo
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="uui-input-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                Enlace Seguro Privado (Link Único)
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  readOnly
                  value={accountantDocService.generateClientUploadLink(selectedClientForShare.cuit)}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    navigator.clipboard.writeText(accountantDocService.generateClientUploadLink(selectedClientForShare.cuit));
                    soundService.playSuccess();
                    showToast('¡Enlace copiado al portapapeles!');
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary, rgba(255,255,255,0.05))', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Mensaje preconfigurado para WhatsApp:
              </strong>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {accountantDocService.generateWhatsAppDocRequestMessage(selectedClientForShare.cuit, selectedClientForShare.fantasy_name).text}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
