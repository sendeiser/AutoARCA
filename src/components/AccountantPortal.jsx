import React, { useState, useEffect } from 'react';
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
  FileSpreadsheetIcon,
  EyeIcon,
  CheckCircleIcon
} from './Icons.jsx';
import AccountantLinkModal from './AccountantLinkModal.jsx';
import AccountantClientDrawer from './AccountantClientDrawer.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { StatCard, StatGrid } from './untitled-ui/StatCard.jsx';
import { Card } from './untitled-ui/Card.jsx';
import { SearchInput } from './untitled-ui/SearchInput.jsx';
import { reportPdfService } from '../services/reportPdfService.js';
import { generateLibroVentasExcelCsv } from '../services/arcaExportService.js';
import OfficialConstanciaInscripcionModal from './OfficialConstanciaInscripcionModal.jsx';
import AccountantRecategorizationMatrix from './AccountantRecategorizationMatrix.jsx';
import AccountantDfeInbox from './AccountantDfeInbox.jsx';
import AccountantBankRiskDashboard from './AccountantBankRiskDashboard.jsx';
import AccountantTaxCalendar from './AccountantTaxCalendar.jsx';
import AccountantIncomeCertificateModal from './AccountantIncomeCertificateModal.jsx';
import AccountantFeesManager from './AccountantFeesManager.jsx';
import AccountantMultiSoftwareExportModal from './AccountantMultiSoftwareExportModal.jsx';
import AccountantFinancialStatements from './AccountantFinancialStatements.jsx';
import AccountantDocPortal from './AccountantDocPortal.jsx';
import '../styles/accountantPortal.css';
import '../styles/untitled-ui.css';

