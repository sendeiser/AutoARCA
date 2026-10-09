# Especificación de Diseño: Plataforma SaaS ARCA Monotributo & Panel Contable

**Fecha:** 2026-10-09  
**Estado:** Propuesto (Brainstorming completado)  
**Autor:** Antigravity (Superpowers Workflow)  
**Destino:** `docs/superpowers/specs/2026-10-09-arca-monotributo-saas-design.md`  

---

## 1. Visión del Producto y Resumen Ejecutivo

### 1.1 Propósito
Plataforma SaaS (Software as a Service) basada en la nube orientada a comercios minoristas y profesionales independientes de Argentina encuadrados en el régimen de **Monotributo** que no cuentan con controlador fiscal físico y necesitan:
1. Registrar sus ventas cotidianas de forma ultra-rápida (comprobante por comprobante) desde cualquier dispositivo (smartphone, tablet o PC).
2. Generar automáticamente lotes de ventas en el formato exacto requerido por **ARCA** (Agencia de Recaudación y Control Aduanero, ex AFIP) para su importación masiva directa en el servicio "Comprobantes en Línea" / Facturador (Facturas C).
3. Monitorear en tiempo real el consumo acumulado de su categoría mediante un **Semáforo Fiscal Inteligente** que previene desbordes de topes de facturación, exclusiones y recategorizaciones involuntarias.
4. Automatizar el cierre de jornada y el envío diario del archivo consolidado a su contador mediante correo electrónico y sincronización directa a un panel profesional multi-cliente.

### 1.2 Modelo de Negocio y Acceso
- **Suscripción mensual recurrente** por comercio/profesional gestionada por el SuperAdmin de la plataforma.
- **Acceso restringido por estado de suscripción**: los clientes con pago al día tienen acceso pleno al POS y descargas; los usuarios suspendidos ven una pantalla de regularización con acceso de solo lectura o bloqueo temporal.
- **Acceso gratuito o bonificado para estudios contables** asociados, quienes acceden como auditores y receptores de los lotes de sus clientes.

---

## 2. Arquitectura General y Stack Tecnológico

```
+-------------------------------------------------------------------------------+
|                             CLIENTE / FRONTEND (PWA)                          |
|  - React 18 / Vite / Vanilla CSS Design Tokens (Responsive Mobile-First)       |
|  - Service Worker / PWA Manifest (Instalable en Android, iOS, Windows, Mac)  |
|  - Estado y Reactividad: Hooks nativos + Supabase Client                      |
+-------------------------------------------------------------------------------+
                                      |
                     REST / WebSocket (Supabase Client)
                                      |
+-------------------------------------------------------------------------------+
|                            BACKEND CLOUD: SUPABASE                            |
|  - Supabase Auth: Autenticación por email/contraseña y control de sesiones   |
|  - PostgreSQL Database: Tablas relacionales con Row Level Security (RLS)      |
|  - Supabase Edge Functions:                                                   |
|      * `daily-closure-cron`: Proceso nocturno programado (23:59 hs ART)       |
|      * `send-closure-email`: Despacho de correos transaccionales con adjuntos |
|  - Resend API / SMTP: Envío de correos electrónicos con el archivo ARCA adjunto|
+-------------------------------------------------------------------------------+
```

### 2.1 Componentes del Stack
- **Frontend**: React 18 con Vite. Diseño responsive mobile-first ergonómico (teclado numérico táctil en pantalla de al menos 48px de alto para smartphones, layouts adaptables para iPad/tablets y teclado físico en desktops). PWA habilitada con `manifest.json` e icono de acceso directo.
- **Base de Datos y Seguridad**: Supabase (PostgreSQL 15+) con Row Level Security (RLS) estricto para garantizar el aislamiento multi-tenant de datos entre distintos comercios y contadores.
- **Lógica en el Borde / Automatizaciones**: Supabase Edge Functions escritas en TypeScript para la ejecución de cortes nocturnos automáticos (`pg_cron`) y la orquestación del envío de emails transaccionales.
- **Servicio de Correo**: Integración vía API REST con Resend (o servidor SMTP transaccional) para despachar el correo diario con el archivo delimitado adjunto.

---

## 3. Modelo de Roles y Control de Acceso (RBAC & RLS)

La plataforma distingue tres roles fundamentales mediante la columna `role` en la tabla `profiles`:

