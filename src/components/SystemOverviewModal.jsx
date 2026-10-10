import React, { useState } from 'react';
import { Modal } from './untitled-ui/Modal.jsx';
import { Button } from './untitled-ui/Button.jsx';
import { Badge } from './untitled-ui/Badge.jsx';
import { soundService } from '../services/soundService.js';
import {
  StoreIcon,
  UsersIcon,
  CrownIcon,
  ReceiptTaxIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  TableIcon,
  DownloadIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  ClockIcon,
  CloudSyncIcon,
  SlidersIcon,
  LinkIcon,
  BoltIcon
} from './Icons.jsx';
import '../styles/systemOverviewModal.css';

export default function SystemOverviewModal({
  isOpen,
  onClose,
  currentRole = 'client',
  currentUser = null
}) {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  // Sincronizar si cambia el prop
  React.useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    }
  }, [currentRole]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guía Integral de AutoARCA PRO — ¿Cómo Funciona el Sistema?"
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
            Ecosistema de Facturación & Monitoreo Fiscal adaptado a las Leyes Argentinas (ARCA / AFIP).
          </div>
          <Button variant="primary" onClick={onClose}>
            Entendido, Continuar
          </Button>
        </div>
      }
    >
      <div className="system-overview-container">
        {/* Barra de Selección de Rol */}
        <div className="overview-roles-bar">
          <button
            type="button"
            className={`overview-role-btn role-client ${selectedRole === 'client' ? 'active' : ''}`}
            onClick={() => {
              soundService.playKeyTap();
              setSelectedRole('client');
            }}
          >
            <StoreIcon size={16} />
            <span>Comercio / Monotributista</span>
            {currentRole === 'client' && <span className="overview-active-tag">Tu Rol</span>}
          </button>

          <button
            type="button"
            className={`overview-role-btn role-accountant ${selectedRole === 'accountant' ? 'active' : ''}`}
            onClick={() => {
              soundService.playKeyTap();
              setSelectedRole('accountant');
            }}
          >
            <UsersIcon size={16} />
            <span>Estudio Contable / Contador</span>
            {currentRole === 'accountant' && <span className="overview-active-tag">Tu Rol</span>}
          </button>

          <button
            type="button"
            className={`overview-role-btn role-superadmin ${selectedRole === 'superadmin' ? 'active' : ''}`}
            onClick={() => {
              soundService.playKeyTap();
              setSelectedRole('superadmin');
            }}
          >
            <CrownIcon size={16} />
            <span>Super Administrador SaaS</span>
            {currentRole === 'superadmin' && <span className="overview-active-tag">Tu Rol</span>}
          </button>
        </div>

        {/* =========================================================================
            VISTA 1: COMERCIO / MONOTRIBUTISTA
           ========================================================================= */}
        {selectedRole === 'client' && (
          <>
            <div className="overview-hero-card">
              <div className="overview-hero-content">
                <h3>
                  <StoreIcon size={20} className="text-success" />
                  Módulos para Comercios y Profesionales Monotributistas
                </h3>
                <p>
                  Diseñado para que factures en mostrador en segundos, cuides tu categoría de Monotributo en tiempo real y automatices el envío de información fiscal a tu contador sin planillas ni fotos de comprobantes.
                </p>
              </div>
              <div className="overview-hero-badge badge-client">
                <span>Modo Contribuyente</span>
              </div>
            </div>

            {/* Ciclo de Operación Diario */}
            <div>
              <div className="overview-section-title">
                <h4>1. ¿Cómo Funciona en el Día a Día? — El Ciclo del Comercio</h4>
                <span className="overview-section-sub">4 pasos simples desde que abrís hasta que cerrás tu caja</span>
              </div>
              <div className="overview-steps-flow">
                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">1</span>
                    <div className="overview-step-icon"><ReceiptTaxIcon size={16} /></div>
                  </div>
                  <h5>Emisión Ágil en POS</h5>
                  <p>Facturás en mostrador en menos de 5 segundos. Consumidor Final sin identificar hasta $10.000.000 (RG 5700) o con DNI/CUIT.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">2</span>
                    <div className="overview-step-icon"><ShieldCheckIcon size={16} /></div>
                  </div>
                  <h5>Semáforo en Vivo</h5>
                  <p>La barra inteligente calcula tus últimos 12 meses móviles y te indica tu presupuesto diario seguro para no saltar de categoría.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">3</span>
                    <div className="overview-step-icon"><ClockIcon size={16} /></div>
                  </div>
                  <h5>Cierre Diario Consolidado</h5>
                  <p>Al finalizar la jornada hacés un clic en "Cerrar Jornada" (o el cron nocturno lo hace por vos) generando el lote oficial para ARCA.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">4</span>
                    <div className="overview-step-icon"><UsersIcon size={16} /></div>
                  </div>
                  <h5>Sincronizado con tu Contador</h5>
                  <p>Tu contador matriculado ve tus comprobantes y lotes en su portal profesional al instante, sin que tengas que mandarle nada.</p>
                </div>
              </div>
            </div>

            {/* Catálogo de Módulos */}
            <div>
              <div className="overview-section-title">
                <h4>2. Módulos & Herramientas Disponibles para tu Comercio</h4>
                <span className="overview-section-sub">Todo lo que podés hacer desde tu panel</span>
              </div>
              <div className="overview-modules-grid">
                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><ReceiptTaxIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Terminal Punto de Venta (POS)</h5>
                      <span className="overview-module-badge">Operativo Diario</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Emite Facturas C oficiales con CAE y código QR normativo (RG 4892). Atajos de teclado rápidos, desglose de vuelto y soporte de efectivo, tarjeta y transferencias.
                  </p>
                  <div className="overview-module-legal">
                    <BoltIcon size={13} /> Facturación electrónica ultra-rápida
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><ShieldCheckIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Semáforo Fiscal & Consumo</h5>
                      <span className="overview-module-badge">Prevención ARCA</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Barra de progreso fintech con aguja porcentual, aguja fantasma de proyección a fin de mes y sugerencia de facturación diaria permitida para blindarte.
                  </p>
                  <div className="overview-module-legal">
                    <ShieldCheckIcon size={13} /> Escalas vigentes Ley 27.743
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><AlertTriangleIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Simulador de Recategorización</h5>
                      <span className="overview-module-badge">Herramienta Predictiva</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Calculá antes de emitir una factura grande cómo afectará tu categoría, cuánto subirá tu cuota fija mensual y qué margen te queda.
                  </p>
                  <div className="overview-module-legal">
                    <BoltIcon size={13} /> Diagnóstico algorítmico inmediato
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><CreditCardIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Cruce Bancario & Billeteras</h5>
                      <span className="overview-module-badge">Alerta de Exclusión</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Monitorea acreditaciones brutas en cuentas bancarias y Mercado Pago vs facturas emitidas, detectando brechas no facturadas riesgosas ante ARCA.
                  </p>
                  <div className="overview-module-legal">
                    <AlertTriangleIcon size={13} /> Art. 20 inc. f y g Ley 24.977
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><FileTextIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Buzón DFE (E-Ventanilla)</h5>
                      <span className="overview-module-badge">Comunicaciones Oficiales</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Bandeja de notificaciones e intimaciones con cuenta regresiva de 15 días hábiles legales y asistente de redacción de descargos formales.
                  </p>
                  <div className="overview-module-legal">
                    <ClockIcon size={13} /> RG ARCA 4280 Domicilio Fiscal
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><CreditCardIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Monitor de Cuota VEP con QR</h5>
                      <span className="overview-module-badge">Pagos Mensuales</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Desglose de impuesto integrado, aportes jubilatorios y obra social. Vencimiento del día 20, cálculo de mora y QR para pagar con billeteras virtuales.
                  </p>
                  <div className="overview-module-legal">
                    <CreditCardIcon size={13} /> QR Interoperable BNA / Mercado Pago
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><ShoppingCartIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Control de Compras e Insumos</h5>
                      <span className="overview-module-badge">Topes de Gastos</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Verifica que tus compras no excedan el 80% (bienes) o 40% (servicios) del tope máximo de la Categoría K, evitando exclusión forzosa.
                  </p>
                  <div className="overview-module-legal">
                    <AlertTriangleIcon size={13} /> Art. 20 inc. c Ley 24.977
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><CloudSyncIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Abonos y Facturas Recurrentes</h5>
                      <span className="overview-module-badge">Automatización</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Carga clientes fijos mensuales y emite todas las facturas del período juntas en un solo clic, sin tipear una por una cada mes.
                  </p>
                  <div className="overview-module-legal">
                    <BoltIcon size={13} /> Facturación en lote programada
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><ShieldCheckIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Constancia ARCA & F. 152</h5>
                      <span className="overview-module-badge">Documento Oficial</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Visualiza y descarga tu Constancia de Inscripción y Credencial de Pago (Formulario 152) con QR oficial y validez de 180 días.
                  </p>
                  <div className="overview-module-legal">
                    <FileTextIcon size={13} /> RG 1817 / Formulario 152 oficial
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            VISTA 2: ESTUDIO CONTABLE / CONTADOR PÚBLICO
           ========================================================================= */}
        {selectedRole === 'accountant' && (
          <>
            <div className="overview-hero-card">
              <div className="overview-hero-content">
                <h3>
                  <UsersIcon size={20} className="text-primary" />
                  Módulos del Portal Profesional Contable
                </h3>
                <p>
                  Herramientas diseñadas para estudios contables en Argentina: supervisá decenas de CUITs en simultáneo, auditá riesgos antes de que ARCA intime y exportá a tus sistemas contables de escritorio sin tipeo manual.
                </p>
              </div>
              <div className="overview-hero-badge badge-accountant">
                <span>Modo Contador Matriculado</span>
              </div>
            </div>

            {/* Ciclo del Estudio Contable */}
            <div>
              <div className="overview-section-title">
                <h4>1. ¿Cómo Funciona la Gestión del Estudio? — Flujo Operativo</h4>
                <span className="overview-section-sub">Desde la vinculación del cliente hasta la liquidación y cobro</span>
              </div>
              <div className="overview-steps-flow">
                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">1</span>
                    <div className="overview-step-icon"><LinkIcon size={16} /></div>
                  </div>
                  <h5>Vinculación por Código o CUIT</h5>
                  <p>Compartes tu código único de vinculación (ej. CONT-MENDEZ-9876) y el comercio se enlaza automáticamente a tu panel.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">2</span>
                    <div className="overview-step-icon"><ShieldCheckIcon size={16} /></div>
                  </div>
                  <h5>Monitoreo Global de Semáforos</h5>
                  <p>Ves el semáforo consolidado de toda tu cartera. Detectás quién está al borde de recategorizarse o en zona de riesgo.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">3</span>
                    <div className="overview-step-icon"><DownloadIcon size={16} /></div>
                  </div>
                  <h5>Descarga Masiva en ZIP</h5>
                  <p>Descargás en 1 clic los lotes CSV del día de todos tus clientes listos para importar al portal web de ARCA.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">4</span>
                    <div className="overview-step-icon"><TableIcon size={16} /></div>
                  </div>
                  <h5>Recategorización & Exportación</h5>
                  <p>Auditas semestres masivos (Ley 27.743), emites certificaciones FACPCE Res. 37 y exportas a Tango o Holistor.</p>
                </div>
              </div>
            </div>

            {/* Catálogo de Módulos del Contador */}
            <div>
              <div className="overview-section-title">
                <h4>2. Módulos & Herramientas Especializadas para tu Estudio</h4>
                <span className="overview-section-sub">Disponibles en las pestañas del panel contable</span>
              </div>
              <div className="overview-modules-grid">
                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><UsersIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Cartera & Lotes Diarios</h5>
                      <span className="overview-module-badge">Pestaña Principal</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Listado integral de clientes en vista tabla o tarjetas con buscador reactivo por CUIT, estado de cierre del día, informes en PDF y descarga masiva en ZIP.
                  </p>
                  <div className="overview-module-legal">
                    <DownloadIcon size={13} /> Generación automática de lotes ARCA
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><ReceiptTaxIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Matriz de Recategorización Semestral</h5>
                      <span className="overview-module-badge">Enero / Julio</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Auditoría masiva de toda la cartera según facturación de 12 meses móviles vs topes oficiales. Calcula diferencias de cuota y genera avisos en WhatsApp en 1 clic.
                  </p>
                  <div className="overview-module-legal">
                    <ShieldCheckIcon size={13} /> Ley 27.743 & Actualización IPC
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><FileTextIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Central Unificada DFE E-Ventanilla</h5>
                      <span className="overview-module-badge">Buzón Multi-Cliente</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Consolida todas las comunicaciones oficiales de ARCA con plazos de 15 días hábiles y redactor de escritos formales para Presentaciones Digitales.
                  </p>
                  <div className="overview-module-legal">
                    <ClockIcon size={13} /> RG ARCA 4280 / Art. 100 Ley 11.683
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><AlertTriangleIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Riesgo & Brecha Bancaria</h5>
                      <span className="overview-module-badge">Control de Exclusión</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Cruce de depósitos brutos y billeteras virtuales contra facturación emitida. Detecta brechas no facturadas y clientes en riesgo de exclusión de oficio.
                  </p>
                  <div className="overview-module-legal">
                    <AlertTriangleIcon size={13} /> Art. 20 inc. f y g Ley 24.977
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><TableIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Calendario CUIT & Vencimientos</h5>
                      <span className="overview-module-badge">Organización Operativa</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Agrupa clientes por terminación de CUIT para Ingresos Brutos (CM03 / Locales) y Monotributo (día 20). Checklist por cliente: Lote/DDJJ, VEP Enviado, Liquidado.
                  </p>
                  <div className="overview-module-legal">
                    <TableIcon size={13} /> Cronograma COMARB & ARCA
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><FileSpreadsheetIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Certificaciones de Ingresos FACPCE</h5>
                      <span className="overview-module-badge">Res. Técnica N° 37</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Emisión instantánea de la certificación contable sobre manifestación de ingresos de los últimos 12 meses con membrete y matrícula profesional para bancos.
                  </p>
                  <div className="overview-module-legal">
                    <ShieldCheckIcon size={13} /> Consejo Profesional CPCE / FACPCE
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><DownloadIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Exportador Multi-Software</h5>
                      <span className="overview-module-badge">Interoperabilidad</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Exporta comprobantes a Tango Gestión (.txt), Holistor / Sistemas Bejerman (.txt), Excel Universal con UTF-8 BOM (.csv) y formato nativo ARCA.
                  </p>
                  <div className="overview-module-legal">
                    <FileSpreadsheetIcon size={13} /> Compatible con sistemas tradicionales
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><CreditCardIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Honorarios del Estudio Contable</h5>
                      <span className="overview-module-badge">Gestión Financiera</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Control de honorarios mensuales facturables, cobrados y pendientes por cliente. Genera mensajes de cobro listos para WhatsApp con CBU/Alias bancario.
                  </p>
                  <div className="overview-module-legal">
                    <CreditCardIcon size={13} /> Seguimiento de cobranzas y recaudación
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            VISTA 3: SUPER ADMINISTRADOR SAAS
           ========================================================================= */}
        {selectedRole === 'superadmin' && (
          <>
            <div className="overview-hero-card">
              <div className="overview-hero-content">
                <h3>
                  <CrownIcon size={20} className="text-warning" />
                  Módulos de Gobernanza & Super Administrador
                </h3>
                <p>
                  Panel de control de alto nivel para gestionar la infraestructura, auditar el volumen procesado del SaaS, regular las escalas impositivas oficiales y administrar el estado de suscripción de estudios y comercios.
                </p>
              </div>
              <div className="overview-hero-badge badge-superadmin">
                <span>Modo SuperAdmin</span>
              </div>
            </div>

            {/* Ciclo del SuperAdmin */}
            <div>
              <div className="overview-section-title">
                <h4>1. ¿Cómo Funciona la Gobernanza del SaaS? — Flujo de Control</h4>
                <span className="overview-section-sub">Supervisión integral de usuarios, finanzas y normativas</span>
              </div>
              <div className="overview-steps-flow">
                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">1</span>
                    <div className="overview-step-icon"><CrownIcon size={16} /></div>
                  </div>
                  <h5>Métricas del Negocio</h5>
                  <p>Visualización en tiempo real de ingresos recurrentes (MRR), comercios activos, contadores vinculados y churn rate.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">2</span>
                    <div className="overview-step-icon"><SlidersIcon size={16} /></div>
                  </div>
                  <h5>Escalas ARCA Centralizadas</h5>
                  <p>Cuando el gobierno modifica topes de Monotributo, los actualizas aquí y se propagan inmediatamente a todos los usuarios.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">3</span>
                    <div className="overview-step-icon"><UsersIcon size={16} /></div>
                  </div>
                  <h5>Gestión de Suscripciones</h5>
                  <p>Activa o suspende comercios por mora con un clic, bloqueando la emisión hasta la regularización del abono.</p>
                </div>

                <div className="overview-step-card">
                  <div className="overview-step-header">
                    <span className="overview-step-number">4</span>
                    <div className="overview-step-icon"><CloudSyncIcon size={16} /></div>
                  </div>
                  <h5>Infraestructura & Cron Jobs</h5>
                  <p>Auditoría del estado de conexión de Supabase, tablas RLS y ejecución diaria del cron nocturno de cierre de ventas.</p>
                </div>
              </div>
            </div>

            {/* Catálogo de Módulos del SuperAdmin */}
            <div>
              <div className="overview-section-title">
                <h4>2. Módulos & Herramientas de Administración</h4>
                <span className="overview-section-sub">Control total del ecosistema AutoARCA</span>
              </div>
              <div className="overview-modules-grid">
                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><CrownIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Métricas Globales SaaS (MRR)</h5>
                      <span className="overview-module-badge">Business Intelligence</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Indicadores de salud financiera del software: ingresos recurrentes mensuales, suscripciones activas, tasa de retención y volumen de ventas emitidas.
                  </p>
                  <div className="overview-module-legal">
                    <BoltIcon size={13} /> Analítica financiera consolidada
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><SlidersIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Editor de Escalas ARCA</h5>
                      <span className="overview-module-badge">Parámetros Tributarios</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Configuración en caliente de las categorías A a K: topes de facturación anual permitida y cuota mensual en pesos para cálculos en tiempo real.
                  </p>
                  <div className="overview-module-legal">
                    <ShieldCheckIcon size={13} /> Sincronización instantánea en vivo
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><UsersIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Usuarios & Control de Suscripciones</h5>
                      <span className="overview-module-badge">Control de Acceso</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Administración de cuentas de comercios, contadores y administradores. Botón directo para conmutar estado de suscripción (Activo / Suspendido).
                  </p>
                  <div className="overview-module-legal">
                    <ShieldCheckIcon size={13} /> Políticas RLS y seguridad de datos
                  </div>
                </div>

                <div className="overview-module-card">
                  <div className="overview-module-top">
                    <div className="overview-module-icon-wrap"><CloudSyncIcon size={18} /></div>
                    <div className="overview-module-meta">
                      <h5>Diagnóstico Supabase & Base de Datos</h5>
                      <span className="overview-module-badge">Infraestructura Cloud</span>
                    </div>
                  </div>
                  <p className="overview-module-desc">
                    Chequeo de salud de tablas relacionales (perfiles, ventas, lotes, notificaciones), políticas de seguridad y conexión con Edge Functions de Supabase.
                  </p>
                  <div className="overview-module-legal">
                    <CloudSyncIcon size={13} /> Monitoreo de latencia y estado de nube
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
