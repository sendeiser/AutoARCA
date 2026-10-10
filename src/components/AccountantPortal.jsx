import React, { useState } from 'react';
import JSZip from 'jszip';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import {
  SearchIcon,
  DownloadIcon,
  PlusIcon,
  TableIcon,
  GridIcon,
  LinkIcon,
  CopyIcon,
  UsersIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ReceiptTaxIcon,
  FileTextIcon,
  FileSpreadsheetIcon
} from './Icons.jsx';
import AccountantLinkModal from './AccountantLinkModal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { StatCard, StatGrid } from './untitled-ui/StatCard.jsx';
import { Card } from './untitled-ui/Card.jsx';
import { SearchInput } from './untitled-ui/SearchInput.jsx';
import { reportPdfService } from '../services/reportPdfService.js';
import { generateLibroVentasExcelCsv } from '../services/arcaExportService.js';
import OfficialConstanciaInscripcionModal from './OfficialConstanciaInscripcionModal.jsx';
import '../styles/accountantPortal.css';
import '../styles/untitled-ui.css';

export default function AccountantPortal({
  clients = [],
  onDownloadZip,
  accountantProfile = {}
}) {
  const [clientList, setClientList] = useState(clients);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'green' | 'yellow' | 'red'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newCuit, setNewCuit] = useState('');
  const [newFantasyName, setNewFantasyName] = useState('');
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newCategory, setNewCategory] = useState('D');
  const [selectedClientForConstancia, setSelectedClientForConstancia] = useState(null);

  // Sync state if props change
  React.useEffect(() => {
    setClientList(clients);
  }, [clients]);

  // Filtrado reactivo de comercios
  const filteredClients = clientList.filter((c) => {
    const query = searchQuery.toLowerCase();
    const cuitMatch = (c.cuit || '').includes(query);
    const nameMatch = (c.fantasy_name || c.razon_social || '').toLowerCase().includes(query);
    const matchesSearch = cuitMatch || nameMatch;

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && (c.trafficColor === statusFilter);
  });

  // KPIs
  const totalClients = clientList.length;
  const inRiskClients = clientList.filter((c) => c.trafficColor === 'red').length;
  const inWarningClients = clientList.filter((c) => c.trafficColor === 'yellow').length;
  const readyBatchesCount = clientList.filter((c) => !!c.todayBatch).length;

  const handleDownloadSingle = (client) => {
    soundService.playKeyTap();
    const batch = client.todayBatch;
    if (!batch || !batch.file_content_arca) {
      alert(`No hay lote generado para ${client.fantasy_name || client.razon_social} en la fecha seleccionada.`);
      return;
    }
    const blob = new Blob([batch.file_content_arca], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', batch.filename || `comprobantes_arca_${client.cuit}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundService.playSuccessChime();
  };

  const handleBulkZip = async () => {
    soundService.playKeyTap();
    if (onDownloadZip) {
      onDownloadZip(selectedDate, filteredClients);
      return;
    }

    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      let addedFilesCount = 0;

      filteredClients.forEach((client) => {
        if (client.todayBatch && client.todayBatch.file_content_arca) {
          const filename = client.todayBatch.filename || `comprobantes_arca_${client.cuit}_${selectedDate}.csv`;
          zip.file(filename, client.todayBatch.file_content_arca);
          addedFilesCount++;
        }
      });

      if (addedFilesCount === 0) {
        soundService.playWarning();
        alert('Ninguno de los clientes seleccionados cuenta con un lote cerrado para la fecha indicada.');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lotes_arca_masivo_${selectedDate}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      soundService.playSuccessChime();
    } catch (err) {
      alert('Error al generar archivo ZIP: ' + err.message);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadClientPdf = (client) => {
    soundService.playKeyTap();
    try {
      reportPdfService.generateClientFiscalReport({
        client,
        businessProfile: {
          razon_social: client.razon_social || client.razonSocial || client.fantasy_name,
          cuit: client.cuit,
          monotributo_category: client.monotributo_category || client.monotributoCategory || 'D',
          fantasy_name: client.fantasy_name || client.razon_social
        },
        metrics: client.metrics || {
          categoryScale: { max_annual_billing: 16450000 },
          consumptionPercentage: client.trafficColor === 'red' ? 88.5 : client.trafficColor === 'yellow' ? 72.3 : 42.1,
          rolling12mSales: client.trafficColor === 'red' ? 14500000 : client.trafficColor === 'yellow' ? 11900000 : 6850000,
          remainingAllowance: client.trafficColor === 'red' ? 1950000 : 9600000,
          trafficLight: { color: client.trafficColor || 'green' }
        },
        sales: client.todayBatch?.sales || [
          { receipt_number: 1, amount: client.todayBatch?.total_amount ? client.todayBatch.total_amount * 0.4 : 4500, payment_method: 'cash', customer_name: 'Consumidor Final', date: selectedDate },
          { receipt_number: 2, amount: client.todayBatch?.total_amount ? client.todayBatch.total_amount * 0.6 : 12500, payment_method: 'transfer', customer_name: 'Consumidor Final', date: selectedDate }
        ],
        batchHistory: client.todayBatch ? [client.todayBatch] : [],
        accountantProfile
      });
      soundService.playSuccessChime();
    } catch (err) {
      console.error('Error generando PDF de cliente:', err);
      alert('Error al generar el PDF: ' + err.message);
    }
  };

  const handleDownloadClientExcel = (client) => {
    soundService.playKeyTap();
    try {
      const sales = client.todayBatch?.sales || [
        { receipt_number: 1, amount: client.todayBatch?.total_amount ? client.todayBatch.total_amount * 0.4 : 4500, payment_method: 'cash', customer_name: 'Consumidor Final', date: selectedDate },
        { receipt_number: 2, amount: client.todayBatch?.total_amount ? client.todayBatch.total_amount * 0.6 : 12500, payment_method: 'transfer', customer_name: 'Consumidor Final', date: selectedDate }
      ];
      const { filename, content } = generateLibroVentasExcelCsv(sales, {
        cuit: client.cuit,
        razon_social: client.razon_social || client.fantasy_name,
        fantasy_name: client.fantasy_name
      });
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      soundService.playSuccessChime();
    } catch (err) {
      alert('Error generando Excel de cliente: ' + err.message);
    }
  };

  const handleDownloadPortfolioPdf = () => {
    soundService.playKeyTap();
    try {
      reportPdfService.generateAccountantPortfolioReport({
        clients: filteredClients,
        accountantProfile
      });
      soundService.playSuccessChime();
    } catch (err) {
      console.error('Error generando PDF de cartera:', err);
      alert('Error al generar el PDF de cartera: ' + err.message);
    }
  };

  const handleAddClientSubmit = (e) => {
    e.preventDefault();
    if (!newCuit || !newFantasyName) {
      alert('Por favor ingresa CUIT y Nombre Comercial.');
      return;
    }
    const newClientObj = {
      id: `client-${Date.now()}`,
      cuit: newCuit,
      razon_social: newRazonSocial || newFantasyName,
      fantasy_name: newFantasyName,
      monotributo_category: newCategory,
      trafficColor: 'green',
      todayBatch: null
    };
    setClientList((prev) => [...prev, newClientObj]);
    setShowAddClientModal(false);
    setNewCuit('');
    setNewFantasyName('');
    setNewRazonSocial('');
    soundService.playSuccessChime();
  };

  return (
    <div className="accountant-portal-container">
      {/* Cabecera del Portal */}
      <div className="accountant-header">
        <div className="accountant-title">
          <div className="accountant-badge-header">Portal Profesional Contable</div>
          <h1>Panel de Control del Contador</h1>
          <p>
            {accountantProfile.full_name || 'Estudio Contable Méndez & Asociados'} · Monitoreo y Exportación Multi-Cliente ARCA
          </p>
        </div>
        <div className="accountant-actions-header">
          <Button
            variant="secondary"
            size="md"
            onClick={() => { soundService.playKeyTap(); setShowAddClientModal(true); }}
            iconLeading={<PlusIcon size={15} />}
          >
            Vincular Cliente por CUIT
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleDownloadPortfolioPdf}
            iconLeading={<FileTextIcon size={15} />}
            title="Descargar informe de toda la cartera en PDF para auditoría"
          >
            Informe Cartera PDF
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleBulkZip}
            disabled={isGeneratingZip}
            isLoading={isGeneratingZip}
            iconLeading={<DownloadIcon size={16} />}
          >
            Descargar Lotes del Día (ZIP Masivo)
          </Button>
        </div>
      </div>

      {/* Banner de Código de Vinculación Profesional estilo Untitled UI */}
      <Card style={{ marginBottom: '1.5rem', background: 'rgba(30, 27, 75, 0.45)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.2)', color: '#c4b5fd', border: '1px solid rgba(124, 58, 237, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LinkIcon size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Código de Vinculación Profesional para Clientes
                </span>
                <Badge variant="brand" hasDot={true}>Activo</Badge>
              </div>
              <div className="accountant-link-code font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', letterSpacing: '0.05em' }}>
                {accountantProfile.link_code || 'CONT-MENDEZ-9876'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(accountantProfile.link_code || 'CONT-MENDEZ-9876');
                  alert('¡Código copiado al portapapeles!');
                }
              }}
              iconLeading={<CopyIcon size={14} />}
            >
              Copiar Código
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { soundService.playKeyTap(); setShowLinkModal(true); }}
              iconLeading={<LinkIcon size={14} />}
            >
              Gestionar Vinculaciones
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards Banner estilo Untitled UI Metrics */}
      <StatGrid>
        <StatCard
          label="Clientes Monitoreados"
          value={totalClients}
          icon={<UsersIcon size={20} />}
          caption="Bajo gestión fiscal"
          trend="neutral"
        />
        <StatCard
          label="En Zona Segura"
          value={totalClients - inRiskClients - inWarningClients}
          icon={<ShieldCheckIcon size={20} />}
          caption="Categoría en orden"
          trend="up"
          change="Al día"
        />
        <StatCard
          label="Alerta o Peligro"
          value={inRiskClients + inWarningClients}
          icon={<AlertTriangleIcon size={20} />}
          caption={`${inRiskClients} al borde del límite`}
          trend={inRiskClients > 0 ? 'down' : 'neutral'}
          change={inRiskClients > 0 ? 'Riesgo' : 'Atención'}
        />
        <StatCard
          label="Lotes Listos para Descarga"
          value={readyBatchesCount}
          icon={<ReceiptTaxIcon size={20} />}
          caption="CSV ARCA generados"
          trend={readyBatchesCount > 0 ? 'up' : 'neutral'}
          change={`${readyBatchesCount} listos`}
        />
      </StatGrid>

      {/* Toolbar con Buscador, Filtros y Selector de Fecha */}
      <div className="accountant-toolbar">
        <SearchInput
          placeholder="Buscar por CUIT o Razón Social..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Status Filter Chips */}
        <div className="status-filter-chips">
          <button
            type="button"
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setStatusFilter('all'); }}
          >
            Todos ({totalClients})
          </button>
          <button
            type="button"
            className={`filter-chip green ${statusFilter === 'green' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setStatusFilter('green'); }}
          >
            🟢 En orden
          </button>
          <button
            type="button"
            className={`filter-chip yellow ${statusFilter === 'yellow' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setStatusFilter('yellow'); }}
          >
            🟡 Alerta ({inWarningClients})
          </button>
          <button
            type="button"
            className={`filter-chip red ${statusFilter === 'red' ? 'active' : ''}`}
            onClick={() => { soundService.playKeyTap(); setStatusFilter('red'); }}
          >
            <AlertTriangleIcon size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Riesgo ({inRiskClients})
          </button>
        </div>

        {/* View Toggle & Date Picker */}
        <div className="toolbar-controls-right">
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setViewMode('table'); }}
              title="Vista de Tabla"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <TableIcon size={14} /> Tabla
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setViewMode('cards'); }}
              title="Vista de Tarjetas"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <GridIcon size={14} /> Tarjetas
            </button>
          </div>

          <input
            type="date"
            className="date-selector-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Vista de Tabla */}
      {viewMode === 'table' ? (
        <div className="clients-table-card">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Comercio / Profesional</th>
                <th>CUIT</th>
                <th>Categoría</th>
                <th>Semáforo Fiscal</th>
                <th>Cierre del Día</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No se encontraron clientes asociados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const color = client.trafficColor || 'green';
                  const hasBatch = !!client.todayBatch;

                  return (
                    <tr key={client.id}>
                      <td>
                        <strong>{client.fantasy_name || client.razon_social}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{client.razon_social}</div>
                      </td>
                      <td><code>{client.cuit}</code></td>
                      <td>
                        <span className="client-cat-badge">Cat. {client.monotributo_category || 'A'}</span>
                      </td>
                      <td>
                        <span className={`dot-badge ${color}`}>
                          <span className={`status-dot-indicator dot-${color}`} />
                          <span style={{ textTransform: 'capitalize' }}>
                            {color === 'green' ? 'En orden' : color === 'yellow' ? 'Alerta' : 'Peligro'}
                          </span>
                        </span>
                      </td>
                      <td>
                        {hasBatch ? (
                          <div>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>
                              {formatCurrencyARS(client.todayBatch.total_amount)}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {client.todayBatch.total_sales_count} ventas
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            Sin cerrar
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-download-single"
                            onClick={() => handleDownloadClientPdf(client)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                            title="Descargar informe fiscal en PDF"
                          >
                            <FileTextIcon size={13} /> PDF Fiscal
                          </button>
                          <button
                            type="button"
                            className="btn-download-single"
                            onClick={() => handleDownloadClientExcel(client)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}
                            title="Descargar Libro de Ventas en formato Excel/CSV"
                          >
                            <FileSpreadsheetIcon size={13} /> Excel
                          </button>
                          <button
                            type="button"
                            className="btn-download-single"
                            onClick={() => {
                              soundService.playKeyTap();
                              setSelectedClientForConstancia(client);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(124, 58, 237, 0.12)', borderColor: 'rgba(124, 58, 237, 0.3)', color: '#c4b5fd' }}
                            title="Descargar Constancia de Inscripción oficial y Credencial F. 152 con QR ARCA"
                          >
                            <ShieldCheckIcon size={13} /> Constancia
                          </button>
                          {hasBatch ? (
                            <button
                              type="button"
                              className="btn-download-single"
                              onClick={() => handleDownloadSingle(client)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              title="Descargar lote CSV ARCA"
                            >
                              <DownloadIcon size={14} /> CSV ARCA
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sin lote</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vista de Tarjetas / Grid */
        <div className="clients-cards-grid">
          {filteredClients.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No se encontraron clientes asociados.
            </div>
          ) : (
            filteredClients.map((client) => {
              const color = client.trafficColor || 'green';
              const hasBatch = !!client.todayBatch;

              return (
                <div key={client.id} className="client-grid-card">
                  <div className="client-card-top">
                    <div>
                      <h3 className="client-card-title">{client.fantasy_name || client.razon_social}</h3>
                      <div className="client-card-subtitle">{client.razon_social}</div>
                    </div>
                    <span className="client-cat-badge">Cat. {client.monotributo_category || 'A'}</span>
                  </div>

                  <div className="client-card-cuit">
                    <span>CUIT:</span> <code>{client.cuit}</code>
                  </div>

                  <div className="client-card-status-row">
                    <span className="status-label">Estado Fiscal:</span>
                    <span className={`dot-badge ${color}`}>
                      <span className={`status-dot-indicator dot-${color}`} />
                      <span style={{ textTransform: 'capitalize' }}>
                        {color === 'green' ? 'En orden' : color === 'yellow' ? 'Alerta' : 'Peligro'}
                      </span>
                    </span>
                  </div>

                  <div className="client-card-batch-info">
                    {hasBatch ? (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cierre diario listo:</div>
                        <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                          {formatCurrencyARS(client.todayBatch.total_amount)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{client.todayBatch.total_sales_count} comprobantes</div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        Jornada pendiente de cierre
                      </div>
                    )}
                  </div>

                  <div className="client-card-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-download-single"
                      style={{ flex: 1, padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                      onClick={() => handleDownloadClientPdf(client)}
                    >
                      <FileTextIcon size={14} /> Informe PDF
                    </button>
                    {hasBatch && (
                      <button
                        type="button"
                        className="btn-download-single"
                        style={{ flex: 1, padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        onClick={() => handleDownloadSingle(client)}
                      >
                        <DownloadIcon size={14} /> CSV ARCA
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Vinculación de Nuevo Cliente */}
      {showAddClientModal && (
        <div className="auth-overlay">
          <div className="auth-card" style={{ maxWidth: '480px' }}>
            <div className="auth-header">
              <div className="auth-brand-logo" style={{ color: '#38bdf8' }}><PlusIcon size={32} /></div>
              <h2 className="auth-title">Vincular Cliente al Estudio</h2>
              <p className="auth-subtitle">Ingresa los datos fiscales del contribuyente</p>
            </div>

            <form onSubmit={handleAddClientSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">CUIT (11 Dígitos)</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="20301234567"
                  value={newCuit}
                  onChange={(e) => setNewCuit(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={11}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Nombre de Fantasía / Comercio</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ej. Kiosco El Sol"
                  value={newFantasyName}
                  onChange={(e) => setNewFantasyName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Razón Social</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ej. Juan Gómez SRL"
                  value={newRazonSocial}
                  onChange={(e) => setNewRazonSocial(e.target.value)}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Categoría de Monotributo</label>
                <select
                  className="auth-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((cat) => (
                    <option key={cat} value={cat}>Categoría {cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="auth-btn-primary" style={{ flex: 1, margin: 0 }}>
                  Vincular Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  style={{
                    padding: '0.8rem 1.25rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Completo de Vinculación Contador <-> Clientes */}
      <AccountantLinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        accountantUser={accountantProfile}
        onClientsUpdated={() => {
          // Si el padre pasó clients, se mantendrá actualizado
        }}
      />

      {/* Modal de Constancia de Inscripción Oficial ARCA */}
      {selectedClientForConstancia && (
        <OfficialConstanciaInscripcionModal
          isOpen={Boolean(selectedClientForConstancia)}
          onClose={() => setSelectedClientForConstancia(null)}
          businessProfile={{
            cuit: selectedClientForConstancia.cuit || '20-38491029-4',
            razon_social: selectedClientForConstancia.razon_social || selectedClientForConstancia.fantasy_name,
            fantasy_name: selectedClientForConstancia.fantasy_name || selectedClientForConstancia.razon_social,
            category: selectedClientForConstancia.monotributo_category || 'D',
            fiscal_address: selectedClientForConstancia.fiscal_address || 'Av. Corrientes 1240, CABA',
            activity_name: selectedClientForConstancia.activity_name || 'Servicios profesionales y comerciales',
            activity_code: selectedClientForConstancia.activity_code || '620900',
            cur: '1029384'
          }}
        />
      )}
    </div>
  );
}