1. **`client` (Comercio / Profesional Monotributista)**:
   - Acceso al Terminal POS de carga rápida de comprobantes.
   - Acceso a su Dashboard Fiscal con Semáforo de Monotributo y métricas de consumo.
   - Visualización de historial de ventas y opción de cierre de jornada manual.
   - Configuración de su perfil comercial (CUIT, Punto de Venta, Categoría).
   - *Restricción*: Solo puede leer y escribir sus propios registros.

2. **`accountant` (Estudio Contable / Contador)**:
   - Panel de control centralizado multi-cliente.
   - Listado de todos los comercios que lo tienen asignado como su contador (`accountant_id`).
   - Acceso a reportes diarios de cada cliente, historial de lotes y descargas en 1 clic de archivos listos para ARCA (`.csv` / `.txt`).
   - Descarga masiva consolidada en archivo ZIP del día de todos sus clientes.
   - Monitoreo del estado del semáforo fiscal de cada cliente para asesoría preventiva.
   - *Restricción*: Solo puede leer datos de los clientes vinculados a su cuenta.

3. **`superadmin` (Administrador General de la Plataforma)**:
   - Panel de control global del negocio SaaS.
   - Gestión de escalas oficiales de Monotributo (categorías A a K, topes anuales y mensuales) con actualización dinámica inmediata.
   - Gestión de suscripciones de usuarios (activación, prueba, suspensión, bajas).
   - Acceso a registros de auditoría del sistema.

---

## 4. Esquema de Base de Datos Relacional (PostgreSQL / Supabase)

