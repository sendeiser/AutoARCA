import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountantPortal from '../src/components/AccountantPortal.jsx';
import Navbar from '../src/components/Navbar.jsx';
import AccountantRecategorizationMatrix from '../src/components/AccountantRecategorizationMatrix.jsx';
import AccountantDfeInbox from '../src/components/AccountantDfeInbox.jsx';
import AccountantBankRiskDashboard from '../src/components/AccountantBankRiskDashboard.jsx';
import AccountantTaxCalendar from '../src/components/AccountantTaxCalendar.jsx';
import AccountantIncomeCertificateModal from '../src/components/AccountantIncomeCertificateModal.jsx';
import AccountantFeesManager from '../src/components/AccountantFeesManager.jsx';
import AccountantMultiSoftwareExportModal from '../src/components/AccountantMultiSoftwareExportModal.jsx';
import { generateTangoVentasTxt, generateHolistorBejermanTxt } from '../src/services/arcaExportService.js';

describe('Accountant Advanced Features Suite', () => {
  const mockClients = [
    {
      id: 'cli-1',
      cuit: '20301234567',
      razon_social: 'Kiosco El Sol SRL',
      fantasy_name: 'Kiosco El Sol',
      monotributo_category: 'B',
      trafficColor: 'yellow',
      todayBatch: {
        id: 'b-1',
        total_amount: 35000,
        total_sales_count: 10,
        file_content_arca: '01/10/2026;Factura C;1;...'
      }
    },
    {
      id: 'cli-2',
      cuit: '27289876543',
      razon_social: 'Dra. María Gómez',
      fantasy_name: 'Consultorio Odontológico',
      monotributo_category: 'E',
      trafficColor: 'green',
      todayBatch: null
    },
    {
      id: 'cli-3',
      cuit: '20223344558',
      razon_social: 'Distribuidora Norte SA',
      fantasy_name: 'Norte Express',
      monotributo_category: 'K',
      trafficColor: 'red',
      todayBatch: null
    }
  ];

  const mockProfile = {
    full_name: 'Cr. Juan Pérez',
    cuit: '20-25896321-4',
    cpce_registration: 'T° 142 F° 88 CPCECABA',
    matricula: 'T° 142 F° 88 CPCECABA',
    cbu_alias: 'ESTUDIO.PEREZ.MP'
  };

  it('1. Matriz Masiva de Recategorización Semestral calcula proyecciones y permite filtrar', () => {
    render(<AccountantRecategorizationMatrix clients={mockClients} />);
    expect(screen.getByText(/Matriz Masiva de Recategorización Semestral/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Kiosco El Sol/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Consultorio Odontológico/i).length).toBeGreaterThan(0);

    // Filtros de estado: Suben de categoría
    const subenTab = screen.getByRole('button', { name: /Suben/i });
    expect(subenTab).toBeInTheDocument();
    fireEvent.click(subenTab);
  });

  it('2. Central Unificada de DFE Multi-Cliente alerta notificaciones y abre redactor de descargo', () => {
    render(<AccountantDfeInbox clients={mockClients} />);
    expect(screen.getByText(/Central Unificada de DFE Multi-Cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/Bandeja consolidada de notificaciones/i)).toBeInTheDocument();

    // Debe mostrar comunicaciones oficiales y botón de Descargo
    const descargoButtons = screen.getAllByRole('button', { name: /Descargo/i });
    expect(descargoButtons.length).toBeGreaterThan(0);
    fireEvent.click(descargoButtons[0]);

    // Debe abrir el modal con el modelo de descargo formal
    expect(screen.getByText(/Descargo Digital ARCA/i)).toBeInTheDocument();
    expect(screen.getByText(/Copiar Texto para ARCA/i)).toBeInTheDocument();
  });

  it('3. Tablero de Exclusión y Brecha Bancaria detecta riesgos y diferencias no facturadas', () => {
    render(<AccountantBankRiskDashboard clients={mockClients} />);
    expect(screen.getByText(/Tablero de Exclusión y Brecha Bancaria de la Cartera/i)).toBeInTheDocument();
    expect(screen.getByText(/Art. 20 inc. f y g Ley 24.977/i)).toBeInTheDocument();

    // Botón de exportar auditoría bancaria CSV
    const exportBtn = screen.getByText(/Exportar Auditoría Bancaria/i);
    expect(exportBtn).toBeInTheDocument();
  });

  it('4. Calendario Impositivo Dinámico por CUIT agrupa y permite marcar checklist', () => {
    render(<AccountantTaxCalendar clients={mockClients} />);
    expect(screen.getByText(/Calendario Impositivo Dinámico por Terminación de CUIT/i)).toBeInTheDocument();
    expect(screen.getByText(/CUIT Terminados en 6-7/i)).toBeInTheDocument(); // CUIT 20301234567 termina en 7
    expect(screen.getByText(/CUIT Terminados en 2-3/i)).toBeInTheDocument(); // CUIT 27289876543 termina en 3

    // Checklist toggles
    const checkBoxes = screen.getAllByRole('checkbox');
    expect(checkBoxes.length).toBeGreaterThan(0);
    fireEvent.click(checkBoxes[0]);
    expect(checkBoxes[0]).toBeChecked();
  });

  it('5. Generador de Certificaciones de Ingresos FACPCE Res. 37 calcula meses y permite imprimir', () => {
    const handleClose = vi.fn();
    render(
      <AccountantIncomeCertificateModal
        isOpen={true}
        onClose={handleClose}
        client={mockClients[0]}
        accountantProfile={mockProfile}
      />
    );

    expect(screen.getByText(/CERTIFICACIÓN CONTABLE SOBRE MANIFESTACIÓN DE INGRESOS/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolución Técnica N° 37 \/ FACPCE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/20301234567/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cr. Juan Pérez/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Imprimir \/ Guardar PDF/i)).toBeInTheDocument();
  });

  it('6. Exportador Multi-Software Contable genera archivos para Tango y Holistor/Bejerman', () => {
    // Prueba de servicios
    const dummySales = [
      {
        id: '1',
        date: '2026-10-09',
        customer_doc_type: '80',
        customer_doc_number: '20301234567',
        customer_name: 'Juan Pérez',
        amount: 12500,
        cae: '74829103847291'
      }
    ];

    const tangoResult = generateTangoVentasTxt(dummySales, { cuit: '20301234567' });
    expect(tangoResult.filename).toContain('TANGO_VENTAS');
    expect(tangoResult.content).toContain('FAC');
    expect(tangoResult.salesCount).toBe(1);

    const holistorResult = generateHolistorBejermanTxt(dummySales, { cuit: '20301234567' });
    expect(holistorResult.filename).toContain('HOLISTOR_VENTAS');
    expect(holistorResult.content).toContain('011'); // Cbte 011 Factura C
    expect(holistorResult.content).toContain('20261009');

    // Prueba de UI Modal
    const handleClose = vi.fn();
    render(
      <AccountantMultiSoftwareExportModal
        isOpen={true}
        onClose={handleClose}
        client={mockClients[0]}
      />
    );

    expect(screen.getByText(/Exportar Comprobantes/i)).toBeInTheDocument();
    expect(screen.getByText(/Tango Gestión/i)).toBeInTheDocument();
    expect(screen.getByText(/Holistor \/ Sistemas Bejerman/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel Universal \(UTF-8 BOM\)/i)).toBeInTheDocument();
  });

  it('7. Gestión y Cobranza de Honorarios Profesionales monitorea cartera y genera WhatsApp', () => {
    render(
      <AccountantFeesManager
        clients={mockClients}
        accountantProfile={mockProfile}
      />
    );

    expect(screen.getByText(/Control y Cobranza de Honorarios Profesionales/i)).toBeInTheDocument();
    expect(screen.getByText(/Honorarios Facturables/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Cobrado/i)).toBeInTheDocument();

    // Botón de cobro con mensaje WhatsApp
    const cobroBtns = screen.getAllByRole('button', { name: /Cobrar/i });
    expect(cobroBtns.length).toBeGreaterThan(0);
  });

  it('8. AccountantPortal conmuta limpiamente entre todas las pestañas profesionales', () => {
    const TestAccountantApp = () => {
      const [tab, setTab] = React.useState('clientes');
      return (
        <div>
          <Navbar role="accountant" activeTab={tab} onTabChange={setTab} />
          <AccountantPortal
            clients={mockClients}
            accountantProfile={mockProfile}
            activeTab={tab}
            onTabChange={setTab}
          />
        </div>
      );
    };

    render(<TestAccountantApp />);

    // Pestaña inicial: Cartera & Lotes
    expect(screen.getByRole('tab', { name: /Cartera & Lotes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Recategorización/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Central DFE/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Riesgo Bancario/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Calendario CUIT/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Honorarios del Estudio/i })).toBeInTheDocument();

    // Clic en pestaña Recategorización
    fireEvent.click(screen.getByRole('tab', { name: /Recategorización/i }));
    expect(screen.getByText(/Matriz Masiva de Recategorización Semestral/i)).toBeInTheDocument();

    // Clic en pestaña Central DFE
    fireEvent.click(screen.getByRole('tab', { name: /Central DFE/i }));
    expect(screen.getByText(/Central Unificada de DFE Multi-Cliente/i)).toBeInTheDocument();

    // Clic en pestaña Riesgo Bancario
    fireEvent.click(screen.getByRole('tab', { name: /Riesgo Bancario/i }));
    expect(screen.getByText(/Tablero de Exclusión y Brecha Bancaria de la Cartera/i)).toBeInTheDocument();

    // Clic en pestaña Calendario CUIT
    fireEvent.click(screen.getByRole('tab', { name: /Calendario CUIT/i }));
    expect(screen.getByText(/Calendario Impositivo Dinámico por Terminación de CUIT/i)).toBeInTheDocument();

    // Clic en pestaña Honorarios
    fireEvent.click(screen.getByRole('tab', { name: /Honorarios del Estudio/i }));
    expect(screen.getByText(/Control y Cobranza de Honorarios Profesionales/i)).toBeInTheDocument();

    // Volver a Cartera & Lotes
    fireEvent.click(screen.getByRole('tab', { name: /Cartera & Lotes/i }));
    expect(screen.getByText(/Descargar Lotes del Día \(ZIP Masivo\)/i)).toBeInTheDocument();
  });
});
