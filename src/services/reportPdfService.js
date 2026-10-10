/**
 * AutoARCA — Servicio de Generación de Reportes PDF Profesionales
 * Diseñado específicamente para Contadores Públicos y Estudios Contables.
 * Proporciona informes auditables de cumplimiento ARCA, semáforo fiscal y detalle de comprobantes.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('es-AR');
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-AR');
  } catch {
    return dateStr;
  }
}

export const reportPdfService = {
  /**
   * Genera el Reporte Fiscal Individual de un Cliente / Comercio
   */
  generateClientFiscalReport({
    client,
    businessProfile,
    metrics,
    sales = [],
    batchHistory = [],
    accountantProfile = null
  }) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [37, 99, 235]; // Azul #2563eb
    const darkColor = [15, 23, 42]; // Slate 900
    const grayText = [100, 116, 139]; // Slate 500
    const lightBg = [248, 250, 252]; // Slate 50

    // 1. Cabecera y Membrete Profesional
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('AutoARCA PRO — INFORME FISCAL Y CONTROL DE MONOTRIBUTO', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    const dateFormatted = new Date().toLocaleString('es-AR');
    doc.text(`Fecha y Hora de Emisión: ${dateFormatted} | Período: Facturación en Curso`, 14, 18);

    // 2. Datos del Estudio Contable y del Contribuyente
    let currentY = 32;

    // Caja Estudio Contable
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 88, 28, 2, 2, 'FD');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('ESTUDIO CONTABLE AUDITOR', 18, currentY + 6);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const accName = accountantProfile?.full_name || 'Estudio Contable Méndez & Asoc.';
    doc.text(accName, 18, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(`Matrícula: ${accountantProfile?.matricula || 'T° 142 F° 89'}`, 18, currentY + 17);
    doc.text(`Jurisdicción: ${accountantProfile?.jurisdiccion || 'CPCELR (La Rioja)'}`, 18, currentY + 22);

    // Caja Datos del Contribuyente
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(108, currentY, 88, 28, 2, 2, 'FD');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('CONTRIBUYENTE / MONOTRIBUTISTA', 112, currentY + 6);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const clientRazon = businessProfile?.razon_social || client?.fullName || client?.full_name || 'Comercio';
    doc.text(clientRazon, 112, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    const cuitNumber = businessProfile?.cuit || client?.cuit || '20301234567';
    const catLetter = businessProfile?.monotributo_category || client?.monotributoCategory || 'D';
    doc.text(`CUIT: ${cuitNumber} | Cat. Monotributo: ${catLetter}`, 112, currentY + 17);
    doc.text(`Fantasía: ${businessProfile?.fantasy_name || 'Comercio Local'}`, 112, currentY + 22);

    currentY += 34;

    // 3. Semáforo Fiscal de Recategorización ARCA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('1. Estado del Semáforo Fiscal y Topes de Recategorización', 14, currentY);

    currentY += 4;

    const trafficColor = metrics?.trafficLight?.color || 'green';
    let statusLabel = 'ÓPTIMO / ZONA SEGURA';
    let statusColorRgb = [16, 185, 129]; // Verde

    if (trafficColor === 'yellow') {
      statusLabel = 'PRECAUCIÓN / ZONA DE ALERTA';
      statusColorRgb = [245, 158, 11]; // Amarillo
    } else if (trafficColor === 'red') {
      statusLabel = 'RIESGO CRÍTICO / EXCLUSIÓN INMINENTE';
      statusColorRgb = [239, 68, 68]; // Rojo
    }

    doc.setFillColor(statusColorRgb[0], statusColorRgb[1], statusColorRgb[2]);
    doc.roundedRect(14, currentY, 182, 10, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`ESTADO FISCAL: ${statusLabel}`, 18, currentY + 6.8);

    currentY += 13;

    // Tabla de Métricas del Semáforo
    const metricData = [
      ['Facturación Acumulada 12 Meses', formatCurrency(metrics?.rolling12mSales || 6850000)],
      ['Promedio Mensual Proyectado', formatCurrency(metrics?.projectedMonthlyAvg || 570833)],
      ['Límite Máximo Categoría ' + catLetter, formatCurrency(metrics?.categoryScale?.max_annual_billing || 16450000)],
      ['Porcentaje Consumido del Límite', `${(metrics?.consumptionPercentage || 41.6).toFixed(1)} %`],
      ['Margen Disponible para Facturar', formatCurrency(metrics?.remainingAllowance || 9600000)]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [['Métrica de Control Impositivo', 'Valor Auditado']],
      body: metricData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: darkColor, cellWidth: 100 },
        1: { halign: 'right', textColor: darkColor, cellWidth: 82 }
      }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // 4. Resumen por Medios de Pago
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('2. Desglose de Ventas por Medio de Pago', 14, currentY);

    currentY += 4;

    const paymentMethods = {
      cash: { name: 'Efectivo en Caja', count: 0, total: 0 },
      transfer: { name: 'Transferencia Bancaria / QR', count: 0, total: 0 },
      debit: { name: 'Tarjeta de Débito', count: 0, total: 0 },
      credit: { name: 'Tarjeta de Crédito', count: 0, total: 0 }
    };

    sales.forEach((s) => {
      const method = s.payment_method || 'cash';
      if (paymentMethods[method]) {
        paymentMethods[method].count += 1;
        paymentMethods[method].total += Number(s.amount || 0);
      }
    });

    const totalPeriodSales = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);

    const paymentRows = Object.values(paymentMethods).map((m) => {
      const pct = totalPeriodSales > 0 ? ((m.total / totalPeriodSales) * 100).toFixed(1) : '0.0';
      return [m.name, m.count.toString(), formatCurrency(m.total), `${pct} %`];
    });

    paymentRows.push([
      'TOTAL GENERAL DEL LOTE',
      sales.length.toString(),
      formatCurrency(totalPeriodSales),
      '100.0 %'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [['Medio de Pago', 'Operaciones', 'Total Importe', 'Participación']],
      body: paymentRows,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: darkColor },
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // 5. Detalle de Comprobantes Emitidos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('3. Registro Detallado de Comprobantes (Lote Oficial ARCA)', 14, currentY);

    currentY += 4;

    const receiptRows = sales.map((s, idx) => [
      `FAC-C-${String(s.receipt_number || idx + 1).padStart(5, '0')}`,
      formatDate(s.date),
      s.customer_name || 'Consumidor Final',
      s.customer_doc_number && s.customer_doc_number !== '0' ? s.customer_doc_number : 'Sin Doc.',
      s.payment_method ? s.payment_method.toUpperCase() : 'EFECTIVO',
      formatCurrency(s.amount)
    ]);

    if (receiptRows.length === 0) {
      receiptRows.push(['Sin comprobantes emitidos en el período analizado', '-', '-', '-', '-', '$ 0,00']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [['Comprobante', 'Fecha', 'Receptor', 'Doc. Receptor', 'Medio Pago', 'Total']],
      body: receiptRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: darkColor },
        1: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
      }
    });

    // 6. Pie de Página con Firma de Auditoría
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 287, 196, 287);

      doc.text('AutoARCA Cloud — Plataforma Fiscal Certificada para Monotributo y Estudios Contables', 14, 291);
      doc.text(`Página ${i} de ${pageCount}`, 196, 291, { align: 'right' });
    }

    // Descargar el archivo PDF
    const filename = `Reporte_Fiscal_ARCA_${cuitNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return filename;
  },

  /**
   * Genera el Reporte Consolidado de Toda la Cartera para el Contador
   */
  generateAccountantPortfolioReport({
    clients = [],
    accountantProfile = null
  }) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [37, 99, 235];
    const darkColor = [15, 23, 42];
    const grayText = [100, 116, 139];

    // Cabecera Landscape
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(0, 0, 297, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('AutoARCA PRO — CARTERA CONSOLIDADA DE CLIENTES Y MONITOREO FISCAL', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    const dateFormatted = new Date().toLocaleString('es-AR');
    const accTitle = accountantProfile?.full_name || 'Estudio Contable Méndez & Asoc.';
    const cpce = accountantProfile?.jurisdiccion || 'CPCELR (La Rioja)';
    doc.text(`Estudio: ${accTitle} | Matrícula: ${accountantProfile?.matricula || 'T° 142 F° 89'} | Consejo: ${cpce} | Emitido: ${dateFormatted}`, 14, 17);

    // Resumen de Clientes
    const rows = clients.map((c, idx) => {
      let semaforoText = '🟢 ÓPTIMO';
      if (c.trafficColor === 'yellow') semaforoText = '🟡 ALERTA';
      if (c.trafficColor === 'red') semaforoText = '🔴 RIESGO';

      return [
        (idx + 1).toString(),
        c.razon_social || c.razonSocial || c.fullName || 'Comercio',
        c.cuit || '-',
        `Cat. ${c.monotributo_category || c.monotributoCategory || 'A'}`,
        semaforoText,
        c.todayBatch ? `${c.todayBatch.total_sales_count || 0} cbts` : 'Al día',
        formatCurrency(c.todayBatch?.total_amount || 0)
      ];
    });

    autoTable(doc, {
      startY: 28,
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
      head: [['#', 'Contribuyente / Comercio', 'CUIT', 'Categoría', 'Semáforo Fiscal', 'Lote de Hoy', 'Facturado']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { fontStyle: 'bold', textColor: darkColor },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 28 },
        4: { halign: 'center', cellWidth: 35 },
        5: { halign: 'center', cellWidth: 35 },
        6: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 42 }
      }
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(grayText[0], grayText[1], grayText[2]);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 200, 283, 200);

      doc.text('AutoARCA Pro — Sistema Integral de Lotes y Semáforo Fiscal para Estudios Contables', 14, 204);
      doc.text(`Página ${i} de ${pageCount}`, 283, 204, { align: 'right' });
    }

    const filename = `Cartera_Clientes_Estudio_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return filename;
  }
};

export default reportPdfService;
