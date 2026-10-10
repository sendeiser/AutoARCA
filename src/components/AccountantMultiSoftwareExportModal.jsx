import React, { useState } from 'react';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { soundService } from '../services/soundService.js';
import {
  generateLibroVentasExcelCsv,
  generateTangoVentasTxt,
  generateHolistorBejermanTxt
} from '../services/arcaExportService.js';
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon, CheckCircleIcon } from './Icons.jsx';
import '../styles/accountantExportModal.css';

export default function AccountantMultiSoftwareExportModal({
  isOpen,
  onClose,
  client = {},
  sales = []
}) {
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !client) return null;

  const clientSales = sales.length > 0 ? sales : (client.todayBatch?.sales || [
    { id: 1, amount: 45000, date: new Date().toISOString().slice(0, 10), customer_name: 'Consumidor Final', payment_method: 'cash' },
    { id: 2, amount: 98000, date: new Date().toISOString().slice(0, 10), customer_name: 'Distribuidora San Juan', customer_doc_type: 'CUIT', customer_doc_number: '30712345678', payment_method: 'transfer' },
    { id: 3, amount: 32000, date: new Date().toISOString().slice(0, 10), customer_name: 'Mariano López', customer_doc_type: 'DNI', customer_doc_number: '34910293', payment_method: 'card' }
  ]);

  const handleExecuteExport = () => {
    soundService.playKeyTap();
    setIsExporting(true);

    try {
      let result;
      let mimeType = 'text/plain;charset=utf-8;';

      if (selectedFormat === 'excel') {
        result = generateLibroVentasExcelCsv(clientSales, client);
        mimeType = 'text/csv;charset=utf-8;';
      } else if (selectedFormat === 'tango') {
        result = generateTangoVentasTxt(clientSales, client);
      } else if (selectedFormat === 'holistor') {
        result = generateHolistorBejermanTxt(clientSales, client);
      } else {
        result = {
          filename: `ARCA_COMPROBANTES_${client.cuit || 'cuit'}.csv`,
          content: clientSales.map((s) => `${s.date};011;00001;${s.amount};${s.customer_doc_number || 0}`).join('\r\n')
        };
        mimeType = 'text/csv;charset=utf-8;';
      }

      const blob = new Blob([result.content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', result.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      soundService.playSuccessChime();
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      alert('Error al exportar archivo: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Exportar Comprobantes — ${client.fantasy_name || client.razon_social}`}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleExecuteExport} disabled={isExporting}>
            <DownloadIcon size={16} /> {isExporting ? 'Generando...' : 'Descargar Archivo'}
          </Button>
        </div>
      }
    >
      <div className="multi-export-modal-body">
        <p className="multi-export-desc">
          Seleccioná el formato contable en el que deseás descargar el lote de comprobantes de ventas para importar en el software del estudio:
        </p>

        <div className="export-formats-grid">
          <label className={`export-format-card ${selectedFormat === 'excel' ? 'active' : ''}`}>
            <input
              type="radio"
              name="exportFormat"
              value="excel"
              checked={selectedFormat === 'excel'}
              onChange={() => setSelectedFormat('excel')}
            />
            <div className="format-card-content">
              <div className="format-card-icon">
                <FileSpreadsheetIcon size={24} className="text-success" />
              </div>
              <div>
                <strong>Excel Universal (UTF-8 BOM)</strong>
                <span>Formato tabular .csv con caracteres y acentos nativos para planillas de cálculo.</span>
              </div>
            </div>
          </label>

          <label className={`export-format-card ${selectedFormat === 'tango' ? 'active' : ''}`}>
            <input
              type="radio"
              name="exportFormat"
              value="tango"
              checked={selectedFormat === 'tango'}
              onChange={() => setSelectedFormat('tango')}
            />
            <div className="format-card-content">
              <div className="format-card-icon">
                <FileTextIcon size={24} className="text-primary" />
              </div>
              <div>
                <strong>Tango Gestión (.txt)</strong>
                <span>Archivo de importación para módulo Ventas / Facturación de Tango Software.</span>
              </div>
            </div>
          </label>

          <label className={`export-format-card ${selectedFormat === 'holistor' ? 'active' : ''}`}>
            <input
              type="radio"
              name="exportFormat"
              value="holistor"
              checked={selectedFormat === 'holistor'}
              onChange={() => setSelectedFormat('holistor')}
            />
            <div className="format-card-content">
              <div className="format-card-icon">
                <FileTextIcon size={24} className="text-warning" />
              </div>
              <div>
                <strong>Holistor / Sistemas Bejerman (.txt)</strong>
                <span>Registro posicional estándar para liquidación de impuestos y auditoría.</span>
              </div>
            </div>
          </label>

          <label className={`export-format-card ${selectedFormat === 'arca' ? 'active' : ''}`}>
            <input
              type="radio"
              name="exportFormat"
              value="arca"
              checked={selectedFormat === 'arca'}
              onChange={() => setSelectedFormat('arca')}
            />
            <div className="format-card-content">
              <div className="format-card-icon">
                <FileTextIcon size={24} />
              </div>
              <div>
                <strong>ARCA Facturador Oficial (.csv)</strong>
                <span>Estructura nativa para importación por lotes en el portal de ARCA.</span>
              </div>
            </div>
          </label>
        </div>

        {downloadSuccess && (
          <div className="export-success-banner">
            <CheckCircleIcon size={16} />
            <span>¡Archivo generado y descargado con éxito!</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
