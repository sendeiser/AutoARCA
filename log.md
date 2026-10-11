# Registro de Operaciones de la Wiki (`log.md`)

Registro cronológico y auditable de todas las operaciones ejecutadas en la wiki (`ingest`, `query`, `lint`). Formato de cabecera: `## [YYYY-MM-DD] operación | Descripción`.

---

## [2026-10-11] lint | Restauración de Bottom Tab Bar Inferior y Ocultamiento de Barra Superior en Mobile
- **1. Reincorporación de la Barra de Navegación Inferior en Mobile (`Navbar.jsx`, `navbar.css`)**:
  - Conforme al requerimiento explícito del usuario, en pantallas móviles (`< 768px`) se restauró la barra de pestañas fija inferior estilo iOS `.navbar-mobile-bottom` con acceso táctil ergonómico para todos los roles (Comercio, Contador y SuperAdmin).
- **2. Supresión del Menú Superior en Mobile (`navbar.css`)**:
  - En `@media (max-width: 768px)`, la barra superior segmentada `.navbar-desktop-segment` se oculta por completo (`display: none !important`), dejando la cabecera limpia y otorgando máximo espacio vertical a los contenidos y tarjetas del sistema.
- **3. Padding de Resguardo en Contenido Principal**:
  - Se configuró `padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px))` para garantizar que ningún elemento o botón sea tapado por la barra flotante.
- **4. Verificación Automatizada con Playwright**:
  - Validación en viewport iPhone 14 (390x844) confirmando que la barra superior está ausente, la barra inferior está visible y funcional con cambio de pestañas interactivo, y en desktop (1280x800) se mantiene la barra segmentada superior.
- **5. Regresión de Tests Vitest**:
  - **107 de 107 tests aprobados en Vitest (100% verde)**.

## [2026-10-10] lint | Rediseño Calendario CUIT, Cards Mobile en Tablas, Aislamiento de Cabecera y Ancho 100%
- **1. Aislamiento de la Cabecera del Contador (`AccountantPortal.jsx`)**:
  - Se condicionó el bloque `.accountant-header` exclusivamente a `{activeTab === 'clientes' && (...)}`.
  - En la primera pestaña (*Cartera & Lotes*), la cabecera con el título profesional y las 3 acciones principales se mantiene intacta.
  - En las restantes pestañas (*Recategorización*, *Central DFE*, *Riesgo Bancario*, *Calendario CUIT*, *Honorarios del Estudio*), la cabecera desaparece por completo, ahorrando espacio vertical crítico y centrando el foco en cada módulo.
- **2. Supresión de Navbar Duplicada Inferior (`Navbar.jsx`, `navbar.css`)**:
  - Se eliminó la barra inferior redundante `.navbar-mobile-bottom` conforme a la solicitud del usuario.
  - La navegación móvil queda unificada en el control superior horizontal con scroll táctil suave y pills estilizadas, liberando los 68px inferiores de la pantalla.
- **3. Transformación de Tablas a Cards en Modo Móvil (`<= 640px`)**:
  - **Matriz de Recategorización Semestral (`accountantRecatMatrix.css`)**: Las filas de la tabla se transforman en tarjetas individuales con cabecera de cliente, pares clave-valor (CUIT, Categoría actual, proyectada, facturación) y botón de aviso de WhatsApp en ancho completo.
  - **Central DFE y Buzón DFE (`accountantDfeInbox.css`, `dfeNotificationCenter.css`)**: Transformación a cards con badge de prioridad/organismo, extracto del requerimiento y botón de "Descargo" táctil.
  - **Honorarios del Estudio (`accountantFees.css`)**: Transformación a cards con badge de categoría, importe mensual, estado de pago y botón directo "Cobrar".
  - **Abonos Mensuales (`recurringBilling.css`)**: Tarjetas de abonos con control de alternancia Activo/Pausado y opciones de edición.
  - **Cartera Principal (`accountantPortal.css`)**: Reemplazo de tabla en móvil por tarjetas con grilla 2x2 de acciones rápidas (*PDF Fiscal*, *Excel*, *Constancia*, *Certificación*).
- **4. Rediseño Integral de Calendario CUIT / CUIL (`AccountantTaxCalendar.jsx`, `accountantTaxCalendar.css`)**:
  - Eliminación de la estructura engorrosa de 5 columnas fijas.
  - Implementación de un cronograma en línea de tiempo estructurada con selector de grupo de terminación (*Todos*, *0-1 · Vto 15*, *2-3 · Vto 16*, *4-5 · Vto 17*, *6-7 · Vto 18*, *8-9 · Vto 19*).
  - Incorporación de barra de progreso interactiva de cumplimiento mensual de la cartera y tarjetas individuales con checklists táctiles de tareas (*Lote/DDJJ*, *VEP Enviado*, *Liquidado*).
- **5. Aprovechamiento del 100% de Espacio Horizontal Móvil (`responsive.css`)**:
  - Se ajustaron los contenedores principales (`.client-dashboard-wrap`, `.accountant-portal-container`, `.admin-container`) a `width: 100% !important; max-width: 100% !important; margin: 0 !important;` con padding lateral ajustado de `0.35rem`, aprovechando todo el ancho de los teléfonos sin márgenes desperdiciados.
- **6. Verificación Automatizada con Playwright y Suite Vitest**:
  - Capturas multi-viewport en iPhone 14 (390x844) y escritorio (1280x800).
  - **107 de 107 tests aprobados en Vitest (100% verde, 21 archivos de prueba)**.

## [2026-10-10] lint | Eliminación de Barra de Navegación Duplicada en Portal del Contador
- **1. Supresión del Subnav Inferior en `AccountantPortal.jsx`**:
  - Se eliminó el bloque redundante `<div className="accountant-subnav-bar">` que duplicaba las 6 pestañas debajo de la botonera principal (`Cartera & Lotes`, `Recategorización`, `Central DFE`, `Riesgo Bancario`, `Calendario CUIT`, `Honorarios del Estudio`).
  - La navegación queda 100% centralizada en la barra segmentada superior de `<Navbar>`, mejorando drásticamente el espacio vertical, la jerarquía visual y la ergonomía tanto en escritorio como en dispositivos móviles.
- **2. Verificación Visual y Tests**:
  - Captura y validación con Playwright en resolución de escritorio (1280x800) confirmando diseño limpio y sin duplicaciones.
  - **107 de 107 tests aprobados en Vitest (100% verde)**.

- **1. Cruce Bancario (`bankCrossingMonitor.css`)**:
  - Chips de simulación rápida (`+$250k`, `+$500k`, etc.) transformados de botones diminutos de 26px en una cuadrícula táctil 2x2 con `min-height: 44px`, bordes redondeados y micro-interacción de pulsación (`transform: scale(0.97)`).
  - Inputs con `min-height: 44px` y `font-size: 16px !important` para erradicar el salto de zoom automático en iOS Safari.
  - Botón de reajuste en ancho completo (`100%`) con `min-height: 42px`.
  - Reestructuración de KPIs a grilla de 2 columnas con la tercera métrica ocupando el ancho completo.
- **2. Buzón DFE (`dfeNotificationCenter.css`)**:
  - Botón de acción por fila ("Descargo") elevado de 35px a `min-height: 42px`, `padding: 0.5rem 0.85rem` y radio adaptativo.
  - Textarea y selectores del asistente de descargo configurados a `font-size: 16px !important` para prevenir zoom en iPhone.
- **3. Abonos Mensuales (`recurringBilling.css`, `RecurringBillingManager.jsx`)**:
  - Botones de cabecera ("Nuevo Abono" y "Emitir Lote") encapsulados en `.recurring-header-actions`, apilados en ancho completo con `min-height: 44px`.
  - Chip conmutador de estado ("Activo" / "Pausado") ampliado de 23px a `min-height: 38px; min-width: 72px; padding: 0.4rem 0.85rem;` con respuesta táctil elástica.
  - Botón de eliminación en tabla ajustado a `min-height: 42px; min-width: 42px;`.
- **4. Matriz de Recategorización Semestral (`accountantRecatMatrix.css`)**:
  - Pestañas de filtro de categoría (*Todos*, *Cambian*, *Suben*, *Bajan*) aumentadas de 29px a `min-height: 40px`, con padding `0.5rem 0.85rem` y scroll táctil suave.
  - Botón de cabecera "Exportar Matriz a Excel (CSV)" optimizado a `min-height: 44px; width: 100%`.
  - Botones de fila "Avisar" elevados a `min-height: 42px`.
- **5. Central DFE Multi-Cliente (`accountantDfeInbox.css`)**:
  - Pestañas de filtro (*Todas*, *Pendientes*, *Urgentes*) elevadas de 30px a `min-height: 40px` con soporte táctil ergonómico.
  - Botones de acción "Descargo" en tabla ampliados a `min-height: 42px`.
  - Textarea de respuesta a ARCA configurada a `font-size: 16px !important`.
- **6. Calendario CUIT (`accountantTaxCalendar.css`)**:
  - Checkboxes nativos de 13x13px transformados en componentes táctiles interactivos `.cal-check-item`: `min-height: 42px; padding: 0.35rem 0.4rem;` con input estilizado de 18x18px y feedback visual `:active`.
  - Distribución en cuadrícula simétrica de 3 columnas para tareas (*Lote/DDJJ*, *VEP Enviado*, *Liquidado*).
- **7. Honorarios del Estudio (`accountantFees.css`)**:
  - Chip de estado de pago (*✓ Cobrado*, *Pendiente*, *Atrasado*) ampliado de 24px a `min-height: 38px; min-width: 84px;` con feedback al tap.
  - Botón de WhatsApp "Cobrar" elevado a `min-height: 42px; min-width: 80px`.
  - KPIs financieros reorganizados en grilla 2x2 donde el 3er indicador ("Pendiente de Cobro") toma el ancho completo de forma balanceada.
- **8. Auditoría Automatizada con Playwright (`scripts/auditTarget7Modules.js`)**:
  - Evaluado en **iPhone 14 (390x844)** y **Compact Android (360x780)**.
  - **0 objetivos táctiles pequeños (<36px)** detectados en los 7 módulos (100% ergonómicos según Apple HIG / Material 3).
  - **Desborde horizontal: NO (0px overflow en todos los viewports)**.
- **9. Suite de Regresión Vitest**:
  - **21 de 21 archivos y 107 de 107 tests aprobados (100% verde)**.

- **1. Componentes de Tablas de Datos (`untitled-ui.css`, `Table.jsx`)**:
  - Implementación completa de estilos para `.uui-table-container`, `.uui-table-toolbar`, `.uui-table-scroll`, `.uui-table`, `.uui-tr`, `.uui-th` y `.uui-td`.
  - Contenedor con desplazamiento horizontal táctil nativo (`overflow-x: auto; -webkit-overflow-scrolling: touch;`), padding adaptativo y soporte bidireccional de tema oscuro y claro.
- **2. Terminal POS Móvil (`posTerminal.css`)**:
  - Sustituido `overflow: hidden;` rígido por `overflow-y: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;` y `min-height: calc(100dvh - 104px);`.
  - Garantiza que en pantallas con poca altura o con teclado virtual táctil abierto no se corten los botones de emisión ni el teclado numérico.
- **3. Módulos Profesionales del Contador**:
  - **Matriz de Recategorización Semestral (`accountantRecatMatrix.css`)**:
    - En `< 640px`: KPIs en cuadrícula simétrica 2x2, barra de filtros con scroll horizontal (`Todos`, `Cambian`, `Suben`, `Bajan`), botón de exportación en ancho completo.
  - **Central DFE Multi-Cliente (`accountantDfeInbox.css`)**:
    - Cabecera en columna con pestañas de filtro en ancho completo (`100%`) y scroll horizontal táctil.
  - **Riesgo & Brecha Bancaria (`accountantBankRisk.css`)**:
    - Métricas de brecha reorganizadas en grilla 2x2, selector de filtros sin desborde y tabla con desplazamiento horizontal fluido.
  - **Calendario CUIT (`accountantTaxCalendar.css`)**:
    - Tarjetas de grupos CUIT (0-1, 2-3...) en columna única móvil, pills de progreso alineados a la izquierda y tareas checklist compactas.
  - **Honorarios del Estudio (`accountantFees.css`)**:
    - KPIs financieros en grilla 2x2, cabecera responsiva y lista de honorarios con botones táctiles ergonómicos.
  - **Cartera & Lotes (`accountantPortal.css`)**:
    - Grilla de KPIs en 2 columnas compactas en `< 540px` (evitando apilar 4 bloques gigantes), chips de filtro con scroll horizontal táctil suave y barra de herramientas apilada.
- **4. Modales y Documentos Oficiales en Móvil**:
  - **Constancia de Inscripción ARCA (`officialConstancia.css`)**:
    - Cabecera en columna, código de barras redimensionado para viewports reducidos y márgenes optimizados para impresión/PDF.
  - **Certificación de Ingresos FACPCE Res. 37 (`accountantIncomeCert.css`)**:
    - Relleno optimizado (`padding: 0.85rem` en móvil vs `2rem` en desktop), firma centrada y tabla de 12 meses fluida.
  - **Modal de Vinculación (`accountantLinkModal.css`)**:
    - Pestañas con desplazamiento horizontal en `< 480px` y ancho contenido a `calc(100vw - 1rem)`.
