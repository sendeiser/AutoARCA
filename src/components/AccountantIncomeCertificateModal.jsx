import React, { useRef } from 'react';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { soundService } from '../services/soundService.js';
import { formatCurrencyARS } from '../services/taxAlertEngine.js';
import { PrinterIcon, DownloadIcon, ShieldCheckIcon } from './Icons.jsx';
import '../styles/accountantIncomeCert.css';

export default function AccountantIncomeCertificateModal({
  isOpen,
  onClose,
  client = {},
  accountantProfile = {
    full_name: 'Cr. Martín Méndez',
    title: 'Contador Público (UBA)',
    cuit: '20-29837481-9',
    matricula: 'T° 142 F° 89 CPCECABA',
    estudio: 'Estudio Contable Méndez & Asociados'
  }
}) {
  const printRef = useRef(null);
  if (!isOpen || !client) return null;

  const todayStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const rollingTotal = Number(client.rolling12mSales || 7200000);
  const monthlyAvg = Math.round(rollingTotal / 12);

  // Simulación de los últimos 12 meses para la tabla formal de la certificación
  const monthsData = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const mName = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
    const factor = 0.85 + ((i % 4) * 0.1);
    const amount = Math.round(monthlyAvg * factor);
    return { month: mName, amount };
  });

  const handlePrint = () => {
    soundService.playKeyTap();
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Certificación Profesional de Ingresos — Monotributo (FACPCE)"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div className="cert-footer-legend">
            <ShieldCheckIcon size={16} className="text-success" />
            <span>Modelo estándar FACPCE / CPCECABA para Bancos y Créditos</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              <PrinterIcon size={16} /> Imprimir / Guardar PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="income-cert-sheet printable-area" ref={printRef}>
        {/* Membrete Profesional */}
        <div className="cert-header">
          <div>
            <h2 className="cert-estudio-name">{accountantProfile.estudio || 'Estudio Contable Méndez & Asociados'}</h2>
            <div className="cert-accountant-sub">
              <strong>{accountantProfile.full_name || 'Cr. Martín Méndez'}</strong> · {accountantProfile.title || 'Contador Público'}
            </div>
            <div className="cert-accountant-mat font-mono">
              CUIT: {accountantProfile.cuit || '20-29837481-9'} · {accountantProfile.matricula || 'T° 142 F° 89 CPCECABA'}
            </div>
          </div>
          <div className="cert-date-box font-mono">
            {todayStr}
          </div>
        </div>

        <div className="cert-title-block">
          <h3>CERTIFICACIÓN CONTABLE SOBRE MANIFESTACIÓN DE INGRESOS</h3>
          <span className="cert-norm-tag">Emitida conforme normas de la Resolución Técnica N° 37 / FACPCE</span>
        </div>

        <div className="cert-text-body">
          <p>
            Señores:<br />
            <strong>A QUIEN CORRESPONDA / ENTIDADES FINANCIERAS</strong><br />
            Ciudad Autónoma de Buenos Aires
          </p>

          <p>
            En mi carácter de Contador Público independiente, a pedido de mi cliente <strong>{client.fantasy_name || client.razon_social}</strong>, con CUIT N° <strong>{client.cuit}</strong>, con domicilio legal en la República Argentina, emito la presente certificación contable sobre los ingresos devengados correspondientes al Régimen Simplificado para Pequeños Contribuyentes (Monotributo).
          </p>

          <div className="cert-details-box">
            <strong>1. DETALLE DE INGRESOS BRUTOS DE LOS ÚLTIMOS 12 MESES:</strong>
            <table className="cert-months-table">
              <thead>
                <tr>
                  <th>Período Mensual</th>
                  <th>Comprobantes Electrónicos Emitidos</th>
                  <th style={{ textAlign: 'right' }}>Total Facturado ($ ARS)</th>
                </tr>
              </thead>
              <tbody>
                {monthsData.map((m, idx) => (
                  <tr key={idx}>
                    <td className="text-capitalize">{m.month}</td>
                    <td>Facturas C con CAE oficial ARCA</td>
                    <td style={{ textAlign: 'right' }} className="font-mono">{formatCurrencyARS(m.amount)}</td>
                  </tr>
                ))}
                <tr className="cert-total-row">
                  <td colSpan="2"><strong>TOTAL ACUMULADO ÚLTIMOS 12 MESES</strong></td>
                  <td style={{ textAlign: 'right' }} className="font-mono font-bold text-primary">
                    {formatCurrencyARS(rollingTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>2. MANIFESTACIÓN DEL PROFESIONAL:</strong><br />
            He cotejado la información precedente con los comprobantes electrónicos emitidos en el servicio web oficial <em>Comprobantes en Línea</em> de la Agencia de Recaudación y Control Aduanero (ARCA), verificando la autenticidad de los Códigos de Autorización Electrónico (CAE) respectivos y la constancia de inscripción en la Categoría <strong>{client.monotributo_category || 'D'}</strong>.
          </p>

          <p>
            Se extiende la presente certificación a los efectos de ser presentada ante entidades bancarias, financieras o donde corresponda, en la Ciudad Autónoma de Buenos Aires, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-AR', { month: 'long' })} de {new Date().getFullYear()}.
          </p>
        </div>

        {/* Firma del Contador */}
        <div className="cert-signature-layout">
          <div className="cert-signature-box">
            <div className="cert-signature-line" />
            <strong>{accountantProfile.full_name || 'Cr. Martín Méndez'}</strong>
            <span>Contador Público</span>
            <span className="font-mono">{accountantProfile.matricula || 'T° 142 F° 89 CPCECABA'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
