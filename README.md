# AutoARCA

> **Plataforma SaaS en la nube para comercios y profesionales monotributistas sin controlador fiscal**  
> Registro rápido de ventas, generación automatizada de archivos para carga masiva en **ARCA** (ex AFIP), monitoreo en tiempo real con **Semáforo Fiscal Preventivo** y panel profesional multi-cliente para contadores.

---

## ⚡ Características Principales

- **📱 Punto de Venta (POS) Táctil Ultra-Rápido**:
  - Diseñado con ergonomía táctil mobile-first (touch targets $\ge 48$px).
  - Carga ágil comprobante por comprobante en menos de 3 segundos.
  - Atajos rápidos de billetes (+ $500, + $1.000, + $2.000, + $5.000) y 4 medios de pago (Efectivo, Transferencia/MP, Débito, Crédito).
  - Detección inteligente de topes legales de ARCA para ventas a consumidor final anónimo con solicitud de DNI/CUIT.

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

- **Frontend**: React 18, Vite, CSS Tokens (Mobile-First / PWA).
- **Backend / Persistencia**: Supabase (PostgreSQL 15+, Auth, Row Level Security multi-tenant, Edge Functions).
- **Herramientas**: Vitest, JSZip, Resend API / SMTP.

---

## 🚀 Instalación y Puesta en Marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/sendeiser/AutoARCA.git
cd AutoARCA

# 2. Instalar dependencias
npm install

# 3. Iniciar entorno de desarrollo
npm run dev

# 4. Ejecutar pruebas automatizadas
npm test

# 5. Compilar para producción
npm run build
```

---

## 🧪 Pruebas Automatizadas

La plataforma cuenta con 41 pruebas unitarias y de integración pasando al 100%:
- Esquema DDL y políticas RLS de Supabase.
- Motor de exportación ARCA y validación de comprobantes.
- Motor de cálculo y umbrales del semáforo fiscal.
- Ciclo de vida e idempotencia de comprobantes y lotes.
- Componentes táctiles POS, Semáforo visual, Portal del Contador, SuperAdmin y App Shell.

---

## 📄 Licencia

MIT © [sendeiser](https://github.com/sendeiser)