- **5. Verificación Rigurosa con Playwright y Vitest**:
  - Validación móvil profunda en todos los 12 módulos y modales (`scripts/deepAuditAllModulesMobile.js`).
  - Suite de pruebas de regresión: **21 de 21 archivos y 107 de 107 tests aprobados (100% verde)**.

## [2026-10-10] lint | Adaptación y Corrección de Navbar Móvil y Módulos de Cliente y Contador con Playwright
- **1. Corrección y Expansión Integral de la Barra de Navegación Móvil (`Navbar.jsx`, `navbar.css`)**:
  - **Pestañas Móviles del Contador**: Agregadas las 6 pestañas operativas (`Cartera`, `Recat`, `DFE`, `Riesgo`, `Calendario`, `Honorarios`) que previamente devolvían un array vacío y dejaban al contador sin barra de navegación en teléfonos móviles.
  - **Pestañas Móviles del Cliente**: Ampliada la navegación inferior para abarcar no solo POS y Fiscal, sino todos los módulos esenciales: `POS`, `Fiscal`, `Bancos`, `Compras`, `DFE` y `Abonos`.
  - **Desplazamiento Táctil Horizontal Fluido**: Añadido `overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;` con ancho flexible `min-width: 52px; max-width: 76px;` en `.navbar-bottom-tab`, permitiendo navegar fácilmente deslizando con el dedo.
  - **Compatibilidad con Modo Claro**: Reglas específicas para variables y fondo de la barra flotante móvil en tema `light` (`rgba(255, 255, 255, 0.95)`).
- **2. Conexión de Estado Bidireccional en `App.jsx`, `ClientDashboard.jsx` y `AccountantPortal.jsx`**:
  - Incorporado estado `accountantTab` en `App.jsx` sincronizado con `Navbar` y `AccountantPortal`.
  - Implementado patrón controlado/no-controlado (`activeSubtab`/`onSubtabChange` en `ClientDashboard` y `activeTab`/`onTabChange` en `AccountantPortal`) de modo que tocar un icono en la barra inferior móvil o hacer clic en la barra interna conmuta sincronizadamente ambas barras y muestra el módulo de inmediato.
- **3. Resolución del Desborde Horizontal y Botones en Móvil (`clientDashboard.css`, `responsive.css`)**:
  - **Causa Raíz Diagnosticada**: `ClientDashboard.jsx` contenía `style={{ maxWidth: '960px' }}` en un contenedor flex (`.app-main-content`), lo que hacía que el contenedor se expandiera a 960px de ancho en pantallas de 360px y 390px. Esto provocaba que los botones de acción se estiraran a 920px y su texto quedara centrado en `x = 436px` fuera de la pantalla.
  - **Solución Aplicada**: Se eliminó el estilo inline de `ClientDashboard.jsx` y se implementó `.client-dashboard-wrap` en `clientDashboard.css` y `responsive.css` con `width: 100%; max-width: 960px; box-sizing: border-box;`.
  - **Cuadrícula Ergonómica 2 Columnas**: En pantallas `<= 640px`, `.dashboard-header-actions` se rediseñó en una grilla de 2 columnas donde los 4 botones secundarios (`Pagar Cuota VEP`, `Constancia ARCA`, `Libro de Ventas Excel`, `Reporte PDF`) se distribuyen perfectamente en pares simétricos, y el botón principal (`Terminal POS`) toma todo el ancho inferior (`grid-column: 1 / -1`).
- **4. Ajustes Responsivos en Submódulos**:
  - `bankCrossingMonitor.css`: Agregada consulta `@media (max-width: 640px)` para KPIs y controles en una sola columna con padding compacto.
  - `expensePurchaseLimitMonitor.css`: Agregada consulta `@media (max-width: 640px)` para toggle de actividad en ancho completo y grilla de KPIs fluida.
  - `dfeNotificationCenter.css` y `recurringBilling.css`: Cabeceras adaptativas en columna para evitar solapamiento de badges y acciones en pantallas pequeñas.
- **5. Verificación Rigurosa con Playwright (`scripts/verifyMobileAudit.js`)**:
  - Ejecutada auditoría en dos resoluciones móviles reales: **iPhone 14 (390x844)** y **Android Compact (360x780)**.
  - Comprobadas las 6 pestañas del cliente y las 6 pestañas del contador:
    - **scrollWidth = clientWidth** en cada pantalla (`scrollX = 0`, sin desborde horizontal).
    - Botones de acción fiscal situados dentro del marco visible (x=21 a 346px).
    - Transición instantánea entre módulos sin saltos visuales ni recargas.
- **6. Suite de Pruebas Unitarias**:
  - **107 de 107 tests aprobados en 21 archivos de prueba (100% verde)**.

## [2026-10-10] lint | Auditoría y Corrección de Diseño Responsive Mobile y Multi-Pantalla con Playwright
- **1. Suite de Auditoría Automatizada con Playwright (`scripts/responsiveDeepAudit.js`)**:
  - Evaluación y diagnóstico en 4 tipos de pantalla estandarizados:
    - **Mobile Compact (360x780)**: Pantallas pequeñas de teléfonos Android comunes.
    - **Mobile iPhone (390x844)**: Pantallas modernas iOS.
    - **Tablet iPad (768x1024)**: Pantallas medianas en orientación vertical y horizontal.
    - **Desktop Laptop (1280x800)**: Pantallas de computadoras portátiles y monitores de escritorio.
  - Verificación rigurosa de cero desbordes horizontales (`scrollWidth <= innerWidth`) y ajuste ergonómico táctil.
- **2. Sub-Navegación Táctil en Portal del Contador y Panel de Cliente (`accountantPortal.css`, `clientDashboard.css`)**:
  - Implementado desplazamiento horizontal táctil fluido (`overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; white-space: nowrap;`) en `.accountant-subnav-bar` y `.client-subnav-bar`.
  - Añadido `flex-shrink: 0;` a botones de subpestañas para evitar truncamiento o salto de línea forzado en pantallas móviles.
- **3. Tarjeta de Código de Vinculación Profesional (`AccountantPortal.jsx`, `accountantPortal.css`)**:
  - Clases responsivas `.accountant-link-banner-inner` y `.accountant-link-banner-actions`.
  - En pantallas `< 640px`, los botones *"Copiar Código"* y *"Gestionar Vinculaciones"* se apilan verticalmente con ancho 100% y centrado ergonómico.
  - Tabla de clientes `.clients-table-card` con desplazamiento horizontal seguro sin cortar columnas.
- **4. Modales y Guía General del Sistema (`SystemOverviewModal.css`, `untitled-ui.css`, `responsive.css`)**:
  - Corrección de colisión de títulos con botón de cierre en todos los modales agregando `padding-right: 2.5rem;` a `.uui-modal-title`.
  - En dispositivos móviles, la barra de roles de la guía (`.overview-roles-bar`) se adaptó a scroll táctil horizontal para evitar apilar botones y consumir espacio vertical de la explicación.
  - Ajuste de relleno y contraste en `.overview-hero-card` para legibilidad óptima en pantallas pequeñas.
- **5. Cabecera y Controles de Barra Superior (`header.css`)**:
  - En pantallas `< 480px`, optimizado el espacio de `.app-shell-navbar` (44px) y botones de control para evitar saturación de la barra.
- **6. Semáforo Fiscal y Consumo de Escala (`taxTrafficLight.css`)**:
  - En pantallas `< 640px`, la cabecera del semáforo fiscal se reorganiza en columna limpia, el porcentaje de consumo se calibra a 1.65rem y se ocultan los subtextos secundarios de las marcas de la escala graduada para evitar sobreposiciones visuales.
- **7. Resultados de Verificación Playwright y Tests Unitarios**:
  - Auditoría de Playwright finalizada con **0 desbordes detectados en todos los 4 modos de pantalla**.
  - Suite de pruebas vitest: **21 de 21 archivos y 107 de 107 tests aprobados (100% verde sin regresiones)**.

## [2026-10-10] ingest | Módulo y Botón "¿Cómo Funciona el Sistema?" Personalizado por Rol de Usuario (`SystemOverviewModal.jsx`)
- **1. Botón "¿Cómo funciona?" en Barra Superior (`Header.jsx`, `header.css`, `Icons.jsx`)**:
  - Incorporado en la cabecera fija de la aplicación con ícono vectorial `HelpCircleIcon`, estilo Untitled UI y respuesta háptica.
  - Visible y accesible de forma permanente tanto en escritorio como en dispositivos móviles.
- **2. Centro Interactivo de Funcionamiento y Catálogo de Módulos (`SystemOverviewModal.jsx` & `systemOverviewModal.css`)**:
  - Detecta automáticamente el rol del usuario conectado (`client`, `accountant`, `superadmin`) y despliega su guía personalizada por defecto con etiqueta *"Tu Rol"*.
  - Incluye selector segmentado para explorar los otros roles y comprender la interacción de todo el ecosistema AutoARCA.
  - **A. Guía para Comercios y Monotributistas (`client`)**:
    - *El Ciclo del Comercio*: 1. Facturación en POS en < 5s -> 2. Semáforo en vivo y presupuesto diario -> 3. Cierre diario en 1 clic -> 4. Sincronización automática con el contador.
    - *Catálogo de Módulos*: POS Terminal (RG 4892 con QR y RG 5700 hasta $10M sin identificar), Semáforo & Barra de Consumo, Simulador de Recategorización, Cruce Bancario & Brecha (Art. 20 inc. f y g), Buzón DFE (RG 4280), Monitor VEP con QR interoperable, Control de Compras (80%/40%), Abonos recurrentes y Constancia F. 152.
  - **B. Guía para Estudios Contables y Contadores (`accountant`)**:
    - *Flujo Operativo del Estudio*: 1. Vinculación por código o CUIT -> 2. Monitoreo global de semáforos -> 3. Descarga masiva ZIP de lotes ARCA -> 4. Recategorización semestral, certificaciones y exportación.
    - *Catálogo de Módulos*: Cartera & Lotes Diarios, Matriz Masiva de Recategorización (Ley 27.743), Central DFE Multi-Cliente con descargos legales, Tablero de Brecha Bancaria, Calendario CUIT con checklist (CM03 / IIBB), Certificaciones de Ingresos FACPCE Res. 37, Exportador a Tango/Holistor/Bejerman/Excel BOM y Gestión de Honorarios con cobranza por WhatsApp.
  - **C. Guía para el Super Administrador (`superadmin`)**:
    - *Flujo de Gobierno y Negocio*: 1. Métricas SaaS y MRR -> 2. Regulación de escalas ARCA en caliente -> 3. Gestión de suscripciones y bloqueo por morosidad -> 4. Auditoría de Supabase y Cron Jobs nocturnos.
    - *Catálogo de Módulos*: Métricas de negocio, Editor maestro de escalas de Monotributo, Usuarios y control de suscripción, Diagnóstico de Base de Datos y Monitor de automatizaciones.
- **3. Pruebas Automatizadas y Calidad**:
  - Creada suite `tests/SystemOverviewModal.test.jsx` con 5 tests unitarios e integrales.
  - **100% de la suite de pruebas aprobada: 21 de 21 archivos y 107 de 107 tests pasando sin fallas**.

## [2026-10-10] ingest | Suite Integral del Contador para Estudios Contables en Argentina (Ley 27.743, RG 5700, RG 4280, FACPCE Res. 37, Tango, Holistor)
- **1. Matriz Masiva de Recategorización Semestral (`AccountantRecategorizationMatrix.jsx` & `accountantRecatMatrix.css`)**:
  - Auditoría masiva de toda la cartera de clientes según los parámetros semestrales (Enero / Julio) fijados por la Ley 27.743 y RG ARCA.
  - Proyección en tiempo real de facturación acumulada de los últimos 12 meses vs topes vigentes.
  - Cálculo automático de variaciones de cuota mensual en pesos (`quotaDiff`) para cada contribuyente.
  - Filtros instantáneos por diagnóstico (Todos, Cambian de Categoría, Suben, Bajan).
  - Alerta en 1 clic para enviar por WhatsApp o Email al cliente el diagnóstico y recordatorio formal.
  - Exportación de la matriz completa de recategorización en CSV con compatibilidad Excel (BOM UTF-8).
- **2. Central Unificada de DFE Multi-Cliente / E-Ventanilla (`AccountantDfeInbox.jsx` & `accountantDfeInbox.css`)**:
  - Bandeja consolidada de notificaciones, requerimientos e intimaciones de ARCA para todos los CUITs de la cartera (RG ARCA 4280).
  - Contador regresivo de plazo perentorio de 15 días hábiles con alerta de urgencia (< 5 días hábiles o vencidos).
  - **Redactor de Descargo Formal Integrado**: Genera escritos formales con membrete del estudio contable, mención del Art. 100 de la Ley 11.683 y modelo listo para copiar y pegar en *Presentaciones Digitales* de ARCA.