export default function AccountantPortal({
  clients = [],
  onDownloadZip,
  accountantProfile = {},
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange
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
  const [selectedClientForCert, setSelectedClientForCert] = useState(null);
  const [selectedClientForExport, setSelectedClientForExport] = useState(null);
  const [drawerClient, setDrawerClient] = useState(null);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [internalActiveTab, setInternalActiveTab] = useState('clientes'); // 'clientes' | 'recategorizacion' | 'dfe' | 'riesgo_bancario' | 'calendario' | 'honorarios'
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab) => {
    setInternalActiveTab(tab);
    if (controlledOnTabChange) controlledOnTabChange(tab);
  };

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    if (openMenuId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [openMenuId]);

  // Sync state if props change
  React.useEffect(() => {
    setClientList(clients);
  }, [clients]);

  // Filtrado reactivo de comercios con chips de 1-clic
  const filteredClients = clientList.filter((c) => {
    const query = searchQuery.toLowerCase();
    const cuitMatch = (c.cuit || '').includes(query);
    const nameMatch = (c.fantasy_name || c.razon_social || '').toLowerCase().includes(query);
    const matchesSearch = cuitMatch || nameMatch;

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'red') return c.trafficColor === 'red';
    if (statusFilter === 'yellow') return c.trafficColor === 'yellow';
    if (statusFilter === 'green') return c.trafficColor === 'green';
    if (statusFilter === 'exceeded') return (c.percentageConsumed > 100) || (c.rolling12mSales > (c.maxAnnualBilling || 16450000));
    if (statusFilter === 'batches') return !!c.todayBatch;
    if (statusFilter === 'vencen_hoy') {
      const rawCuit = (c.cuit || '0').replace(/[^0-9]/g, '');
      const lastDigit = Number(rawCuit.slice(-2, -1) || rawCuit.slice(-1) || 0);
      return lastDigit <= 3;
    }
    return true;
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

  const allSelected = filteredClients.length > 0 && filteredClients.every((c) => selectedClientIds.includes(c.id));

  const toggleSelectAll = () => {
    soundService.playKeyTap();
    if (allSelected) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map((c) => c.id));
    }
  };

  const toggleSelectClient = (id, e) => {
    if (e) e.stopPropagation();
    soundService.playTap();
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkZip = async (customClients = null) => {
    soundService.playKeyTap();
    const clientsToUse = Array.isArray(customClients) ? customClients : filteredClients;
    if (onDownloadZip) {
      onDownloadZip(selectedDate, clientsToUse);
      return;
    }

    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      let addedFilesCount = 0;

      clientsToUse.forEach((client) => {
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

  const handleDownloadPortfolioPdf = (customClients = null) => {
    soundService.playKeyTap();
    const clientsToUse = Array.isArray(customClients) ? customClients : filteredClients;
    try {
      reportPdfService.generateAccountantPortfolioReport({
        clients: clientsToUse,
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
      {/* Cabecera del Portal — Solo visible en la primera página (Cartera & Lotes) */}
      {activeTab === 'clientes' && (
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
      )}

      {/* Pestaña Principal: Cartera & Lotes Diarios */}
      {activeTab === 'clientes' && (
        <>
          {/* Banner de Código de Vinculación Profesional estilo Untitled UI */}
          <Card style={{ marginBottom: '1.5rem', background: 'rgba(30, 27, 75, 0.45)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <div className="accountant-link-banner-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
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
              <div className="accountant-link-banner-actions" style={{ display: 'flex', gap: '0.5rem' }}>
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

            {/* Status Filter Chips de 1-Clic */}
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
                className={`filter-chip red ${statusFilter === 'red' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setStatusFilter('red'); }}
                title="Mostrar exclusivamente clientes en alerta roja"
              >
                <AlertTriangleIcon size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Solo Alerta Roja ({inRiskClients})
              </button>
              <button
                type="button"
                className={`filter-chip yellow ${statusFilter === 'yellow' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setStatusFilter('yellow'); }}
                title="Clientes con consumo entre 80% y 95%"
              >
                🟡 Alerta ({inWarningClients})
              </button>
              <button
                type="button"
                className={`filter-chip green ${statusFilter === 'green' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setStatusFilter('green'); }}
                title="Clientes en zona segura fiscal"
              >
                🟢 En orden ({totalClients - inRiskClients - inWarningClients})
              </button>
              <button
                type="button"
                className={`filter-chip exceeded ${statusFilter === 'exceeded' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setStatusFilter('exceeded'); }}
                title="Clientes que superaron el 100% de la categoría"
              >
                🚨 Excedidos
              </button>
              <button
                type="button"
                className={`filter-chip batches ${statusFilter === 'batches' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setStatusFilter('batches'); }}
                title="Comercios con lotes CSV listos para ARCA"
              >
                📦 Con Lotes ({readyBatchesCount})
              </button>
              <button
                type="button"
                className={`filter-chip vencen-hoy ${statusFilter === 'vencen_hoy' ? 'active' : ''}`}
                onClick={() => { soundService.playKeyTap(); setStatusFilter('vencen_hoy'); }}
                title="Clientes con vencimiento impositivo en los próximos días"
              >
                ⚡ Vencen Hoy
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
                    <th style={{ width: '42px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="table-checkbox-header"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        title="Seleccionar o deseleccionar todos los comercios"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    <th>Comercio / Profesional</th>
                    <th>CUIT</th>
                    <th>Categoría</th>
                    <th>Semáforo Fiscal</th>
                    <th>Cierre del Día</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                        No se encontraron clientes asociados con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const color = client.trafficColor || 'green';
                      const hasBatch = !!client.todayBatch;
                      const isSelected = selectedClientIds.includes(client.id);

                      return (
                        <tr key={client.id} className={isSelected ? 'row-selected' : ''}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelectClient(client.id, e)}
                              aria-label={`Seleccionar ${client.fantasy_name || client.razon_social}`}
                            />
                          </td>
                          <td
                            className="client-td-name"
                            data-label="Comercio"
                            onClick={() => { soundService.playKeyTap(); setDrawerClient(client); }}
                            style={{ cursor: 'pointer' }}
                            title="Haz clic para ver Ficha 360°"
                          >
                            <strong>{client.fantasy_name || client.razon_social}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{client.razon_social}</div>
                          </td>
                          <td data-label="CUIT"><code>{client.cuit}</code></td>
                          <td data-label="Categoría">
                            <span className="client-cat-badge">Cat. {client.monotributo_category || 'A'}</span>
                          </td>
                          <td data-label="Semáforo Fiscal">
                            <span className={`dot-badge ${color}`}>
                              <span className={`status-dot-indicator dot-${color}`} />
                              <span style={{ textTransform: 'capitalize' }}>
                                {color === 'green' ? 'En orden' : color === 'yellow' ? 'Alerta' : 'Peligro'}
                              </span>
                            </span>
                          </td>
                          <td data-label="Cierre del Día">
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
                          <td className="client-td-actions" data-label="Acciones">
                            <div className="table-actions-consolidated">
                              <button
                                type="button"
                                className="btn-action-primary"
                                onClick={() => {
                                  soundService.playKeyTap();
                                  setDrawerClient(client);
                                }}
                                title="Abrir Ficha 360° del Cliente"
                              >
                                <EyeIcon size={13} /> Ficha 360°
                              </button>

                              {hasBatch && (
                                <button
                                  type="button"
                                  className="btn-action-batch"
                                  onClick={() => handleDownloadSingle(client)}
                                  title="Descargar lote CSV ARCA"
                                >
                                  <DownloadIcon size={13} /> CSV
                                </button>
                              )}

                              <div className="action-menu-anchor" style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  className={`btn-action-menu ${openMenuId === client.id ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundService.playTap();
                                    setOpenMenuId(openMenuId === client.id ? null : client.id);
                                  }}
                                  title="Más opciones de descarga y exportación"
                                  aria-label="Más opciones"
                                >
                                  •••
                                </button>

                                {openMenuId === client.id && (
                                  <div className="action-dropdown-popover" onClick={(e) => e.stopPropagation()}>
                                    <div className="dropdown-popover-header">
                                      <span>{client.fantasy_name || client.razon_social}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleDownloadClientPdf(client);
                                      }}
                                    >
                                      <FileTextIcon size={14} className="icon-sky" /> PDF Fiscal
                                    </button>
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleDownloadClientExcel(client);
                                      }}
                                    >
                                      <FileSpreadsheetIcon size={14} className="icon-emerald" /> Excel Libro Ventas
                                    </button>
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        soundService.playKeyTap();
                                        setSelectedClientForConstancia(client);
                                      }}
                                    >
                                      <ShieldCheckIcon size={14} className="icon-violet" /> Constancia F.152 & QR
                                    </button>
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        soundService.playKeyTap();
                                        setSelectedClientForCert(client);
                                      }}
                                    >
                                      <FileTextIcon size={14} className="icon-amber" /> Certificación FACPCE
                                    </button>
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        soundService.playKeyTap();
                                        setSelectedClientForExport(client);
                                      }}
                                    >
                                      <DownloadIcon size={14} className="icon-indigo" /> Exportar Tango / Holistor
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button
                                      type="button"
                                      className="dropdown-item highlight"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        soundService.playKeyTap();
                                        setDrawerClient(client);
                                      }}
                                    >
                                      <EyeIcon size={14} /> Ficha 360° Completa
                                    </button>
                                  </div>
                                )}
                              </div>
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
                  const isSelected = selectedClientIds.includes(client.id);

                  return (
                    <div key={client.id} className={`client-grid-card ${isSelected ? 'card-selected' : ''}`}>
                      <div className="client-card-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectClient(client.id, e)}
                            aria-label={`Seleccionar ${client.fantasy_name || client.razon_social}`}
                          />
                          <div>
                            <h3
                              className="client-card-title"
                              onClick={() => { soundService.playKeyTap(); setDrawerClient(client); }}
                              style={{ cursor: 'pointer' }}
                              title="Abrir Ficha 360°"
                            >
                              {client.fantasy_name || client.razon_social}
                            </h3>
                            <div className="client-card-subtitle">{client.razon_social}</div>
                          </div>
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

                      <div className="client-card-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-download-single"
                          style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa', fontWeight: 700 }}
                          onClick={() => {
                            soundService.playKeyTap();
                            setDrawerClient(client);
                          }}
                        >
                          <EyeIcon size={13} /> Ficha 360°
                        </button>
                        {hasBatch && (
                          <button
                            type="button"
                            className="btn-download-single"
                            style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            onClick={() => handleDownloadSingle(client)}
                          >
                            <DownloadIcon size={13} /> CSV
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-download-single"
                          style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleDownloadClientPdf(client)}
                          title="Descargar PDF Fiscal"
                        >
                          <FileTextIcon size={13} /> PDF
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Barra Flotante de Acciones en Lote (Bulk Actions Bar) */}
          {selectedClientIds.length > 0 && (
            <div className="accountant-bulk-bar">
              <div className="bulk-bar-badge font-mono">
                <CheckCircleIcon size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                <span>{selectedClientIds.length}</span> {selectedClientIds.length === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
              </div>
              <div className="bulk-bar-actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const selected = filteredClients.filter((c) => selectedClientIds.includes(c.id));
                    handleBulkZip(selected);
                  }}
                  iconLeading={<DownloadIcon size={14} />}
                >
                  Descargar ZIP ({selectedClientIds.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const selected = filteredClients.filter((c) => selectedClientIds.includes(c.id));
                    handleDownloadPortfolioPdf(selected);
                  }}
                  iconLeading={<FileTextIcon size={14} />}
                >
                  PDF Cartera ({selectedClientIds.length})
                </Button>
                <button
                  type="button"
                  className="btn-bulk-clear"
                  onClick={() => {
                    soundService.playTap();
                    setSelectedClientIds([]);
                  }}
                  title="Limpiar selección"
                >
                  ✕ Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Ficha 360° del Cliente (Slide-Over Drawer) */}
          <AccountantClientDrawer
            client={drawerClient}
            onClose={() => setDrawerClient(null)}
            onDownloadPdf={handleDownloadClientPdf}
            onDownloadExcel={handleDownloadClientExcel}
            onOpenConstancia={setSelectedClientForConstancia}
            onOpenCert={setSelectedClientForCert}
            onOpenExport={setSelectedClientForExport}
            onDownloadSingleBatch={handleDownloadSingle}
            accountantProfile={accountantProfile}
          />
        </>
      )}

      {/* Pestaña: Matriz de Recategorización Semestral */}
      {activeTab === 'recategorizacion' && (
        <AccountantRecategorizationMatrix clients={clientList} />
      )}

      {/* Pestaña: Central Unificada de DFE E-Ventanilla */}
      {activeTab === 'dfe' && (
        <AccountantDfeInbox clients={clientList} />
      )}

      {/* Pestaña: Tablero de Exclusión y Riesgo Bancario */}
      {activeTab === 'riesgo_bancario' && (
        <AccountantBankRiskDashboard clients={clientList} />
      )}

      {/* Pestaña: Balances Comerciales & Ratios para Bancos y SGR */}
      {activeTab === 'balances' && (
        <AccountantFinancialStatements clients={clientList} accountantProfile={accountantProfile} />
      )}

      {/* Pestaña: Calendario Impositivo por CUIT */}
      {activeTab === 'calendario' && (
        <AccountantTaxCalendar clients={clientList} />
      )}

      {activeTab === 'honorarios' && (
        <AccountantFeesManager clients={clientList} accountantProfile={accountantProfile} />
      )}

      {/* Pestaña: Central Documental & Requerimientos de Clientes */}
      {activeTab === 'documentacion' && (
        <AccountantDocPortal clients={clientList} accountantProfile={accountantProfile} />
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

      {/* Modal de Certificación de Ingresos FACPCE */}
      {selectedClientForCert && (
        <AccountantIncomeCertificateModal
          isOpen={Boolean(selectedClientForCert)}
          onClose={() => setSelectedClientForCert(null)}
          client={selectedClientForCert}
          accountantProfile={accountantProfile}
        />
      )}

      {/* Modal de Exportación Multi-Software (Tango, Holistor, Bejerman, Excel BOM) */}
      {selectedClientForExport && (
        <AccountantMultiSoftwareExportModal
          isOpen={Boolean(selectedClientForExport)}
          onClose={() => setSelectedClientForExport(null)}
          client={selectedClientForExport}
        />
      )}
    </div>
  );
}

