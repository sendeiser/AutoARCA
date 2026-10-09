import React, { useState } from 'react';
import JSZip from 'jszip';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { soundService } from '../services/soundService.js';
import '../styles/accountantPortal.css';

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
  const [newCuit, setNewCuit] = useState('');
  const [newFantasyName, setNewFantasyName] = useState('');
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newCategory, setNewCategory] = useState('D');

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
          <button
            type="button"
            className="btn-add-client-top"
            onClick={() => { soundService.playKeyTap(); setShowAddClientModal(true); }}
          >
            ➕ Vincular Cliente por CUIT
          </button>
          <button
            type="button"
            className="bulk-zip-btn"
            onClick={handleBulkZip}
            disabled={isGeneratingZip}
          >
            📦 Descargar Lotes del Día (ZIP Masivo)
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="accountant-kpi-grid">
        <div className="kpi-metric-card">
          <div className="kpi-metric-label">Clientes Monitoreados</div>
          <div className="kpi-metric-val">{totalClients}</div>
          <div className="kpi-metric-sub">Bajo gestión fiscal</div>
        </div>
        <div className="kpi-metric-card">
          <div className="kpi-metric-label">En Zona Segura</div>
          <div className="kpi-metric-val" style={{ color: '#10b981' }}>
            {totalClients - inRiskClients - inWarningClients}
          </div>
          <div className="kpi-metric-sub">Categoría en orden</div>
        </div>
        <div className="kpi-metric-card">
          <div className="kpi-metric-label">Alerta o Peligro</div>
          <div className="kpi-metric-val" style={{ color: inRiskClients > 0 ? '#ef4444' : '#f59e0b' }}>
            {inRiskClients + inWarningClients}
          </div>
          <div className="kpi-metric-sub">{inRiskClients} al borde del límite</div>
        </div>
        <div className="kpi-metric-card">
          <div className="kpi-metric-label">Lotes Listos para Descarga</div>
          <div className="kpi-metric-val" style={{ color: '#38bdf8' }}>{readyBatchesCount}</div>
          <div className="kpi-metric-sub">CSV ARCA generados</div>
        </div>
      </div>

      {/* Toolbar con Buscador, Filtros y Selector de Fecha */}
      <div className="accountant-toolbar">
        <div className="toolbar-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por CUIT o Razón Social..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
            🔴 Peligro ({inRiskClients})
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
            >
              ☰ Tabla
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => { soundService.playKeyTap(); setViewMode('cards'); }}
              title="Vista de Tarjetas"
            >
              ▦ Tarjetas
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
                          <span>{color === 'green' ? '🟢' : color === 'yellow' ? '🟡' : '🔴'}</span>
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
                        {hasBatch ? (
                          <button
                            type="button"
                            className="btn-download-single"
                            onClick={() => handleDownloadSingle(client)}
                          >
                            📥 Descargar CSV
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Pendiente</span>
                        )}
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
                      <span>{color === 'green' ? '🟢' : color === 'yellow' ? '🟡' : '🔴'}</span>
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

                  <div className="client-card-actions">
                    {hasBatch ? (
                      <button
                        type="button"
                        className="btn-download-single"
                        style={{ width: '100%', padding: '0.65rem' }}
                        onClick={() => handleDownloadSingle(client)}
                      >
                        📥 Descargar CSV ARCA
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                        Esperando cierre nocturno
                      </div>
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
              <div className="auth-brand-logo">🤝</div>
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
                  Vincular Cliente 🚀
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
    </div>
  );
}