- **3. Tablero de Exclusión y Brecha Bancaria de la Cartera (`AccountantBankRiskDashboard.jsx` & `accountantBankRisk.css`)**:
  - Monitor preventivo de riesgos de exclusión de oficio según Art. 20 inc. f y g de la Ley 24.977.
  - Cotejo entre acreditaciones bancarias brutas / billeteras virtuales y facturación electrónica emitida.
  - Cálculo de la brecha no facturada de cada cliente y semaforización de riesgo crítico.
  - Exportación de la auditoría de conciliación bancaria a CSV.
- **4. Calendario Impositivo Dinámico por Terminación de CUIT (`AccountantTaxCalendar.jsx` & `accountantTaxCalendar.css`)**:
  - Agrupación operativa de clientes por terminación de CUIT (0-1, 2-3, 4-5, 6-7, 8-9) para vencimientos de Ingresos Brutos (Convenio Multilateral CM03 y regímenes locales).
  - Alerta unificada de vencimiento mensual de Monotributo nacional (día 20 de cada mes).
  - Checklist interactivo de tareas del estudio por cliente: *Lote / DDJJ*, *VEP Enviado*, *Liquidado*.
  - Indicador de porcentaje de cumplimiento mensual del estudio contable.
- **5. Generador de Certificaciones de Ingresos FACPCE Res. 37 (`AccountantIncomeCertificateModal.jsx` & `accountantIncomeCert.css`)**:
  - Confección de la manifestación de ingresos y certificación profesional según la Resolución Técnica N° 37 de la FACPCE.
  - Desglose mensual de los últimos 12 meses de facturación con validación de comprobantes y CAE oficial ARCA.
  - Membrete formal con matrícula profesional del contador ante el Consejo Profesional (CPCECABA / CPCE Provincial).
  - Vista optimizada de impresión y guardado en PDF de alta fidelidad.
- **6. Exportador Multi-Software Contable (`AccountantMultiSoftwareExportModal.jsx`, `arcaExportService.js`)**:
  - Módulo de exportación masiva con soporte específico para:
    - **Tango Gestión (.txt)**: Formato posicional nativo para el módulo de Ventas y Facturación de Tango Software.
    - **Holistor / Sistemas Bejerman (.txt)**: Archivo estructurado con código de comprobante 011 y formato posicional estándar.
    - **Excel Universal (.csv con UTF-8 BOM)**: Planilla de cálculo lista para abrir sin distorsión de caracteres.
    - **ARCA Importador Oficial (.csv)**: Estructura nativa para importación de lotes en el portal de ARCA.
- **7. Control y Cobranza de Honorarios Profesionales (`AccountantFeesManager.jsx` & `accountantFees.css`)**:
  - Tablero financiero para estudios contables: Honorarios Facturables, Total Cobrado, Pendiente de Cobro y Efectividad de cobranza.
  - Lista de clientes con monto mensual acordado, estado de pago (Pagado / Pendiente) y fecha de liquidación.
  - Generador de mensajes de cobro personalizados para WhatsApp con CBU/Alias bancario del estudio contable.
- **8. Sub-Navegación Unificada en el Portal del Contador (`AccountantPortal.jsx` & `accountantPortal.css`)**:
  - Barra de sub-navegación horizontal con diseño Untitled UI para conmutación fluida entre Cartera & Lotes, Recategorización, Central DFE, Riesgo Bancario, Calendario CUIT y Honorarios.
  - Acciones rápidas incorporadas a cada fila de cliente: *PDF Fiscal*, *Excel*, *Constancia*, *Certificación*, *Exportar*, *CSV ARCA*.
- **9. Batería de Pruebas Automatizadas y Visuales**:
  - Creada suite `tests/AccountantAdvancedFeatures.test.jsx` con 8 pruebas integrales.
  - **100% de la suite de pruebas aprobada: 20 de 20 archivos de prueba y 102 de 102 tests pasando**.
  - Sesión de validación visual interactiva ejecutada mediante Browser Subagent con 6 capturas de pantalla de alta fidelidad.

## [2026-10-10] ingest | Implementación Integral de Funcionalidades Avanzadas de ARCA (Cruce Bancario, Compras, DFE, VEP QR, Constancia F.152, Abonos y RG 5700)
- **1. Monitor de Cruce Bancario & Billeteras Virtuales vs Facturación (`BankCrossingMonitor.jsx` & `bankCrossingMonitor.css`)**:
  - Implementado según Art. 20 inc. f y g de la Ley de Monotributo (Ley 24.977 y modif. Ley 27.743) y RG 4298 de ARCA.
  - Compara en tiempo real las acreditaciones bancarias brutas y billeteras virtuales (Mercado Pago, CVU) descontando transferencias no comerciales justificadas (cuentas propias, préstamos).
  - Calcula la **Brecha No Facturada** y el porcentaje de exposición ante ARCA.
  - Alerta temprana de riesgo de exclusión de oficio o recategorización forzosa por superar topes de categoría o de la Categoría K.
- **2. Central de Domicilio Fiscal Electrónico (DFE / E-Ventanilla) (`DfeNotificationCenter.jsx` & `dfeNotificationCenter.css`)**:
  - Implementado conforme a la RG ARCA 4280.
  - Monitorea requerimientos, intimaciones y notificaciones fiscales con un **reloj regresivo de 15 días hábiles** (descuenta fines de semana y feriados).
  - Incluye **Asistente de Descargo Rápido** con modelos redactados y botón de copiado directo para *Presentaciones Digitales* de ARCA.
- **3. Monitor de Cuota Mensual VEP & QR Interoperable (`VepPaymentModal.jsx` & `vepPaymentModal.css`)**:
  - Calcula el vencimiento mensual del día 20 (ajustado por días hábiles).
  - Desglosa el importe en Impuesto Integrado, Aporte SIPA y Obra Social.
  - Calcula intereses resarcitorios diarios por mora si la cuota está vencida.
  - Genera VEP con código de 12 dígitos y código QR Interoperable para pago directo desde Mercado Pago, MODO, Cuenta DNI o BNA+.
  - Guía paso a paso para **Reimputación de Saldos a Favor (Formulario 399 ARCA)**.
- **4. Semáforo de Compras e Insumos Máximos Permitidos (`ExpensePurchaseLimitMonitor.jsx` & `expensePurchaseLimitMonitor.css`)**:
  - Implementado según Art. 20 inc. c de la Ley 24.977.
  - Controla que las compras y gastos no excedan el **80% (bienes)** o el **40% (servicios)** del tope máximo de la Categoría K.
  - Barra de progreso calibrada con advertencia previa al 75% y 90% para prevenir la exclusión de pleno derecho.
- **5. Constancia de Inscripción Oficial ARCA & Credencial de Pago F. 152 (`OfficialConstanciaInscripcionModal.jsx` & `officialConstancia.css`)**:
  - Reproducción fidedigna del formato legal de ARCA / AFIP (RG 1817) con validez legal de 180 días.
  - Tabla de impuestos activos, actividades declaradas con código de nomenclador oficial y código QR de verificación fiscal.
  - Pestaña para **Credencial de Pago (Formulario 152)** con Código Único de Revista (CUR) y código de barras.
  - Soporte de impresión directa con estilos `@media print` y exportación JSON.
  - Disponible tanto para el contribuyente como para el contador en su panel multi-cliente.
- **6. Gestor de Facturación Recurrente de Abonos Mensuales (`RecurringBillingManager.jsx` & `recurringBilling.css`)**:
  - Permite a profesionales independientes y comercios registrar clientes con abonos fijos mensuales.
  - Botón de **"Emitir Lote"** que genera automáticamente todas las facturas del mes en 1 clic y las incorpora a la cola de cierre para ARCA.
- **7. Actualización Normativa RG ARCA 5700/2025 en POS Terminal**:
  - Actualizado el límite para emitir a **Consumidor Final sin identificar a $10.000.000** (previamente fijado en $250.000).
- **8. Validación Automatizada**:
  - Creada suite de pruebas unitarias e integrales en `tests/ArcaAdvancedFeatures.test.jsx`.
  - **19 de 19 suites de Vitest aprobadas (94 tests pasando al 100%)**.
  - Verificación visual y funcional en vivo mediante Browser Subagent.

## [2026-10-10] ingest | Eliminación Total del Selector de Roles, Barra de Consumo Fiscal Fintech, Simulador ARCA, Factura C Oficial con QR y Exportador Excel
- **Causa Raíz del Problema del Selector de Roles**:
  - Detección de proceso zombi en Node (PID 6332) ocupando el puerto `5173`, mientras el servidor de desarrollo activo corría en `5174`. El navegador del usuario abría `localhost:5173` recibiendo el bundle desactualizado.
  - Proceso terminado forzosamente con `Stop-Process -Id 6332 -Force` y servidor Vite re-enlazado limpiamente al puerto estándar `5173`.
- **Eliminación Total y Definitiva de Selectores de Roles (`Header.jsx`, `App.jsx`, `header.css`)**:
  - Removido por completo cualquier control de conmutación de rol, selectores y el badge de rol del Header.
  - El Header ahora se mantiene 100% minimalista, limpio y profesional, mostrando únicamente: Isotipo y Marca ("AutoARCA PRO"), Conmutador de Tema (Sol/Luna), Conmutador de Audio Háptico y Chip de Perfil de Usuario / Salir.
  - La sesión y los permisos quedan estrictamente gobernados por la autenticación del usuario (`currentUser.role`).
- **Mejora Integral de la Barra de Progreso de Consumo de Escala Global (`TaxTrafficLight.jsx` & `taxTrafficLight.css`)**:
  - **Diseño Fintech de Alta Gama**:
    - Riel con fondo de cristal ahumado y borde interior de profundidad.
    - Relleno dinámico con gradiente luminoso ultra-suave (Esmeralda/Menta en zona segura, Ámbar en alerta, Carmesí en crítico).
    - Efecto continuo de iluminación *shimmer*.
    - Indicador de aguja / thumb pin pulsante con halo en el extremo del porcentaje exacto (`41.6%`).
    - **Marcador Fantasma de Proyección a Fin de Mes (`▲ Proy. Mes`)**: Aguja vertical punteada que proyecta dónde aterrizará la facturación si el contribuyente mantiene el ritmo actual.
    - Hitos graduados calibrados con doble línea de texto (`0% Base`, `50% Mitad`, `75% Alerta`, `90% Crítico`, `100% Tope Cat. D`).
    - **Banner de Presupuesto Diario Inteligente**: Cálculo en tiempo real de cuánto puede facturar por día promedio para no recategorizarse en los próximos 6 meses.
    - 3 Tarjetas métricas de cristal enriquecidas con insignias de tendencia y porcentajes de margen disponible.
- **Nuevas Funcionalidades del Sistema**:
  - **1. Simulador Interactivo de Recategorización Semestral ARCA (Enero / Julio)**:
    - Integrado directamente en `TaxTrafficLight.jsx` con botón desplegable `⚡ Simulador ARCA`.
    - Permite al comerciante ingresar o arrastrar un monto adicional a facturar con atajos rápidos (+250k, +500k, +1M, +2.5M, +5M).
    - Computa en tiempo real: categoría proyectada, impacto en cuota fija mensual de ARCA, diferencia en pesos (`quotaDiff`), consumo de escala resultante y veredicto del asesor algorítmico.
  - **2. Previsualizador y Generador Oficial de Factura C con QR de ARCA (AFIP RG 4892) (`OfficialFacturaCModal.jsx` & `officialFacturaC.css`)**:
    - Genera la Factura C idéntica a la emitida por los sistemas oficiales de ARCA:
      - Letra C en recuadro central (Código 011).
      - Razón social, CUIT, Condición IVA (Responsable Monotributo), Punto de Venta 00001, Nro de Comprobante y fecha.
      - Receptor (Consumidor Final, DNI/CUIT), desglose de ítems, totales y leyenda oficial.
      - **Código QR oficial de ARCA**: Generado dinámicamente en SVG con el payload estándar en Base64 según la RG 4892 de AFIP/ARCA.
      - Código de Autorización Electrónico (CAE) y Fecha de Vto. CAE.
      - Botones para impresión directa en papel/PDF con CSS `@media print` optimizado y descarga de metadatos en JSON.
      - Integrado en `ClientDashboard.jsx` (botón en cada venta de la jornada) y en `PosTerminal.jsx`.
  - **3. Exportador de Libro de Ventas en CSV/Excel para el Contador (`arcaExportService.js`)**:
    - Nueva función `generateLibroVentasExcelCsv` con formato tabular para Excel con prefijo UTF-8 BOM.
    - Incorporado en `ClientDashboard.jsx` ("Libro de Ventas Excel") y en `AccountantPortal.jsx` ("Excel" para cada cliente de la cartera).
- **Validación Automatizada y Visual**:
  - **18 de 18 suites de Vitest aprobadas (81 tests pasando con 0 fallas)**.
  - Servidor Vite verificado corriendo en `http://localhost:5173/`.
  - Capturas visuales Playwright generadas y comprobadas en modo Desktop y Mobile.

