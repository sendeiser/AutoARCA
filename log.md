# Registro de Operaciones de la Wiki (`log.md`)

Registro cronológico y auditable de todas las operaciones ejecutadas en la wiki (`ingest`, `query`, `lint`). Formato de cabecera: `## [YYYY-MM-DD] operación | Descripción`.

---

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