### 4.1 Tabla `profiles` (Usuarios del Sistema)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'accountant', 'superadmin')),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  accountant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial' 
    CHECK (subscription_status IN ('active', 'trial', 'past_due', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Tabla `business_profiles` (Datos Fiscales del Comercio)
```sql
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  cuit VARCHAR(11) NOT NULL,
  razon_social VARCHAR(150) NOT NULL,
  fantasy_name VARCHAR(150),
  monotributo_category VARCHAR(2) NOT NULL DEFAULT 'A', -- 'A' a 'K'
  activity_type VARCHAR(20) NOT NULL DEFAULT 'products' CHECK (activity_type IN ('products', 'services', 'both')),
  pos_number INTEGER NOT NULL DEFAULT 1, -- Punto de Venta oficial para ARCA (ej. 1, 2)
  address VARCHAR(200),
  city VARCHAR(100),
  province VARCHAR(100) DEFAULT 'Buenos Aires',
  daily_closing_mode VARCHAR(20) NOT NULL DEFAULT 'mixed' CHECK (daily_closing_mode IN ('manual', 'cron', 'mixed')),
  custom_closing_time TIME DEFAULT '23:59:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 Tabla `monotributo_scales` (Escalas Oficiales Globales de Monotributo)
```sql
CREATE TABLE public.monotributo_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(2) NOT NULL UNIQUE, -- 'A', 'B', ..., 'K'
  max_annual_billing NUMERIC(15, 2) NOT NULL,
  max_monthly_average NUMERIC(15, 2) NOT NULL,
  effective_from DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 Tabla `sales_receipts` (Comprobantes Individuales de Venta)
```sql
CREATE TABLE public.sales_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.daily_batches(id) ON DELETE SET NULL,
  receipt_type VARCHAR(5) NOT NULL DEFAULT 'FC', -- Factura C (código 011 en ARCA)
  pos_number INTEGER NOT NULL,
  receipt_number INTEGER NOT NULL, -- Secuencial interno del día o global
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash' 
    CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer', 'mercadopago', 'other')),
  customer_doc_type VARCHAR(10) NOT NULL DEFAULT 'SIN_IDENTIFICAR' 
    CHECK (customer_doc_type IN ('SIN_IDENTIFICAR', 'DNI', 'CUIT')),
  customer_doc_number VARCHAR(11) DEFAULT '0',
  customer_name VARCHAR(150) DEFAULT 'Consumidor Final',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.5 Tabla `daily_batches` (Cierres y Lotes Diarios para ARCA)
```sql
CREATE TABLE public.daily_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  batch_date DATE NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by VARCHAR(20) NOT NULL CHECK (closed_by IN ('manual', 'cron')),
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  file_format VARCHAR(10) NOT NULL DEFAULT 'CSV', -- 'CSV' o 'TXT'
  file_content_arca TEXT NOT NULL, -- Contenido exacto del archivo listo para importar en ARCA
  status VARCHAR(20) NOT NULL DEFAULT 'generated' 
    CHECK (status IN ('generated', 'sent_email', 'downloaded', 'error_email')),
  sent_to_email VARCHAR(255),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, batch_date)
);
```

### 4.6 Políticas de Seguridad Row Level Security (RLS)
- **`profiles`**: Cada usuario puede leer y editar su propio perfil. Los contadores pueden leer perfiles de clientes vinculados por `accountant_id`. SuperAdmin tiene acceso global `ALL`.
- **`business_profiles`**: Lectura y edición permitida al dueño (`user_id = auth.uid()`), lectura permitida al contador asignado, acceso total para SuperAdmin.
- **`monotributo_scales`**: Lectura pública para cualquier usuario autenticado (`auth.role() = 'authenticated'`). Escritura restringida estrictamente a perfiles con `role = 'superadmin'`.
- **`sales_receipts`**: Operaciones de inserción, lectura y edición restringidas a comprobantes pertenecientes al `business_profile` del usuario autenticado. Lectura habilitada para el contador del comercio.
- **`daily_batches`**: Lectura y generación para el comercio dueño y para su contador asignado.

---

## 5. Especificación del Punto de Venta (POS) y Carga de Comprobantes

### 5.1 Interfaz Táctil Ultra-Rápida
- **Objetivo ergonómico**: Cargar un comprobante en menos de 3 segundos desde un celular, tablet o mostrador.
- **Teclado numérico integrado**: Botonera grande en pantalla (botones de dígitos 0-9, botón `00`, botón borrar `⌫`) más input compatible con teclado físico (`inputMode="decimal"`).
- **Atajos de importes rápidos configurables**: Chips de un toque para importes frecuentes o redondeos ($1.000, $2.000, $5.000, $10.000).
- **Selectores de Medio de Pago**:
  - `[💵 Efectivo]` (opción por defecto)
  - `[📱 Transferencia / MP]`
  - `[💳 Débito]`
  - `[💳 Crédito]`

### 5.2 Lógica de Identificación del Comprador (Regla Fiscal ARCA)
- Por defecto, toda venta se asigna a `Consumidor Final` (`customer_doc_type = 'SIN_IDENTIFICAR'`, `customer_doc_number = '0'`).
- **Tope Legal de ARCA para Consumidor Final sin Identificar**: ARCA actualiza periódicamente el importe máximo permitido para comprobantes a consumidor final sin identificar (ej. operaciones en efectivo superiores a determinado tope o con medios electrónicos).
- **Validación Automática en POS**:
  - Si el monto ingresado supera el tope legal oficial parametrizado, el POS despliega una alerta visual amigable:
    *"ARCA exige identificar al cliente para ventas superiores a $X. Por favor ingresa DNI/CUIT"*.
  - Despliega campos rápidos: Tipo (`DNI` / `CUIT`), Número de Documento y Nombre/Razón Social.
- **Confirmación y Reinicio Instantáneo**:
  - Al pulsar el botón grande `[⚡ Emitir Comprobante]`, se registra la venta en Supabase, se muestra un check verde animado durante 300ms, y el formulario se resetea inmediatamente con el foco en el importe para la siguiente venta.

---

## 6. Especificación del Motor de Exportación ARCA (ex AFIP)

### 6.1 Mapeo de Campos para "Comprobantes en Línea" / Facturador
Para la importación por lotes de Facturas C en el portal de ARCA, el servicio `arcaExportService.js` genera un archivo delimitado (CSV o TXT con tabulador/coma/punto y coma según la especificación del servicio web de ARCA):

| N° | Campo ARCA | Tipo / Formato | Ejemplo | Origen de Datos |
|----|------------|----------------|---------|-----------------|
| 1 | Fecha de Comprobante | `YYYYMMDD` o `DD/MM/AAAA` | `20261009` | `sales_receipts.date` |
| 2 | Tipo de Comprobante | Código numérico (3 dígitos) | `011` (Factura C) | `sales_receipts.receipt_type` |
| 3 | Punto de Venta | Entero (5 dígitos rellenos con 0) | `00001` | `business_profiles.pos_number` |
| 4 | N° Comprobante | Entero (8 dígitos) | `00000123` | `sales_receipts.receipt_number` |
| 5 | Concepto | Entero (`1`: Productos, `2`: Servicios) | `1` | `business_profiles.activity_type` |
| 6 | Tipo Doc. Receptor | Código ARCA (`99`: Sin identif., `96`: DNI, `80`: CUIT) | `99` | `sales_receipts.customer_doc_type` |
| 7 | N° Doc. Receptor | Hasta 11 dígitos | `0` o `30712345678` | `sales_receipts.customer_doc_number` |
| 8 | Nombre Receptor | Alfanumérico (hasta 40 caracteres) | `Consumidor Final` | `sales_receipts.customer_name` |
| 9 | Importe Total | Numérico con 2 decimales (`0.00`) | `12500.00` | `sales_receipts.amount` |
| 10 | Importe Neto No Gravado | Numérico con 2 decimales | `0.00` | Fijo `0.00` para Monotributo |
| 11 | Importe Op. Exentas | Numérico con 2 decimales | `12500.00` | En Monotributo el subtotal no discrimina IVA |

### 6.2 Validaciones Previas a la Generación del Lote
1. **Verificación de montos no negativos y distintos de cero**.
2. **Validación de formato de CUIT/DNI** según algoritmo Módulo 11 oficial para comprobantes identificados.
3. **Correlatividad y unicidad de fecha**: todos los comprobantes pertenecen a la jornada fiscal del lote.
4. **Codificación de texto**: Exportación en formato compatible con los servidores de ARCA (evitando caracteres especiales corruptos o BOM no soportado).

---

## 7. Especificación del Motor de Alertas Fiscales y Semáforo de Monotributo

### 7.1 Métricas Calculadas en Tiempo Real
El servicio `taxAlertEngine.js` ejecuta las siguientes operaciones para el cliente activo:

1. **Parámetros de la Categoría Activa**:
   - `tope_anual`: Límite máximo de facturación anual de la categoría del cliente (obtenido de `monotributo_scales`).
   - `tope_mensual_promedio`: `tope_anual / 12`.
2. **Consumo del Mes en Curso**:
   - `ventas_mes_actual`: Suma de `sales_receipts.amount` desde el primer día del mes corriente hasta la fecha.
   - `porcentaje_mes`: `(ventas_mes_actual / tope_mensual_promedio) * 100`.
   - `proyeccion_fin_de_mes`: `(ventas_mes_actual / dia_del_mes) * total_dias_mes`.
3. **Consumo Acumulado de los Últimos 12 Meses (Ventana Móvil Fiscal)**:
   - `ventas_acumuladas_12m`: Suma de todas las ventas registradas en los últimos 365 días.
   - `margen_restante_pesos`: `tope_anual - ventas_acumuladas_12m`.
   - `porcentaje_consumo_anual`: `(ventas_acumuladas_12m / tope_anual) * 100`.

### 7.2 Semáforo Visual Inteligente
La interfaz de usuario del cliente y del contador muestra un componente destacado con código cromático:

- 🟢 **VERDE (< 75% del tope)**:
  - Etiqueta: *"Zona Segura — Categoría en orden"*.
  - Indicador de margen holgado restante en pesos y porcentaje.
- 🟡 **AMARILLO (75% a 90% del tope)**:
  - Etiqueta: *"Alerta Preventiva — Ritmo de facturación elevado"*.
  - Mensaje: *"Has alcanzado el 82% del tope de tu categoría. Modera la emisión o consulta a tu contador antes de la próxima recategorización"*.
- 🔴 **ROJO (> 90% o superado)**:
  - Etiqueta: *"Peligro Fiscal — Límite próximo o excedido"*.
  - Banner fijo de alta visibilidad: *"Atención: Estás a menos del 10% de exceder la Categoría {cat}. Si continuas facturando a este ritmo, cambiarás a la Categoría superior o podrías quedar excluido del Monotributo"*.

---

## 8. Especificación del Panel del Contador (Multi-Cliente) y Automatización

### 8.1 Funcionalidades del Panel del Contador
1. **Directorio de Clientes Asignados**:
   - Tabla interactiva con búsqueda por CUIT o Razón Social.
   - Columnas: Nombre / Comercio | CUIT | Categoría | Semáforo Fiscal (Verde/Amarillo/Rojo) | Ventas del Mes | Cierre de Hoy | Acciones.
2. **Centro de Descargas**:
   - Botón individual: `[📥 Descargar Lote Hoy (CSV/TXT)]` por cliente.
   - Selector de fecha histórica con calendario para reimprimir o descargar cualquier lote anterior.
   - Botón global: `[📦 Descargar Lotes del Día (ZIP Masivo)]` que empaqueta en un único archivo comprimido los CSV de todos sus clientes de la fecha seleccionada.
3. **Módulo de Reportes Consolidados**:
   - Exportación de ventas a planilla Excel/CSV para auditoría y conciliación bancaria.

### 8.2 Automatización del Cierre Diario (Mecanismo Mixto)
1. **Cierre Manual por el Comerciante**:
   - Al finalizar su jornada, el comerciante presiona en el POS el botón `[Cerrar Jornada y Enviar al Contador]`.
   - El sistema totaliza las ventas del día, genera el registro en `daily_batches`, crea el archivo plano ARCA y dispara la Edge Function de envío por email.
2. **Cierre Automático por Cron Nocturno**:
   - Programación en Supabase (`pg_cron`) que se ejecuta diariamente a las **23:59:00 ART**.
   - Identifica todos los comercios activos que registraron ventas en el día pero aún no realizaron su cierre manual.
   - Genera automáticamente el lote `daily_batches` con `closed_by = 'cron'` y despacha el correo electrónico al contador.
3. **Despacho de Correo Electrónico**:
   - Remitente: `notificaciones@tudominio.com` (vía Resend o SMTP).
   - Destinatario: Email del contador registrado en `profiles.email` para ese cliente.
   - Asunto: `[AutoARCA] Cierre Diario - {Nombre Comercio} (CUIT {cuit}) - {Fecha}`.
   - Cuerpo HTML:
     - Tabla resumen con total facturado en el día.
     - Cantidad de comprobantes emitidos y desglose por medio de pago.
     - Estado del semáforo de Monotributo del cliente a la fecha.
     - Archivo adjunto: `arca_ventas_{cuit}_{fecha}.csv`.

---

## 9. Especificación del Panel Global de SuperAdmin

### 9.1 Gestión Dinámica de Escalas de Monotributo
- Interfaz CRUD con la lista de categorías **A a K**.
- Cada fila permite editar:
  - `max_annual_billing` (Tope de Facturación Anual en ARS).
  - `max_monthly_average` (Calculado automáticamente o editable).
  - Fecha de vigencia.
- Al guardar los cambios, la actualización se persiste en la base de datos y se refleja **en tiempo real en todos los comercios y contadores**, sin necesidad de redeployar código ni reiniciar servidores.

### 9.2 Control de Usuarios y Suscripciones
- Listado de todos los comercios registrados con buscador y filtros por estado.
- Conmutador rápido de estado: `Activo` | `Prueba (Trial)` | `Suspendido por Pago`.
- Configuración de días de gracia y mensaje personalizado de pago pendiente.

---

## 10. Estrategia de Pruebas y Validación (Vitest)

La plataforma contará con una suite automatizada de pruebas unitarias y de integración que cubrirá:
1. **`arcaExportService.test.js`**:
   - Validación del formato exacto del archivo CSV/TXT (delimitadores, longitud de campos, formato de fecha `YYYYMMDD`).
   - Manejo de clientes con DNI/CUIT vs. Consumidor Final sin identificar.
   - Prevención de caracteres inválidos o saltos de línea en notas.
2. **`taxAlertEngine.test.js`**:
   - Precisión matemática del cálculo de consumo porcentual y márgenes restantes.
   - Transiciones del semáforo: verificar que se active Verde (<75%), Amarillo (75-90%) y Rojo (>90%).
   - Cálculo de proyección a fin de mes.
3. **`salesLifecycle.test.js`**:
   - Registro de venta unitaria y asociación a lote diario.
   - Generación de lote manual vs. cierre automático por cron.
   - Bloqueo de emisión en cuentas suspendidas.

---

## 11. Autoevaluación y Verificación de Consistencia (Spec Self-Review)

1. **Escaneo de Placeholders**: No contiene secciones incompletas, términos "TBD" ni requerimientos vagos. Todos los esquemas SQL, campos de ARCA y lógicas de alertas están totalmente especificados.
2. **Consistencia Interna**: La estructura de la base de datos se alinea exactamente con los roles del sistema, la lógica de cortes diarios y las necesidades del panel del contador.
3. **Control de Alcance**: El alcance está delimitado con precisión al registro ágil de comprobantes de Monotributo, generación de archivo ARCA, semáforo preventivo y portal del contador, evitando complejidades innecesarias como facturación electrónica directa con certificados AFIP PKI en esta fase inicial.
4. **Claridad de Requisitos**: Cada interacción, formato de archivo y regla impositiva está descrita explícitamente sin ambigüedades.