## [2026-10-10] ingest | Íconos Profesionales SVG, Barra Fiscal Calibrada, Auth Mobile Centrado y Eliminación de Pasaje Manual de Roles
- **Íconos Profesionales del Sistema (Eliminación de Emojis y Reemplazo por SVGs Vectoriales)**:
  - Creados e implementados componentes SVG stroke-based en `Icons.jsx`:
    - `AutoArcaLogoIcon`: Isotipo oficial de AutoARCA (escudo de seguridad fiscal con gradiente e isotipo relámpago).
    - `StoreIcon`: Ícono de punto de venta / local comercial para monotributistas.
    - `CrownIcon`: Corona vectorial para perfiles SuperAdmin.
    - `ReceiptTaxIcon`: Factura / comprobante impositivo ARCA.
    - `ShieldCheckIcon`: Escudo de verificación y cumplimiento fiscal.
    - `TrendingUpIcon`: Curva de crecimiento interanual acumulada.
    - `FileTextIcon`: Documento de auditoría y reportes contables.
    - `EyeIcon` y `EyeOffIcon`: Conmutador de visibilidad de contraseñas en `InputField.jsx` (reemplazando `👁️` y `🙈`).
  - Reemplazo exhaustivo de emojis en `AuthScreen.jsx`, `AuthModal.jsx`, `Header.jsx`, `PosTerminal.jsx`, `SuperAdminDashboard.jsx`, `ClientDashboard.jsx`, `AccountantPortal.jsx` y `UserProfileModal.jsx`.
- **Corrección de la Barra de Medición Porcentual del Cliente (`TaxTrafficLight.jsx` & `taxTrafficLight.css`)**:
  - *Causa raíz del error*: El contenedor anterior utilizaba `justify-content: space-between` con 4 elementos (`0%`, `50%`, `85%`, `100%`), desplazando artificialmente el hito del 50% al 33.3% del ancho y el del 85% al 66.6%.
  - *Solución implementada*:
    - Sistema de hitos calibrados con offsets porcentuales absolutos (`left: 0%`, `left: 50%`, `left: 75%`, `left: 100%`) y alineación inteligente (`:first-child` a la izquierda, `:last-child` a la derecha con `translateX(-100%)`).
    - Marcadores físicos (*ticks*) incrustados dentro del riel en las marcas clave de 50%, 75% y 90%.
    - Contexto monetario y fiscal en vivo: Indicador detallado `$ X facturados de $ Y (Tope Cat. Z)`.
    - Insignia de advertencia de desborde dinámico (`.progress-overflow-badge`) cuando el consumo excede el 100%.
- **Centrado y Elevación de la Interfaz Mobile en Auth (`untitled-ui.css`)**:
  - En `@media (max-width: 768px)`:
    - Centrado horizontal y vertical del formulario mediante `display: flex; justify-content: center; align-items: center;`.
    - Contenedor `.uui-auth-box` transformado en una tarjeta flotante elevada con esquinas redondeadas (`18px`), efecto glassmorphism (`backdrop-filter: blur(16px)`), borde sutil (`rgba(255,255,255,0.09)`) y sombra profunda.
    - Cabecera y logotipos centrados con conmutador de tema integrado en posición ergonómica.
    - Cero scroll garantizado y validado en iPhone 13/14 (844px), Android Galaxy (800px) y iPhone SE (667px).
- **Eliminación del Pasaje Manual de Roles entre Usuarios (`Header.jsx` & `App.jsx`)**:
  - Eliminado el conmutador interactivo segmentado (`.role-switcher-wrap` y botones `role-seg-btn`) que permitía saltar libremente entre roles sin credenciales.
  - El Header ahora exhibe un **badge de rol oficial de solo lectura** (`.header-role-badge`), mostrando con ícono profesional el rol asignado a la sesión autenticada (`Comercio`, `Estudio Contable` o `SuperAdmin`).
  - La navegación y acceso a paneles responde estrictamente a la sesión autenticada (`currentUser.role`), obligando a iniciar sesión para cambiar de usuario o cuenta.
- **Validación Automatizada**:
  - **18 de 18 suites de Vitest aprobadas (80 tests pasando)**.
  - Verificación Playwright multi-resolución de **CERO SCROLL** exitosa.

## [2026-10-10] ingest | Mobile Zero-Scroll, Validación de Contraseña, Código Obligatorio del Contador, Jurisdicción CPCELR La Rioja y Reportes PDF Profesionales
- **Pantalla de Autenticación Mobile Cero-Scroll (390x844, 360x800, 375x667)**:
  - Optimización responsiva en `untitled-ui.css` (`@media (max-width: 768px)`):
    - `.uui-auth-container` y `.uui-auth-left` blindados con `height: 100dvh; max-height: 100dvh; overflow: hidden; overflow-y: clip;`.
    - Ajuste vertical ergonómico: tarjetas de selección de rol transformadas en píldoras horizontales compactas (`display: none` en descripciones redundantes en mobile).
    - Tipografía, paddings y espaciado de campos adaptados con `clamp()` para asegurar que tanto el Login como el Registro quepan 100% dentro del espacio de pantalla sin scroll vertical.
    - Comprobado con Playwright en iPhone 13/14 (844px), Android Galaxy (800px) y iPhone SE (667px): **Cero scroll detectado (`hasScroll: false`)**.
- **Confirmación de Contraseña en el Registro**:
  - Campo añadido: `Repetir Contraseña` (`regConfirmPassword`) en `AuthScreen.jsx` y `AuthModal.jsx`.
  - Validación preventiva: Verifica que la clave coincida exactamente con la confirmación antes de enviar; si discrepan, muestra alerta descriptiva *"Las contraseñas no coinciden. Por favor verifícalas"*.
- **Código del Contador Obligatorio para Clientes**:
  - Para registrarse con el rol `client` (Comercio / Monotributo), el campo `Código de tu Contador` es estrictamente obligatorio (`required`).
  - Validación en vivo contra los contadores registrados usando `authService.findAccountant(code)`:
    - Si el campo está vacío: *"El código de vinculación de tu contador es obligatorio para registrar un comercio"*.
    - Si el código no existe: *"No se encontró ningún estudio contable registrado con ese código. Por favor verifica el código con tu contador (Tip demo: usa CONT-MENDEZ-9876)"*.
- **Investigación e Incorporación de la Jurisdicción de La Rioja (Argentina)**:
  - Investigado y constatado el Consejo oficial: **CPCELR** (*Consejo Profesional de Ciencias Económicas de La Rioja*, Av. Castro Barros 1102, La Rioja, Argentina).
  - Incorporada la opción prioritaria `CPCELR (La Rioja)` en los selectores de jurisdicción de contadores en `AuthScreen.jsx`, `AuthModal.jsx` y el servicio de reportes.
- **Servicio y Generación de Reportes PDF Profesionales para Contadores (`reportPdfService.js`)**:
  - Motor de reportes basado en `jspdf` y `jspdf-autotable`.
  - `generateClientFiscalReport`: Genera un informe fiscal auditado en A4 que incluye:
    - Membrete y encabezado profesional con datos del estudio contable auditor y del comercio monotributista.
    - Semáforo fiscal de recategorización ARCA con estado visual en color (Verde, Amarillo, Rojo).
    - Tabla auditada de facturación acumulada 12 meses, promedio proyectado, tope de categoría, consumo porcentual y margen disponible.
    - Desglose de ventas por medio de pago (Efectivo, Transferencia/QR, Débito, Crédito) con porcentaje de participación.
    - Detalle oficial de comprobantes emitidos (FAC-C) para ARCA con numeración, fecha, cliente y montos.
    - Pie de página con numeración y firma de auditoría del sistema.
  - `generateAccountantPortfolioReport`: Genera una planilla horizontal (Landscape) con la nómina de todos los clientes del estudio, su estado en el semáforo fiscal, comprobantes emitidos en el día e importe consolidado.
  - Botones añadidos en la interfaz:
    - En `AccountantPortal.jsx`: Botón en la cabecera *"Informe Cartera PDF 📄"* y botones por cliente *"📄 PDF Fiscal"*.
    - En `ClientDashboard.jsx`: Botón en el encabezado *"Reporte PDF Contador 📄"*.
- **Validación Automatizada**:
  - **18 suites de Vitest pasando al 100% (80 tests exitosos)**, incluyendo pruebas unitarias específicas de PDF y validación de contraseñas.
  - Script Playwright multidispositivo validando que la pantalla de autenticación no genere scroll en ninguna resolución móvil.

## [2026-10-10] ingest | Flujo Integral de Autenticación (Login & Registro) y Diseño Adaptativo Zero-Scroll en Pantalla
- **Corrección de Registro e Inicio de Sesión (`AuthScreen`, `authService`, `App`)**:
  - *Causa raíz resuelta*: `authService.getCurrentSession()` forzaba la sesión demo de Martín González si `autoarca_session_v2` estaba ausente, impidiendo que el usuario viera la pantalla de inicio de sesión o registrara cuentas propias al entrar a la web.
  - Se modificó `getCurrentSession()` para respetar el estado no autenticado devolviendo `null` cuando no hay sesión activa en `localStorage`, mostrando obligatoriamente la pantalla de AuthScreen de Untitled UI.
  - Normalización en `login(email, password)`: `trim()`, insensible a mayúsculas/minúsculas y verificación estricta de contraseña con alertas rojas descriptivas si las credenciales no existen o son erróneas.
  - Registro completo `register(...)`: Validación preventiva de campos obligatorios (nombre, correo, contraseña mín. 4 caracteres, rol, CUIT, actividad comercial o matrícula contable), creación del perfil de negocio y código de vinculación único `CONT-...`. Al completarse, inicia la sesión de inmediato y redirige al panel correspondiente.
  - Persistencia segura y botón "Salir" (Logout) en `Header.jsx`: Limpia la sesión de `localStorage` y regresa limpiamente a `AuthScreen` sin auto-loguear al usuario.
  - Accesos rápidos Demo de 1 clic (Cliente, Contador, Admin) con feedback háptico e inicio instantáneo.
- **Diseño Adaptativo Zero-Scroll (Ajuste ergonómico al espacio de pantalla)**:
  - *AuthScreen*: Contenedor con `height: 100dvh; max-height: 100dvh; overflow: hidden;` con proporciones verticales `clamp()` en títulos, tabs, campos e iconos para que el formulario completo y el panel de showcase quepan de un solo vistazo sin barra de scroll en laptops (800p/900p), tablets y teléfonos.
  - *Terminal POS*: Contenedor adaptado con `height: calc(100dvh - 104px); max-height: calc(100dvh - 104px); overflow: hidden; justify-content: space-between;`. Teclado numérico, medios de pago, atajos rápidos ($500 - $5.000) y el botón principal "Emitir Comprobante" ahora son 100% visibles simultáneamente en pantalla sin scroll vertical.
  - *Shell Global*: `.app-shell-root` con flexbox vertical a `100dvh`, aislando el scroll estrictamente a las listas largas del dashboard fiscal o del portal del contador, manteniendo el Header y la barra de navegación fijos.
  - *Soporte Nativo de Modo Claro en Untitled UI*: Reglas directas en `untitled-ui.css` y `theme-light.css` garantizando fondos blancos puros (`#ffffff`), bordes suaves (`#cbd5e1`), textos legibles (`#0f172a`) y tarjetas showcase con sombra sutil.
- **Validación Automatizada**:
  - **17 de 17 suites de Vitest pasando al 100% (76 tests exitosos)**.
  - Pruebas Playwright ejecutadas en 4 viewports (Desktop 1440x900, Laptop 1280x800, Tablet 820x1180, Mobile 390x844) confirmando **CERO SCROLL** vertical en la pantalla activa.

## [2026-10-10] ingest | Auditoría Visual Automatizada con Playwright & Perfeccionamiento de Diseño Cross-Device
- **Descubrimiento e Instalación de Skill Playwright (`find-skills`)**:
  - Se utilizó `find-skills` (`npx skills find playwright`), descubriendo la skill oficial de Microsoft `microsoft/playwright-cli@playwright-cli` (179.4K instalaciones).
  - Instalada la skill en el repositorio: `.agents/skills/playwright-cli/SKILL.md`.
  - Configurado Playwright con binario de Chromium Headless Shell para pruebas visuales en local.
- **Auditoría Visual Automatizada Multidispositivo y Multitema**:
  - Script programado: `scripts/visualAudit.js` ejecutando capturas de alta densidad (deviceScaleFactor: 2) para:
    - 3 viewports: Desktop (1440x900), Tablet iPad (820x1180) y Mobile iPhone (390x844).
    - 2 temas: Modo Oscuro (OLED / Slate) y Modo Claro (Luz de día / WCAG AAA).
    - 5 superficies: Terminal POS, Dashboard Fiscal, Portal del Contador, Panel SuperAdmin y Pantalla de Acceso AuthScreen (Login y Registro).
    - Almacenamiento en `playwright-screenshots/` (más de 30 capturas generadas).
