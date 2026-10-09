# AutoARCA

> **Plataforma SaaS en la nube para comercios y profesionales monotributistas sin controlador fiscal**  
> Registro rápido de ventas, generación automatizada de archivos para carga masiva en **ARCA** (ex AFIP), monitoreo en tiempo real con **Semáforo Fiscal Preventivo** y panel profesional multi-cliente para contadores.

---

##  Diseño Apple Human Interface Guidelines (HIG)

La interfaz de usuario ha sido rediseñada bajo las directrices oficiales de **Apple Human Interface Guidelines (HIG)** e interfaces nativas iOS / macOS:
- **Tipografía San Francisco / SF Pro Display**: Jerarquía visual limpia con tipografía monoespaciada con soporte `tabular-nums` para display monetario sin desplazamientos.
- **Paleta iOS OLED Dark Mode**: Fondos negros profundos (`#000000`), capas de materiales con translucidez esmerilada (`backdrop-filter: blur(28px) saturate(190%)`) y colores de sistema Apple (System Blue, System Green, System Orange, System Red).
- **Curvatura Continua (Squircles)**: Radios de esquina orgánicos en tarjetas, modales y botones de acción.
- **Botonera Táctica Ergonométrica**: Teclado POS de calculadora con compresión de resorte (`active: scale(0.92)`), respuesta de audio táctil y botón de emisión principal estilo Apple Pay.
- **Segmented Controls**: Controles de navegación de pestañas con píldora flotante integrada.

---

## ⚡ Características Principales

- **📱 Punto de Venta (POS) Táctil Ultra-Rápido**:
  - Diseñado con ergonomía táctil mobile-first (touch targets $\ge 48$px).
  - Carga ágil comprobante por comprobante en menos de 3 segundos.
  - Atajos rápidos de billetes (+ $500, + $1.000, + $2.000, + $5.000) y 4 medios de pago (Efectivo, Transferencia/MP, Débito, Crédito).
  - Detección inteligente de topes legales de ARCA para ventas a consumidor final anónimo con solicitud de DNI/CUIT.

- **☁️ Supabase Cloud & Sincronización Local-First**:
  - Conectado a la base de datos PostgreSQL en Supabase (`https://oqwzldvbvdigilcekhmo.supabase.co`).
  - Esquema nuclear con 5 tablas: `profiles`, `business_profiles`, `monotributo_scales`, `sales_receipts`, y `daily_batches`.
  - Tolerancia a fallos: Operación 100% fluida offline con cola de sincronización en segundo plano.
  - Monitor de estado en vivo en la barra de navegación con modal de diagnóstico y latencia.

- **📄 Motor de Exportación Oficial ARCA (Facturas C)**:
  - Generación de archivos delimitados CSV/TXT listos para importación masiva directa en el portal "Comprobantes en Línea" o Facturador de ARCA.
  - Formateo estricto con código `011`, ceros de relleno en Punto de Venta y número de comprobante, concepto y códigos de documento oficial.

- **🚦 Semáforo Fiscal de Monotributo en Tiempo Real**:
  - Cálculo instantáneo de consumo de escala anual (Categorías A a K).
  - Umbrales preventivos:
    - 🟢 **Verde (< 75%)**: Zona Segura.
    - 🟡 **Amarillo (75% - 90%)**: Alerta Preventiva antes de recategorización.
    - 🔴 **Rojo (> 90%)**: Peligro Crítico de salto de escala o exclusión.
  - Desglose de margen restante en pesos y proyección de fin de mes.

- **📑 Portal Multi-Cliente del Contador**:
  - Directorio centralizado de todos los clientes asignados con su estado impositivo y semáforo.
  - Descarga de archivos ARCA diarios con 1 clic por cliente.
  - Descarga masiva consolidada en archivo `.zip` de todos los comercios del día.

- **👑 Panel Global de SuperAdmin**:
  - Gestión en caliente de las escalas oficiales de Monotributo (A a K) con actualización instantánea sin reiniciar servidores ni redeployar.
  - Control de estados de suscripción (`active`, `trial`, `past_due`, `cancelled`) con bloqueo automático en el POS si la suscripción está vencida.

- **⏰ Cierre Mixto & Automatizaciones**:
  - Cierre manual por el comerciante o corte automático programado vía cron diario a las 23:59 ART con despacho de correos y archivo ARCA adjunto.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, Apple HIG Tokens (CSS Vanilla, SF Symbols).
- **Backend / Persistencia**: Supabase (PostgreSQL 15+, Row Level Security multi-tenant, Edge Functions).
- **Herramientas**: Vitest, JSZip.

---

## 🚀 Instalación y Puesta en Marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/sendeiser/AutoARCA.git
cd AutoARCA

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar entorno de desarrollo
npm run dev

# 5. Ejecutar pruebas automatizadas
npm test

# 6. Compilar para producción
npm run build
```

---

## 🗄️ Configuración de la Base de Datos en Supabase

Para inicializar las 5 tablas, políticas RLS y datos semillas (Categorías A a K) en tu proyecto de Supabase:
1. Dirígete al [Supabase SQL Editor](https://supabase.com/dashboard/project/oqwzldvbvdigilcekhmo/sql/new).
2. Abre o copia el archivo `supabase/FULL_SETUP.sql`.
3. Pega el contenido y presiona **Run**. ¡Listo! Todas las tablas, índices y políticas quedarán activas.

---

## 🧪 Pruebas Automatizadas

La plataforma cuenta con **49 pruebas unitarias y de integración pasando al 100% (12 suites)**:
- Integración y salud de base de datos Supabase (`tests/supabaseIntegration.test.js`).
- Esquema DDL y políticas RLS (`tests/supabaseSchema.test.js`).
- Motor de exportación ARCA y validación de comprobantes (`tests/arcaExportService.test.js`).
- Motor de cálculo y umbrales del semáforo fiscal (`tests/taxAlertEngine.test.js`).
- Ciclo de vida e idempotencia de comprobantes y lotes (`tests/salesBatchService.test.js`).
- Componentes táctiles POS, Semáforo visual, Portal del Contador, SuperAdmin y App Shell.

---

## 📄 Licencia

MIT © [sendeiser](https://github.com/sendeiser)
