import React, { useState } from 'react';
import JSZip from 'jszip';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import '../styles/accountantPortal.css';

export default function AccountantPortal({
  clients = [],
  onDownloadZip,
  accountantProfile = {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  // Filtrado reactivo de comercios
  const filteredClients = clients.filter((c) => {
    const query = searchQuery.toLowerCase();
    const cuitMatch = (c.cuit || '').includes(query);
    const nameMatch = (c.fantasy_name || c.razon_social || '').toLowerCase().includes(query);
    return cuitMatch || nameMatch;
  });

  const handleDownloadSingle = (client) => {
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
  };

  const handleBulkZip = async () => {
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
    } catch (err) {
      alert('Error al generar archivo ZIP: ' + err.message);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="accountant-portal-container">
      {/* Cabecera del Portal */}
      <div className="accountant-header">
        <div className="accountant-title">
          <h1>Panel de Control del Contador</h1>
          <p>
            {accountantProfile.full_name || 'Estudio Contable'} · Gestión y Monitoreo Multi-Cliente ARCA
          </p>
        </div>
        <div>
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

      {/* Toolbar con Buscador y Selector de Fecha */}
      <div className="accountant-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por CUIT o Razón Social..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <input
          type="date"
          className="date-selector-input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Tabla de Comercios Asignados */}
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
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
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
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>Cat. {client.monotributo_category || 'A'}</span>
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
    </div>
  );
}