- **Hallazgos Visuales Detectados y Corregidos Mediante las Capturas**:
  1. *Dashboard Fiscal en Modo Claro*:
     - Título del negocio ("La Casa de Limpieza") tenía color blanco forzado en línea sobre fondo claro; corregido con `--text-main` y clase semántica `.dashboard-business-title` para contraste óptimo.
     - Subtítulo de lotes ARCA ("Historial de Lotes Diarios") corregido a color adaptativo.
  2. *Hitos de la Barra de Progreso (`TaxTrafficLight`)*:
     - Los marcadores `0%50%85% Alerta100% Límite` se renderizaban aglomerados sin espaciado horizontal.
     - Se implementó `.progress-milestones` con distribución flex `space-between` y tipografía clara.
  3. *Portal del Contador*:
     - El Código de Vinculación (`CONT-MENDEZ-9876`) se mostraba en blanco sobre gris claro; corregido con `.accountant-link-code` a negro nítido (`#0f172a`).
  4. *SuperAdmin*:
     - Los campos de entrada numéricos de la tabla de escalas oficiales tenían fondos oscuros en modo claro; corregidos con `.admin-scale-input` en blanco puro con borde suave y foco violeta.
     - Títulos `h1` y `h2` estandarizados con variables de tema.
  5. *Pantalla AuthScreen (Untitled UI)*:
     - El título showcase y los ítems con iconos de validación en modo claro tenían texto blanco sobre fondo blanco; corregidos con texto legible (`#0f172a` y `#475569`) e iconos en verde esmeralda.
  6. *Cabecera y Navegación Móvil (< 768px)*:
     - En pantallas de 390px, el selector de roles se desbordaba cortando botones; se configuró `.role-seg-text` en `display: none` en móviles para mostrar solo los iconos (`👤`, `📑`, `👑`), compactando el ancho y logrando un ajuste perfecto sin scroll.
     - Añadido padding inferior al contenedor `.app-main-content` en móviles para garantizar que la barra de pestañas flotante inferior nunca cubra botones ni contenido.
- **Validación y Pruebas**:
  - **17 de 17 suites de Vitest pasando al 100% (76 tests exitosos)**.
  - Compilación de producción con Vite (`npm run build`) completada en 2.08s con código de salida 0.

## [2026-10-09] ingest | Eliminación de Botón Supabase DB & Blindaje Universal de Modo Claro
- **Eliminación del Botón Supabase DB**:
  - Removido del `Header.jsx` el botón/píldora flotante `supabase-cloud-pill` ("Supabase DB") para un diseño más limpio y despejado.
- **Blindaje Universal de Modo Claro en Todos los Componentes (`theme-light.css`)**:
  - Se eliminaron las inconsistencias donde componentes específicos mantenían colores oscuros o fondos opacos al activar el tema claro:
    - *Terminal POS*: `.pos-header`, `.pos-display-card`, `.pos-amount-display`, `.pos-client-badge-row`, `.payment-chip`, `.quick-amount-chip`, `.keypad-btn` y botón de borrado `.keypad-btn.action` ahora se renderizan con superficies blancas/claras, bordes sutiles y textos en alto contraste (#0f172a).
    - *Semáforo Fiscal (`TaxTrafficLight`)*: Tarjeta principal en blanco puro, barra de progreso con riel gris claro (#e2e8f0), métricas auxiliares con tarjetas slate-50 y badges de estado en tonos pasteles legibles.
    - *Portal del Contador (`AccountantPortal`)*: Encabezados, tarjetas KPI métricas, buscador, chips de filtro, selector de vista (tabla vs tarjetas) y tabla de clientes con cabecera y filas claras.
    - *SuperAdmin (`SuperAdminDashboard`)*: Panel global, pestañas, buscador, tabla de escalas A a K y lista de usuarios con estilos claros consistentes.
    - *Modales (`AuthModal`, `UserProfileModal`, `AccountantLinkModal`)*: Tarjetas modales, tabs, inputs, labels y chips demo adaptados a fondo blanco con sombra profunda suave.
    - *Banner de Suspensión*: Renderizado en rojo pastel suave (#fef2f2) con texto nítido (#991b1b).
- **Pruebas y Verificación**:
  - Test añadido en `tests/ThemeAndDirectRoleSwitch.test.jsx` comprobando la no presencia de "Supabase DB".
  - **17 de 17 suites de Vitest pasando al 100% (76 tests exitosos)**.
  - Compilación de producción con Vite (`npm run build`) verificada en 2.32s.
  - Cambios sincronizados y subidos a la rama `main` en GitHub (commit `3d9caa9`).

## [2026-10-09] ingest | Modo Claro Impecable y Conmutador Directo de Roles (Eliminación de Acordeón)
- **Instalación y Aplicación de la Skill Impeccable (`pbakaus/impeccable`)**:
  - Instalada la skill oficial con más de 320K instalaciones (`.agents/skills/impeccable/`).
  - Aplicados los principios rectores de `craft-floor.md` (modo *Operate*, contraste WCAG AAA >= 4.5:1, eliminación de patrones amateur como sombras duras o acordeones innecesarios para conmutación de estado, y elevación suave con desenfoque).
- **Eliminación del Acordeón / Desplegable para Conmutar Roles**:
  - Se suprimió el selector `<select>` desplegable que actuaba como un acordeón incómodo para pasar de Cliente a Contador.
  - Se implementó un control segmentado directo de 1 toque en `Header.jsx` (`.role-switcher-segmented`) con píldoras de navegación activa: `[👤 Cliente]`, `[📑 Contador]` y `[👑 Admin]`.
  - Transición instantánea entre la vista del Comercio / Monotributista y la cartera del Estudio Contable.
  - Sincronización transparente en segundo plano para tests y tecnologías de asistencia.
  - Actualización de `AuthModal.jsx` para seleccionar el tipo de cuenta con tarjetas segmentadas directas.
- **Sistema Integral de Modo Claro (`src/styles/theme-light.css` importado en `src/index.css`)**:
  - Paleta clara refinada con fondo slate-50 (`#f8fafc`), tarjetas en blanco puro (`#ffffff`), bordes de baja opacidad (`rgba(15, 23, 42, 0.08)`) y sombras suaves multicapa.
  - Tipografía de alto contraste con jerarquía slate-900 / slate-600.
  - Botón interactivo de alternancia de tema (`theme-toggle-btn`) con iconos de Sol y Luna (`SunIcon`, `MoonIcon`) y respuesta sonora táctil en el Header y en la pantalla de bienvenida `AuthScreen.jsx`.
  - Persistencia de preferencia en `localStorage` (`autoarca_theme`) y detección automática del esquema de color del sistema.
  - Adaptación completa de terminal POS (teclado numérico claro, montos nítidos), tablas de datos, modales y tarjetas de semáforo fiscal.
- **Pruebas y Verificación**:
  - Nueva suite: `tests/ThemeAndDirectRoleSwitch.test.jsx` (3 pruebas unitarias y de integración).
  - **17 de 17 suites de Vitest pasando al 100% (75 tests exitosos)**.
  - Compilación de producción con Vite (`npm run build`) en 2.22s.
  - Cambios sincronizados y subidos a GitHub (`https://github.com/sendeiser/AutoARCA.git`, rama `main`, commit `90b1c13`).

## [2026-10-09] ingest | Sistema Responsivo Fluido Universal & Suite de Flujos de Cuentas
- **Sistema de Diseño Responsivo Fluido (`src/styles/responsive.css` integrado en `src/index.css`)**:
  - Escala tipográfica fluida con funciones CSS `clamp()` (`--fluid-h1`, `--fluid-h2`, `--fluid-h3`, `--fluid-body`, `--fluid-caption`).
  - Espaciado y paddings adaptativos con `--fluid-page-padding` y soporte de `env(safe-area-inset-*)` para iPhone notches y Dynamic Island.
  - Ergonomía táctil: touch targets mínimos de 44px en todos los botones y controles interactivos (`touch-action: manipulation`).
  - Mobile ultra-compacto (< 480px, 540px): Grillas en 2 columnas, reducción de paddings superfluos, eliminación del zoom accidental de Safari (`font-size: 16px` en inputs) y teclado virtual optimizado.
  - Tablets y iPads (768px - 1024px): Grillas balanceadas de 2 a 3 columnas y navegación adaptativa.
  - Escritorio y Ultra-Wide (> 1024px, > 1440px): Contenedores centrados con límite de lectura ergonómica (`max-width: 1400px` / `1600px`).
  - Terminal POS: Botonera numérica contenida verticalmente para evitar desbordes y scrolls involuntarios en smartphones.
  - Tablas con desplazamiento horizontal suave (`overflow-x: auto`, `-webkit-overflow-scrolling: touch`) y scrollbars sutiles.
  - Modales adaptativos: Bottom-sheets en móviles y diálogos flotantes centrados con desenfoque de fondo en pantallas grandes.
- **Suite Integral de Pruebas de Cuentas y Flujos de Trabajo (`tests/AccountWorkflows.test.jsx`)**:
  - *Flujo 1 (Comercio / Monotributista)*: Registro completo con CUIT -> Acceso al POS -> Emisión de comprobantes -> Reflejo en métricas del Dashboard -> Cierre de jornada y generación de lote ARCA.
  - *Flujo 2 (Estudio Contable)*: Registro profesional con CPCE -> Generación de código `CONT-...` -> Supervisión de cartera multi-cliente -> Descarga masiva ZIP.
  - *Flujo 3 (Vinculación Bidireccional)*: Auto-vinculación de cliente al registrarse con código de contador -> Verificación de aparición inmediata en la cartera del contador.
  - *Flujo 4 (SuperAdmin & Control de Morosidad)*: Modificación de escalas de Monotributo (+10% inflación) -> Suspensión de cuenta morosa -> Bloqueo automático del POS con banner explicativo.
  - *Flujo 5 (Seguridad POS)*: Bloqueo inmediato del terminal POS si `subscription_status === 'past_due'`.
  - *Flujo 6 (Ciclo de Sesión y Auth Gate)*: Bloqueo no autenticado -> Login demo -> Interacción en POS -> Cierre de sesión en Header -> Regreso seguro a la pantalla de AuthScreen.
- **Verificación de Calidad**:
  - **16 de 16 suites de Vitest pasando al 100% (72 tests exitosos)**.
  - Compilación de producción con Vite (`npm run build`) en 3.86s.
  - Repositorio Git sincronizado en la rama `main` (`https://github.com/sendeiser/AutoARCA.git`).

## [2026-10-09] ingest | Extensión Integral de Untitled UI React Components a Todo el Sistema
- **Biblioteca de Componentes Untitled UI Creada en [`src/components/untitled-ui/`](file:///d:/Proyecto%20ZEN/app/src/components/untitled-ui/)**:
  - `Card.jsx`: Contenedor modular de tarjetas (`Card`, `CardHeader`, `CardTitle`, `CardSubtitle`).
  - `StatCard.jsx`: Tarjetas métricas oficiales de Untitled UI (`StatCard`, `StatGrid`) con iconos en círculos pastel, valores tabulares y tendencias de cambio porcentual (`up`, `down`, `neutral`).
  - `Table.jsx`: Tablas de datos de alta gama (`TableContainer`, `TableToolbar`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
  - `Modal.jsx`: Diálogo modal accesible con backdrop blur, icono en badge superior, header, footer con botones de acción y cierre por tecla Escape o click exterior.
  - `SearchInput.jsx`: Campo de búsqueda con icono de lupa leading y atajo keyboard.
  - `Button.jsx`, `Badge.jsx`, `InputField.jsx`: Enriquecidos con named exports, soporte de slots de iconos (`iconLeading`/`iconTrailing`) y compatibilidad universal.
  - `index.js`: Archivo barril para importaciones limpias.
- **Modernización y Refactorización de Todos los Módulos del Sistema**:
  - `ClientDashboard.jsx`: Métricas fiscales con `StatGrid` (Consumo 12M, Margen de Seguridad ARCA, Emisión Hoy, Proyección), tarjeta de Cierre de Jornada con `Badge` y `Button`, tabla de Historial de Lotes con `Table`.
  - `AccountantPortal.jsx`: Panel de estudio contable con métricas globales `StatCard`, buscador `SearchInput`, banner de vinculación con `Card` y `Badge`, botones de descarga con `Button`.
  - `SuperAdminDashboard.jsx`: Métricas de plataforma SaaS, tabla interactiva de Escalas de Monotributo A a K con `Table`, ajuste de inflación con `Button` y gestión de usuarios con `Badge`.
  - `PosTerminal.jsx`: Cabecera con `Badge` de Factura C, modal de identificación de cliente migrado a `Modal` de Untitled UI con `InputField` y `Button`.
  - `SupabaseStatusModal.jsx`: Migrado a `Modal` de Untitled UI con visualización de tablas en vivo, ping de latencia y botones `Button`.
- **Verificación de Calidad**:
  - **15 de 15 suites de Vitest pasando al 100% (66 tests exitosos)**.
  - Compilación de producción con Vite (`npm run build`) en 2.17s.
  - Commits confirmados y sincronizados en GitHub (`main` en `af0abf7`).

## [2026-10-09] ingest | Sistema de Autenticación Completo & Untitled UI Design System
- **Sistema de Acceso Obligatorio (Auth Gate)**:
  - Todo usuario no autenticado es retenido en la pantalla de bienvenida/login hasta iniciar sesión o registrarse.
  - Soporte de roles independientes con campos y validaciones personalizadas:
    - `client`: Comercio o Monotributista con datos comerciales, CUIT, actividad y auto-vinculación con su contador.
    - `accountant`: Estudio Contable con matrícula profesional, CPCE asignado y emisión de código de vinculación para clientes.
    - `superadmin`: Acceso global al motor fiscal y gestión multi-usuario.
  - Flujo de cierre de sesión (`handleLogout` / `onLogout`) con botón accesible en `Header.jsx` que retorna de inmediato al Auth Gate.
- **Componentes y Diseño Untitled UI (`https://www.untitledui.com/react/components`)**:
  - `src/styles/untitled-ui.css`: Sistema de tokens visuales de Untitled UI (paletas Brand & Gray, tipografía Inter, sombras `shadow-xs` a `shadow-xl`, focus rings accesibles `ring-brand-100`, selectores de rol tipo cards y layout split screen).
  - `Button.jsx`: Botón modular con 4 variantes (`primary`, `secondary`, `tertiary`, `destructive`), 3 tamaños (`sm`, `md`, `lg`), spinners de carga y soporte de iconos.
  - `InputField.jsx`: Campo de texto de alta precisión con labels obligatorios, hints, mensajes de error, leading/trailing icons y toggle de mostrar/ocultar contraseña con emojis/iconos accesibles.
  - `Badge.jsx`: Badges semánticos para etiquetas de estado, SaaS badges y status dots.
  - `AuthScreen.jsx`: Pantalla de autenticación completa estilo Split-Screen de Untitled UI con showcase interactivo lateral, selector tabulado de Iniciar Sesión vs. Registrarse, cards de selección de rol y accesos rápidos 1-Click Demo.
- **Pruebas y Verificación**:
  - Nueva suite: `tests/UntitledUIAuth.test.jsx` (10 pruebas unitarias y de integración).
  - **15 de 15 suites de Vitest pasando al 100% (66 tests exitosos)**.
  - Compilación de producción con Vite (`npm run build`) verificada en 2.37s.
  - Commits confirmados y sincronizados con GitHub (`https://github.com/sendeiser/AutoARCA.git`, rama `main`, commit `e7e3a48`).

## [2026-10-09] ingest | Componentes JS de Navegación Adaptativa & Registro/Vinculación de Contadores
- **Componentes JS Modulares**:
  - `Header.jsx`: Barra superior con estilo Apple HIG, ultra-compacta (44px móvil / 52px escritorio), indicador de Supabase Cloud en vivo, toggle de audio táctil, selector de rol dinámico y avatar de usuario.
  - `Navbar.jsx`: Sistema adaptativo inteligente de dos vías:
    - *Desktop / Tablet*: Segmented control horizontal con píldoras translúcidas y badges numéricos.
    - *Mobile (< 768px)*: Floating Bottom Tab Bar ergonómica estilo iOS fija en la parte inferior, liberando el 100% del área superior para el terminal POS y el teclado numérico sin scroll.
- **Sistema de Registro y Vinculación Contador <-> Clientes**:
  - Registro profesional para contadores en `AuthModal.jsx` con Matrícula Profesional, Jurisdicción (CPCE) y CUIT de estudio contable.
  - Generación de código único de vinculación profesional (`CONT-...`) con función de copiado y compartir vía WhatsApp/Email.
  - Vinculación bidireccional en `authService.js` y `supabaseDataService.js` (persistencia local y en `public.profiles` con `accountant_id`).
  - Modal interactivo `AccountantLinkModal.jsx` y banner de vinculación en `AccountantPortal.jsx`.
  - Gestión de estudio contable vinculado en `UserProfileModal.jsx`.
- **Pruebas y Verificación**:
  - Nueva suite `tests/AccountantLinkageAndNavigation.test.jsx`.
  - 14/14 suites de Vitest pasando al 100% (**56 tests exitosos**).
  - Build de producción con Vite verificado en 2.15s.
  - Commits sincronizados en la rama `main` de GitHub.

## [2026-10-09] ingest | AutoARCA — Aprovisionamiento de Base de Datos Supabase & MCP Server
- Se aplicó el esquema DDL completo e idempotente ([FULL_SETUP.sql](file:///d:/Proyecto%20ZEN/app/supabase/FULL_SETUP.sql)) en el proyecto `oqwzldvbvdigilcekhmo`.
- Creadas y validadas en vivo las 5 tablas nucleares con RLS e índices:
  - `profiles`: Gestión de usuarios (roles client, accountant, superadmin).
  - `business_profiles`: Datos fiscales, CUIT, actividad y modo de cierre diario.
  - `monotributo_scales`: Categorías oficiales A a K sembradas con montos vigentes.
  - `sales_receipts`: Comprobantes individuales de venta y emisión POS.
  - `daily_batches`: Lotes consolidados y exportaciones oficiales ARCA.
- Se configuró e integró el **Supabase MCP Server** (`@supabase/mcp-server-supabase`) con el nuevo Access Token en `mcp_config.json`.
- Refactorización de `PosTerminal.jsx` bajo patrones de Vercel Labs (Compound Components) y eliminación de memory leaks.
- 13 suites de pruebas unitarias pasando al 100% (51 tests en Vitest).
- Cambios confirmados y sincronizados en GitHub (`https://github.com/sendeiser/AutoARCA.git`).

## [2026-10-06] setup | Inicialización de la bóveda Proyecto ZEN
- Se creó la estructura de tres capas: `raw/`, `wiki/` y `AGENTS.md`.
- Subcarpetas de la wiki: `concepts/`, `entities/`, `summaries/`, `syntheses/` y `raw/assets/`.
- Se copió el esquema rector desde la bóveda `Boveda 1` y se inicializaron `index.md` y `log.md`.

## [2026-10-06] ingest | GastroPOS fase 1
- Spec y plan creados en app/docs/superpowers/; 10 tasks commiteados en rama dev.
- Ver tablero global en Boveda 1 log.

## [2026-10-06] ingest | GastroPOS fase 2 y compilación de la wiki
- Se completaron las 10 tareas de la Fase 2 en la rama `dev`:
  - Task 1: `inventoryService` + Panel de Inventario con umbral mínimo (`6173f49`).
  - Task 2: `customerService` + Panel de Clientes (`70d73b4`).
  - Task 3: `promoService` + Panel de Promociones (`5b57f5a`).
  - Task 4: `shiftService` con persistencia de caja (`ec3415e`).
  - Task 5: `AdminDashboard` con métricas y gráficos CSS (`50208aa`).
  - Task 6: `botProvider` con modos operativos (`e85b69c`).
  - Task 7: `whatsappBotServer` con webhook y página `/tester` (`9548ad3`).
  - Task 8: Esquema `supabase/schema.sql` con RLS habilitado (`e245f33`).
  - Task 9: Suite de pruebas Vitest para ciclo de vida de pedidos (`5e67b1e`).
  - Task 10: Bundle portable del bot con scripts `.bat` y servicio de actualización (`e659c67`).
- Notas creadas en la wiki:
  - Entidad: `wiki/entities/gastropos.md`
  - Conceptos: `wiki/concepts/local-first-storage.md`, `wiki/concepts/kds-cocina.md`, `wiki/concepts/bot-whatsapp-gastronomico.md`
  - Resumen: `wiki/summaries/gastropos-spec-diseno.md`
  - Síntesis: `wiki/syntheses/tablero-gastropos.md`
- Actualizado `index.md` con las nuevas notas categorizadas.

## [2026-10-06] ingest | GastroPOS Arquitectura Profesional & Sistema de Diseño
- Finalización integral del frontend y la estructura de navegación en la rama `dev` (`7b35bfe`):
  - **Sistema de Diseño**: `src/styles/tokens.css` expandido con paleta HSL verde ecológico, soporte glassmorphism, micro-animaciones, tipografía Google Fonts (`Plus Jakarta Sans` e `Inter`) y modo oscuro profundo.
  - **Estructura y Shell de Navegación**: Barra superior con estado de turno en vivo, contador de pedidos en cocina, conmutador de tema fluido y navegación por pestañas modulares.
  - **Terminal POS, KDS Cocina, Caja & Turnos, Inventario, Clientes, Promociones, Dashboard, Bot y Catálogo Online**.
- Verificación: 40/40 tests pasando en Vitest, compilación limpia en `npm run build`.

## [2026-10-06] ingest | GastroPOS Fase 3: Separación de Portales y Links Independientes (Superpowers)
- Planificación y ejecución bajo la metodología Superpowers (`0fc8a0b`):
  - **Plan y Reportes**: Creados `docs/superpowers/plans/2026-10-06-gastropos-phase3-plan.md` y `docs/superpowers/reports/p3-portals-report.md`.
  - **Servicio de Enrutamiento Hash (`src/services/routerService.js`)**: Soporte de URLs directas sin dependencias externas (`#/operaciones`, `#/admin`, `#/catalogo`), generador de URL compartible para clientes y tests unitarios en `tests/routerService.test.js`.
  - **Portal de Operaciones (`src/components/OperatorPortal.jsx`)**: Vista de trabajo ágil para el personal en turno (POS Mostrador, KDS Cocina, Caja & Turnos, Clientes) con acceso directo a administración.
  - **Portal de Administración (`src/components/AdminPortal.jsx`)**: Vista gerencial con Dashboard de métricas, control de inventario, promociones, control del bot de WhatsApp y configuración de marca/carta.
  - **Catálogo Online de Clientes Aislado (`src/components/CustomerStorefront.jsx`)**: Vista 100% pública para clientes (`#/catalogo`) con botón para copiar enlace directo del menú, carrito flotante y checkout con envío directo al WhatsApp del local.
  - **App Shell (`src/App.jsx`)**: Sincronización instantánea de rutas mediante eventos `hashchange`.
- Verificación: 43/43 tests pasando (100% GREEN) y `npm run build` exitoso.

## [2026-10-06] ingest | GastroPOS Fase 4: Evolución Comercial y Blindaje Pro
- Implementación de funcionalidades avanzadas para operativa de restaurante (`9b5ae8c`):
  - **Motor de Impresión Térmica (`src/services/printService.js`)**: Impresión de tickets de 80mm/58mm formateados con `@media print` para impresoras térmicas de comandas.
  - **Gestión de Salón y Mesas (`src/services/tableService.js` & `src/components/TablePlan.jsx`)**: Mapa visual interactivo con estados de mesas (libre, ocupada, cuenta) y asignación directa de comandas.
  - **Calculadora de Vuelto & Atajos de Efectivo (`src/components/TicketPanel.jsx`)**: Botones de un toque para billetes ($1k, $2k, $5k, $10k, $20k, Exacto) y cálculo en vivo del cambio.
  - **Historial de Ventas & Retorno de Stock (`src/components/OrderHistoryPanel.jsx`)**: Auditoría histórica con reimpresión y anulación con reposición automática del stock mediante `adjustStock(id, +qty)`.
  - **Backups y Exportación CSV (`src/services/backupService.js`)**: Exportador de ventas en CSV/Excel y copia de seguridad JSON completa con restaurador.
  - **Alertas Sonoras en Cocina (`src/services/soundService.js` & `src/components/KdsBoard.jsx`)**: Alertas de sonido sintetizadas nativas mediante Web Audio API para nuevos pedidos con controles de silenciado.
  - **Seguridad Gerencial con PIN (`src/services/authService.js` & `src/components/PinLockModal.jsx`)**: Modal con teclado numérico virtual para proteger `#/admin` con PIN personalizable y bloqueo de sesión.
- Verificación: 58/58 tests pasando en Vitest (13 archivos de test), `npm run build` exitoso (72 KB gzipped).

## [2026-10-07] ingest | GastroPOS Fase 5: Bot Funcional, Configuración Integral y Supabase
- Implementación de motor de bot inteligente, configuración completa para dueños y nube Supabase (`17f57cc`):
  - **Motor de Bot de WhatsApp Inteligente (`src/services/botService.js`)**: Procesamiento de intenciones múltiples (saludo con menú interactivo, catálogo categorizado en vivo con emojis y precios, promociones activas, rastreo de estado de pedidos en tiempo real con tiempos transcurridos, información de horarios/delivery, derivación humana y respuestas fallback).
  - **Simulador de WhatsApp Dual en [`src/components/BotPanel.jsx`](file:///d:/Proyecto%20ZEN/app/src/components/BotPanel.jsx)**: Chat interactivo con chips rápidos de prueba y soporte dual (servidor Express puerto 3002 o motor local en navegador sin latencia).
  - **Configuración Integral del Negocio (`src/services/configService.js`)**: Gestor unificado de datos fiscales/comerciales (nombre, CUIT, razón social, dirección, WhatsApp, Instagram, moneda), operativa de delivery (costo de envío, pedido mínimo, demora estimada, horarios), estética de marca con sincronización inmediata al DOM (`--primary`, `--accent`, emoji, slogan) y seguridad (PIN gerencial de 4 dígitos).
  - **Sincronización Supabase Cloud (`src/services/supabaseService.js`)**: Integración REST PostgREST para conectar cualquier proyecto de Supabase, prueba de credenciales en un clic, subida de datos locales (`syncLocalToCloud`), descarga de datos remotos (`syncCloudToLocal`) y copia del esquema SQL con RLS.
  - **Rediseño Integral de [`src/components/AdminPanel.jsx`](file:///d:/Proyecto%20ZEN/app/src/components/AdminPanel.jsx)**: 7 secciones navegables por pestañas para control total del dueño del negocio.
- Verificación: 75/75 tests pasando en Vitest (16 archivos de test, 100% GREEN), `npm run build` exitoso (80 KB gzipped).

## [2026-10-07] ingest | GastroPOS Fase 6: Clonación del Sistema de Productos de ComandaFast
- Adaptación e integración integral del sistema comercial de productos de ComandaFast en GastroPOS:
  - **Modelo de Productos Avanzado**: soporte de `originalPrice` (precio tachado), `discountBadge` (ej. "25% OFF", "Envío Gratis"), `freeShipping` (envío $0 si el pedido contiene el producto), `onlyTakeaway` (exclusivo para retiro en local), `image` (URL o base64 comprimido), `modifiers` (array de agregados de cocina), `available`/`is_active` y `stock`.
  - **Gestión Dinámica de Categorías (`src/components/CategoryManagementModal.jsx`)**: creación/edición con selector de emojis, prevención de duplicados, reasignación automática de productos huérfanos a categorías de respaldo y actualización en cascada.
  - **Modal de Modificadores y Agregados (`src/components/ItemModifierModal.jsx`)**: chips interactivos para agregados ("Sin cebolla", "Extra Cheddar (+$800)"), stepper de cantidad, notas a cocina y cálculo de total en tiempo real.
  - **Módulo de Menú en Panel Administrador (`src/components/MenuManagement.jsx`)**: cards de productos con switch rápido "Disponible/Agotado", subida de fotos con compresión automática en cliente vía Canvas (JPEG 600px, 80%), filtros por categoría y búsqueda instantánea.
  - **Sincronización Transversal**:
    - `ProductGrid.jsx`: renderizado de tarjetas gastronómicas con fotos, badges, precios tachados y apertura de modificadores.
    - `PosLayout.jsx`: preservación de modificadores y notas en los pedidos locales.
    - `TicketPanel.jsx`: renderizado de modificadores y notas en la comanda de mostrador.
    - `KdsBoard.jsx`: renderizado de agregados y notas en pantalla de cocina en vivo.
    - `printService.js`: impresión de modificadores en comprobantes térmicos.
    - `PublicCatalog.jsx`: cálculo automático de envío gratis, tarjetas ricas con fotos y formato de WhatsApp con detalle de agregados y notas.
    - `products.seed.js`: catálogo inicial auténtico de ComandaFast con 12 productos reales (Promos, Hamburguesas, Lomitos, Panchos, Agregados, Bebidas, Combos).
## [2026-10-07] ingest | GastroPOS Fase 7: Sistema Responsivo Mobile, Ergonomía Táctil y Bottom Sheets (UI/UX Pro Max)
- Implementación de la arquitectura 100% responsiva para smartphones y tablets de mozos, cajeros y cocineros:
  - **Punto de Venta POS Móvil (`PosLayout.jsx` & `TicketPanel.jsx`)**:
    - En pantallas < 768px, el catálogo ocupa 100% de ancho en grilla de 2 columnas táctiles.
    - Barra flotante inferior fija (Sticky Bottom Cart Bar): `🛒 X ítems en comanda · $Total — Ver Comanda ↗` con safe-area padding.
    - Comanda deslizable en Bottom Sheet Drawer (`.mobile-sheet-overlay` + `.mobile-sheet-content`) con manija táctil (`.sheet-drag-handle`), botón de cierre rápido, selectores de canal, cliente, método de pago, calculadora de vuelto con `inputMode="numeric"` y botón de confirmación de 48px de alto.
  - **KDS de Cocina en Móviles (`KdsBoard.jsx`)**:
    - Pestañas de estado móviles (`.kds-status-tabs-mobile`) con badges en tiempo real (`[🟡 Pendientes] [🔵 En Preparación] [🟢 Listos]`).
    - Columna seleccionada a pantalla completa (`.kds-column-hide-mobile`) y botón de avance táctil con altura mínima de 44px.
  - **Ergonomía Táctil y Formularios**:
    - Supresión de 300ms de retraso con `touch-action: manipulation`.
    - Eliminación de auto-zoom en iOS Safari (`font-size: 16px !important` en inputs en móvil).
    - Teclado numérico nativo vía `inputMode="numeric"`.
    - Steppers de cantidad con touch targets ampliados (36×36px / 44px).
  - **Modales en Bottom Sheet (`ItemModifierModal`, `CategoryManagementModal`, `MenuManagement`)**:
    - Anclaje inferior táctil con `.modal-dock-bottom`, bordes redondeados superiores (20px), límite de 92vh y manija de deslizamiento.
  - **Navegación y Header (`App.jsx` & `OperatorPortal.jsx`)**:
    - Viewport con `viewport-fit=cover` para muescas/barras en iOS y Android.
    - Alternancia inteligente de etiquetas completas y compactas (`.desktop-portal-label` / `.mobile-portal-label`).
    - Barra de herramientas del operador con scroll táctil suave.
- Verificación: 87/87 tests pasando en Vitest (18 archivos de prueba, 100% GREEN), `npm run build` exitoso (92 KB gzipped).

## [2026-10-07] ingest | GastroPOS Fase 8: Arquitectura Multi-Dispositivo Universal (Desktop, Tablet, Mobile y Compact)
- Implementación de adaptabilidad total en todas las resoluciones y dispositivos:
  - **Desktop Widescreen (>= 1440px)**:
    - POS Mostrador ampliado hasta 1600px max width y comanda desktop ensanchada a 420px.
    - Grillas de productos de mostrador (`minmax(210px, 1fr)`) y tienda pública (`minmax(260px, 1fr)`).
  - **Desktop Estándar (1024px - 1439px)**:
    - Diseño dual clásico de dos columnas con comanda fija a 380px y supresión de barras flotantes innecesarias.
  - **Tablet e iPad (768px - 1023px, Portrait & Landscape)**:
    - Ocultamiento de barra lateral fija para otorgar 100% del ancho al catálogo de productos (`minmax(165px, 1fr)`).
    - Botón de acceso directo a comanda en la barra superior del catálogo (`.mobile-tablet-ticket-btn`) más barra flotante inferior activa (`.pos-mobile-cart-bar`).
    - KDS de Cocina en 3 columnas simultáneas (`repeat(3, minmax(0, 1fr))`) adaptadas a tablets de cocina sin necesidad de cambiar pestañas.
  - **Mobile Estándar (< 768px)**:
    - Catálogos en 2 columnas táctiles (`.product-catalog-grid` y `.public-catalog-grid`).
    - KPI cards en grilla 2x2 (`.responsive-kpi-grid`) y etiquetas de gráficos responsivas (`.chart-bar-label`).
    - Formularios con teclados nativos (`inputMode="decimal"`, `inputMode="tel"`, `inputMode="numeric"`).
    - Tablas de historial de ventas, arqueos de caja e inventario envueltas en `.responsive-table-scroll` con desplazamiento horizontal suave.
  - **Mobile Compacto (< 480px down to 320px)**:
    - Padding compacto de 0.5rem sin desbordes y touch targets mínimos de 44px garantizados.
- Verificación: 88/88 tests pasando en Vitest (18 archivos de prueba, 100% GREEN), `npm run build` exitoso (92.75 KB gzipped).

## [2026-10-07] ingest | GastroPOS Ajuste de Comanda Desktop y Contención de Viewport
- **Corrección de desbordamiento en panel de comanda (`TicketPanel.jsx` & `tokens.css`)**:
  - Se identificó la causa raíz del desbordamiento en monitores de portátil o ventanas con menor altura vertical (1366×768 / escalado al 125%): el panel `TicketPanel` no contaba con contención de altura (`max-height` sin `overflow-y: auto`), lo que provocaba que los botones de pago, aclaraciones y el botón "Confirmar y Enviar a Cocina" se desbordaran por debajo del borde de la tarjeta y solaparan los enlaces del footer.
  - Se configuró `.pos-sidebar-desktop` con `position: sticky; top: 70px; max-height: calc(100vh - 145px); align-self: flex-start;`.
  - Se aplicó `maxHeight: calc(100vh - 155px)`, `overflowY: 'auto'` y scrollbar fino en `TicketPanel.jsx`.
  - Se optimizaron y compactaron los espacios verticales (canales de venta, selector de clientes, calculadora de vuelto, notas y totales) reduciendo la altura base de reposo de ~670px a ~370px, asegurando que la comanda entre holgadamente en cualquier pantalla y manteniendo el botón de envío y el total siempre contenidos y visibles dentro de la tarjeta.
- **Verificación**: 88/88 tests pasando en Vitest (18 suites, 100% GREEN), `npm run build` exitoso (dist/assets 92.78 KB gzipped).

## [2026-10-07] ingest | GastroPOS Rediseño Ergonómico Integral TPV (Botonera Rápida y Recibo Fijo)
- **Transformación ergonómica de la interfaz de despacho y mostrador (`3785fcc`)**:
  - **Catálogo de Productos (`ProductGrid.jsx`)**:
    - Implementación de **Botonera Rápida TPV (`.pos-fast-grid` & `.pos-fast-item-card`)**: Botones rectangulares horizontales de alta densidad (~72px de alto) con miniatura (44×44px), título, categoría, opciones, precio en grande y botón de suma inmediata en 1 toque. Permite ver más de 20 productos simultáneos sin hacer scroll.
    - Selector persistente de modo de vista: `[⚡ Botonera]` y `[🖼️ Tarjetas]` almacenado en `localStorage`.
    - Pestañas de categorías rápidas enriquecidas con emojis y **contadores de productos en tiempo real** (ej. `🍕 Pizzas (6)`).
    - Buscador ágil con botón de limpieza rápida `✕`.
  - **Panel de Comanda TPV (`TicketPanel.jsx`)**:
    - Arquitectura de recibo TPV con **encabezado y pie fijos** (`overflow: hidden` en el marco exterior): el subtotal, método de pago y el botón de confirmar permanecen anclados y visibles siempre.
    - Zona central de ítems con scroll fluido independiente (`flex: 1 1 auto; overflow-y: auto`).
    - Steppers táctiles con botón de eliminación rápida (`🗑️`) al reducir cantidad a 1.
    - Selector segmentado de 4 canales de venta con feedback activo inmediato.
    - 3 botones de cobro táctiles (`[💵 Efectivo] [💳 Tarjeta] [📱 MP / Transf]`), calculadora de vuelto con atajos de billetes, total final de 1.5rem y botón de acción de 46px.
- **Verificación**: 88/88 tests pasando en Vitest (100% GREEN), `npm run build` exitoso (bundle optimizado de 93.42 KB gzipped).

## [2026-10-07] ingest | GastroPOS Cocina KDS Ergonómica & Sistema de Pedidos ComandaFast
- **KDS de Cocina Ergonómico Profesional (`KdsBoard.jsx`) (`3fbd096`)**:
  - **Modo Pantalla Completa TV (`🖥️ Pantalla Completa`)**: Diseñado para Smart TVs y monitores táctiles de cocina mediante Fullscreen API.
  - **Selector de Tipografía a Distancia (`🔤 Tamaño: Normal / Grande`)**: Modo letra grande para lectura a más de 2 metros desde hornos y parrillas.
  - **Tachado Táctil de Platos Individuales (`Item Check-off`)**: Tocar cualquier plato de una comanda lo tacha con tilde verde (`✅`), permitiendo a los cocineros marcar platos listos a medida que salen.
  - **Resumen en Vivo de Platos en Marcha (`🔥 Kitchen Aggregates`)**: Barra superior en vivo con la suma total de platos en preparación (ej. `4× Muzzarella · 2× Doble Cheddar`).
  - **Semáforo Inteligente de Tiempos**: Verde (<10m), Amarillo (10-20m) y Rojo con alerta visual y badge `⚠️ DEMORADO` (>20m).
  - **Botón Deshacer (`↩️`)**: Permite retroceder el estado de una comanda ante toques accidentales.
- **Sistema de Pedidos Estilo ComandaFast (`orderService.js`, `OrderHistoryPanel.jsx`, `OrderDetailModal.jsx`)**:
  - **Servicio de Pedidos (`orderService.js`)**: Correlativo diario (`#101`, `#102`...), ciclo de vida completo (`pendiente` -> `en_cocina` -> `listo` -> `en_camino` -> `entregado` / `cancelado`), asignación de cadetes, cancelaciones con retorno de stock y generador de mensajes automáticos de WhatsApp.
  - **Libro de Comandas y Dashboard de Pedidos (`OrderHistoryPanel.jsx`)**: Tarjetas KPI (`Total Facturado`, `En Curso`, `Deliveries`, `Ticket Promedio`), pipeline de pestañas con contadores en tiempo real, cambio de estado en 1 clic y botones directos de WhatsApp para avisar al cliente.
  - **Modal de Detalle Completo (`OrderDetailModal.jsx`)**: Vista de ticket digital con desglose de ítems, opciones, datos de reparto, edición de cadete y reimpresión térmica.
- **Verificación**: 96/96 tests pasando en Vitest (19 archivos de prueba, 100% GREEN), `npm run build` exitoso (dist/assets 100.28 KB gzipped).

## [2026-10-07] ingest | Modo Zen de Cocina KDS (Ultra-Densidad para Desktop y Mobile)
- **Modo Zen de Alta Capacidad para Cocineros (`KdsBoard.jsx`, `tokens.css`)**:
  - **Eliminación Total de Distracciones y Menús Innecesarios**: Al activar `🧘 Modo Zen`, la interfaz toma el 100% de la pantalla (`position: fixed; inset: 0; z-index: 9999`), ocultando la barra de navegación global y los menús de pestañas para destinar el espacio completo a los pedidos.
  - **Micro-Barra Superior (38px de alto)**: Sustituye el encabezado pesado por un micro-panel con indicador `🧘 MODO ZEN`, reloj digital en vivo (`🕒 HH:MM:SS`), semáforo de contadores (`🟡`, `🔵`, `🟢`), resumen compacto de platos en marcha (`🔥 Marchando:`), controles rápidos de sonido/fullscreen y botón de salida `✕ Salir Zen` (o tecla `Escape`).
  - **Columnas y Tarjetas Ultra-Densas (Desktop & Tablet)**: Columnas de altura completa con scroll independiente y tarjetas de diseño compacto que incrementan la cantidad de pedidos visibles simultáneamente en pantalla (hasta 15-20 comandas sin scrollear).
  - **Ergonomía Táctil Adaptada a Mobile (< 768px)**:
    - Micro-barra de 34px y selector de pestañas ultra-delgado (`🟡 Pend`, `🔵 Cocina`, `🟢 Listos`, `📋 Todas`).
    - Opción de flujo continuo (`📋 Todas`) para visualizar toda la cola de pedidos por orden de urgencia/espera.
    - Tarjetas compactas con botones de avance táctil amplios para el pulgar y tachado de ítems de 1 toque.
  - **Persistencia en LocalStorage**: Mantiene el estado del Modo Zen al refrescar la pantalla en terminales y Smart TVs de cocina.
- **Suite de Pruebas**: 98/98 tests pasando en Vitest (19 archivos, 100% GREEN), `npm run build` exitoso (dist/assets 101.75 KB gzipped).

## [2026-10-07] ingest | GastroPOS Clonación Completa de Carta ComandaFast y Suite Total de Bot WhatsApp
- **Sistema de Modificadores Dinámicos con Recargo de Precio (`ItemModifierModal.jsx`) (`e959360`)**:
  - Función `parseModifierExtra(modStr)` con parsing regex para patrones `(+800)`, `(+$800)`, `+800`, `+$2.000`.
  - Cálculo en tiempo real de precio unitario dinámico (`unitPrice = basePrice + extraModifiersPrice`) y total (`unitPrice * quantity`).
  - Badges visuales claros de `+$X` en cada chip de modificador para informar al usuario de los adicionales de cocina.
  - El payload despachado a la comanda o carrito incluye `basePrice`, `extraModifiersPrice` y `price: unitPrice` para exactitud contable en tickets, cocina y facturación.
- **Suite Integral y Finalización del Bot de WhatsApp (`botService.js`, `whatsappBotServer.js`, `BotPanel.jsx`)**:
  - **Motor Conversacional de Pedidos Automáticos (`parseOrderFromMessage`)**: Reconoce platos solicitados en lenguaje natural (ej. *"Hola quiero 2 burger clásica para enviar a San Martín 450"*), detecta cantidades, calcula subtotales, aplica delivery y bonificación por envío gratis, y registra automáticamente pedidos oficiales `#10X` en `orderService`.
  - **Generador de Recibos de WhatsApp**: Responde con el desglose exacto de ítems, precios, dirección, tiempo estimado de entrega e instrucciones de seguimiento en vivo con `*#10X*`.
  - **Backend Server Sincronizado**: `server/whatsappBotServer.js` delega en `processBotMessage` compartiendo la misma inteligencia entre el servidor Express (puerto 3002) y el frontend en navegador, con endpoint `/api/bot/webhook/qr` para el emparejamiento.
  - **Panel de Control del Bot de 4 Pestañas (`BotPanel.jsx`)**:
    1. *Simulador WhatsApp*: Teléfono interactivo con chips rápidos de prueba y chat en tiempo real.
    2. *Conectar WhatsApp & QR*: Pantalla de emparejamiento con código QR para WhatsApp Web y guía paso a paso.
    3. *Configuración & Respuestas*: Personalización de datos de la línea, saludos, mensajes fuera de horario, mensajes de derivación humana, costo y tiempos de delivery.
    4. *Registro de Notificaciones*: Bitácora de avisos automáticos despachados a clientes en cada cambio de estado de comandas.
- **Verificación**: 100/100 tests pasando en Vitest (19 suites, 100% GREEN), `npm run build` exitoso (dist/assets 105.63 KB gzipped).

## [2026-10-07] ingest | Migración Completa de ComandaFast (Flujos, Variables, Panel Admin, Promos de Carta y Live Monitor)
- **Flujos Conversacionales y Builder Visual (`AdminBotFlowsTab.jsx`, `custom_flows.json`, `chatbotService.js`) (`9f3562b`)**:
  - Diseñador visual e interactivo de flujos con disparadores por palabras clave, tipo de coincidencia (`contains_any`, `exact`, `starts_with`), alcance (`always`, `idle_only`, `active_order`) y prioridad.
  - Acciones con texto dinámico con reemplazo de variables, imágenes adjuntas y botones/chips de acción rápida.
  - Endpoints REST en backend Express (`GET /api/flows`, `POST /api/flows`) sincronizados con persistencia local y cloud.
- **Variables Dinámicas del Bot y Plantillas (`AdminBotVariablesTab.jsx`, `bot_variables.json`, `bot_templates.json`)**:
  - 20+ variables de negocio, pagos, delivery y mensajes (`nombre_local`, `direccion`, `horarios`, `telefono_contacto`, `catalogo_url`, `alias_banco`, `banco`, `titular`, `cbu`, `cuit`, `descuento_efectivo`, `demora`, `costo_envio`, `envio_gratis_desde`, `mensaje_bienvenida`, `mensaje_demora`, `mensaje_fuera_horario`).
  - Capacidad de creación de variables personalizadas con botón de copia rápida `{variable}`.
  - Interpolación instantánea de plantillas con `interpolateTemplate(template, vars)`.
  - Endpoints REST (`GET/POST /api/bot-variables` y `GET/POST /api/bot-templates`).
- **Portal de Auditoría y Panel de Administrador Completo (`OwnerAuditPortal.jsx` & Pestañas)**:
  - **KPIs Tab (`AuditKpisTab.jsx`)**: Desglose financiero completo, curva de tendencias de ventas en SVG con tooltips, gráfico de barras de distribución horaria, donut de canales (WhatsApp, Mostrador, Salón) y métodos de pago.
  - **Cierres de Turno & Arqueos (`AuditCashShiftsTab.jsx`)**: Historial de turnos con saldo inicial, ingresos, egresos de caja chica, saldo teórico vs contado, diferencia de caja y exportación CSV.
  - **Analíticas de Menú (`AuditMenuAnalytics.jsx`)**: Ranking de ventas, rentabilidad por producto y análisis de modificadores.
  - **Seguridad & Auditoría (`AuditSecurityTab.jsx` & `AuditSecuritySettings.jsx`)**: Registro de cancelaciones de órdenes, reposición de stock, PIN de dueño y cajeros.
  - **Tablas de Base de Datos (`AdminDatabaseTablesTab.jsx`)**: Inspección en vivo de tablas (pedidos, productos, turnos, clientes, variables, flujos), filtrado, visor JSON y exportación CSV/JSON.
  - **WhatsApp Bot Hub (`AdminWhatsAppBot.jsx`)**: Pestañas de Conexión QR, Flujos, Variables, Editor de Plantillas, Seguridad Anti-Bucle e IA Gemini.
- **Sistema de Carta & Promos de ComandaFast (`MenuManagement.jsx`, `CatalogPage.jsx`, `ProductModal.jsx`)**:
  - Modelo con `originalPrice` (precio tachado), `discountBadge` (`25% OFF`, `2x1`), `freeShipping` (bonificación de envío en pedido) y `onlyTakeaway`.
  - Subida de imágenes con compresión automática en cliente vía Canvas (600px max, 80%).
  - Categorías dinámicas con selector de emojis.
- **Monitor en Vivo de WhatsApp (`WhatsAppLiveMonitor.jsx` & `WhatsAppToastAlert.jsx`)**:
  - Monitoreo en tiempo real de chats entrantes, detección de carritos e inyección directa a la comanda o cocina con 1 clic.
  - Alerta sonora y visual tipo Toast en el panel de operadores.
- **Verificación**: 105/105 tests pasando en Vitest (20 suites, 100% GREEN), `npm run build` exitoso (1969 módulos transformados, 128 KB CSS, 819 KB JS).

## [2026-10-09] ingest | AutoARCA Monotributo SaaS (Metodología Superpowers)
- **Planificación y Especificación**:
  - Diseñado bajo la metodología Superpowers: Brainstorming interactivo, clasificación *Architectural*, formalización de especificación en `docs/superpowers/specs/2026-10-09-arca-monotributo-saas-design.md` y plan de ejecución TDD en `docs/superpowers/plans/2026-10-09-arca-monotributo-saas-plan.md`.
- **Esquema de Base de Datos Supabase (`supabase/migrations/20261009000001_arca_saas_schema.sql`, `supabase/schema.sql`)**:
  - 5 tablas relacionales con Row Level Security (RLS) multi-tenant: `profiles`, `business_profiles`, `monotributo_scales`, `sales_receipts`, `daily_batches`.
  - Semillas de escalas oficiales de Monotributo (categorías A a K) con topes de facturación anuales y promedios mensuales.
- **Motor de Exportación ARCA (`src/services/arcaExportService.js`)**:
  - Generación de archivos delimitados CSV/TXT para importación masiva en "Comprobantes en Línea" / Facturador de ARCA (Facturas C, códigos 011, PV de 5 dígitos, concepto 1/2/3, comprobante de 8 dígitos).
  - Validación de topes de consumidor final anónimo con requerimiento obligatorio de DNI/CUIT.
- **Motor de Alertas Fiscales y Semáforo de Monotributo (`src/services/taxAlertEngine.js`, `TaxTrafficLight.jsx`)**:
  - Algoritmo de consumo en tiempo real: cálculo de margen restante en pesos, ventana móvil de 12 meses y proyección de fin de mes.
  - Semáforo cromático preventivo: Verde (<75%), Amarillo (75%-90%) y Rojo (>90%) con alertas críticas de riesgo de recategorización o exclusión.
- **Terminal POS Mobile-First Ergonomía Táctil (`PosTerminal.jsx`, `posTerminal.css`)**:
  - Botonera numérica táctil con touch targets >= 48px, chips rápidos (+ $500, + $1.000, + $2.000, + $5.000), selector de 4 medios de pago y modal inteligente de identificación de receptor.
- **Servicio de Comprobantes y Lotes Diarios (`salesBatchService.js`, `ClientDashboard.jsx`)**:
  - Registro comprobante por comprobante, control estricto de suscripción activa, cierre de jornada manual idempotente con descarga inmediata de lotes ARCA.
- **Portal Multi-Cliente del Contador (`AccountantPortal.jsx`, `accountantPortal.css`)**:
  - Directorio de clientes con buscador por CUIT/nombre, badge de semáforo fiscal individual, descarga directa del CSV de hoy en 1 clic y empaquetado masivo en archivo ZIP diario (`JSZip`).
- **Panel Global de SuperAdmin (`SuperAdminDashboard.jsx`, `superAdmin.css`)**:
  - Edición en caliente de las escalas A a K de Monotributo con sincronización instantánea a todos los clientes sin redeployar código.
  - Control de estados de suscripción de clientes (`active`, `trial`, `past_due`, `cancelled`) con bloqueo automático en el POS para cuentas en mora.
- **Supabase Edge Functions y Envío por Email (`dailyClosureCronService.js`, Edge Functions)**:
  - Función de cron nocturno (`daily-closure-cron`) a las 23:59 ART y despacho de correos transaccionales con archivo ARCA adjunto vía Resend API.
- **App Shell y PWA (`App.jsx`, `manifest.json`, `index.html`)**:
  - Conmutador de roles dinámico (`client`, `accountant`, `superadmin`), soporte instalable PWA y diseño responsivo mobile-first.
- **Verificación de Calidad**:
  - 41/41 pruebas pasando en Vitest (10 suites, 100% GREEN).
  - Compilación de producción limpia en `npm run build` (86.89 KB gzipped).
