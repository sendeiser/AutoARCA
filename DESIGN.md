# DESIGN.md — Sistema de Diseño Canónico AutoARCA PRO
> **Generado mediante Google Stitch (`stitch::extract-design-md` + `taste-design`)**  
> **Versión:** 1.0.0 (Fintech Fiscal & POS Local-First)  
> **Última actualización:** 2026-10-11  

---

## 1. Atmósfera y Filosofía Visual (Design Atmosphere)

AutoARCA es un SaaS de cumplimiento fiscal y facturación electrónica para Monotributistas y Estudios Contables en Argentina. La experiencia combina la sobriedad y precisión de un instrumento financiero con la ergonomía táctil de un sistema operativo nativo.

| Dimensión de Diseño | Calificación (1–10) | Descripción |
| :--- | :---: | :--- |
| **Densidad de Información** | **7.5 / 10** | *Equilibrado a Denso*. El POS de comercio prioriza botones táctiles amplios (Touch-First), mientras que el Portal del Contador opera con densidad tipo "Cockpit" para matrices de recategorización y calendarios de vencimientos. |
| **Varianza y Asimetría** | **5.5 / 10** | Estructuras en grilla rigurosamente alineadas (evita el desorden visual), con acentos asimétricos en tarjetas de métricas críticas y semáforos fiscales. |
| **Micro-interacciones y Movimiento** | **6.5 / 10** | Transiciones elásticas fluidas en cambios de pestañas (segmented controls), feedback háptico/acústico con `soundService` y elevación sutil en hovers. |
| **Estética Base** | — | **Apple Human Interface Guidelines (HIG)** con terminación **OLED Dark Glassmorphism** y modo diurno **Untitled UI Clean Minimal**. |

---

## 2. Paleta de Colores y Tokens Semánticos

### 2.1 Paleta Modo Oscuro (OLED Dark — Predeterminada)
- **Fondo Base (`--apple-bg-base`)**: `#000000` con micro-degradados radiales de luz azul/verde (`rgba(10, 132, 255, 0.09)` y `rgba(48, 209, 88, 0.07)`).
- **Superficie Secundaria (`--apple-bg-secondary`)**: `#1c1c1e` (Paneles de control y tarjetas).
- **Superficie Terciaria (`--apple-bg-tertiary`)**: `#2c2c2e` (Inputs, selectores y contenedores anidados).
- **Material Traslúcido (`--apple-material-thick`)**: `rgba(28, 28, 30, 0.88)` con `backdrop-filter: blur(20px)`.

### 2.2 Paleta Modo Claro (Daylight Clean)
- **Fondo Base Claro**: `#f8fafc` / `#ffffff` (Blanco puro y pizarra ultra suave).
- **Superficie de Tarjetas**: `#ffffff` con bordes sutiles `rgba(15, 23, 42, 0.08)`.
- **Texto Principal Claro**: `#0f172a` (Slate 900 de alto contraste).
- **Texto Secundario Claro**: `#475569` (Slate 600).

### 2.3 Semáforo Fiscal ARCA (Tax Traffic Light System)
Los colores de alerta fiscal tienen significado regulatorio estricto:

| Estado Fiscal | Hex Primario | Glow / Fondo | Significado en el Sistema |
| :--- | :--- | :--- | :--- |
| **Seguro (Verde)** | `#30d158` (Dark) / `#16a34a` (Light) | `rgba(48, 209, 88, 0.15)` | Consumo anual < 80% del tope de categoría. Emisión libre. |
| **Advertencia (Amarillo)** | `#ffd60a` (Dark) / `#d97706` (Light) | `rgba(255, 214, 10, 0.15)` | Consumo entre 80% y 95%. Próximo a salto de escala o exclusión. |
| **Peligro Crítico (Rojo)** | `#ff453a` (Dark) / `#dc2626` (Light) | `rgba(255, 69, 58, 0.18)` | Consumo > 95% o tope superado. Riesgo inminente de pase a Régimen General. |
| **Acento Tecnológico (Azul/Cian)** | `#0a84ff` (Dark) / `#2563eb` (Light) | `rgba(10, 132, 255, 0.2)` | Enlaces, acciones de sistema, sincronización Supabase. |
| **Identidad Marca (Violeta)** | `#7c3aed` / `#6d28d9` | `rgba(124, 58, 237, 0.25)` | Botones principales de acceso, badges SaaS y portal Untitled UI. |

---

## 3. Tipografía y Jerarquía

El sistema utiliza una tipografía dual optimizada para legibilidad fiscal y financiera:

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif;
--font-mono: "SF Pro Rounded", "SF Pro Display", -apple-system, "Fira Code", monospace;
```

### Reglas Tipográficas Canónicas
1. **Importes Monetarios y CUITs en Monospace**:
   - Todo número que represente dinero (`$ 45.200,00`), alícuotas o CUITs (`20-30123456-7`) debe renderizarse con `font-variant-numeric: tabular-nums` o fuentes monoespaciadas para evitar bailes de caracteres al actualizar en tiempo real.
2. **Encabezados Sin Gritos**:
   - Títulos con `letter-spacing: -0.02em` a `-0.03em`. Peso `700` o `800` en titulares clave sin exceder tamaños desproporcionados (`clamp(1.2rem, 2vw, 1.75rem)`).
3. **Lectura de Etiquetas Fiscales**:
   - Etiquetas auxiliares (`--apple-label-secondary`, `--apple-label-tertiary`) con tamaño mínimo de `0.75rem` (`12px`) para garantizar legibilidad en pantallas bajo luz solar directa en comercios.

---

## 4. Sistema de Superficies, Radios y Elevaciones

### 4.1 Radios de Esquinas (Squircles Estilo Apple)
- **Chips y Badges (`--radius-xs`)**: `8px`
- **Botones e Inputs (`--radius-sm`)**: `12px`
- **Tarjetas y Módulos (`--radius-md`)**: `16px`
- **Modales y Diálogos (`--radius-lg`)**: `22px`
- **Pills y Selectores (`--radius-pill`)**: `9999px`

### 4.2 Materiales y Glassmorphism
- **Bordes de Separación**: `1px solid rgba(255, 255, 255, 0.08)` en Dark Mode; `1px solid rgba(15, 23, 42, 0.08)` en Light Mode.
- **Desenfoque de Fondo**: `backdrop-filter: blur(14px) -webkit-backdrop-filter: blur(14px)`.
- **Efecto de Sombra**: `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.35)` para elevar tarjetas flotantes sobre gráficos de fondo.

---

## 5. Arquitectura de Navegación y Layout Adaptativo

### 5.1 Desktop (Resoluciones >= 768px)
- **Header Superior Unificado (`Header.jsx`)**:
  - Marca `AutoARCA PRO` con el isotipo oficial del escudo metálico con rayo cian.
  - Indicador de estado de conexión híbrida (Local-First / Supabase Cloud).
  - Selector de modo Claro/Oscuro y alternador de audio.
  - Perfil del usuario y botón de cierre de sesión.
- **Segmented Control Principal (`Navbar.jsx`)**:
  - Control de pestañas estilo macOS/iOS en píldora con indicador flotante.
  - Sin duplicación de barras secundarias.
- **Diseño Zero-Scroll**:
  - En la vista POS y paneles analíticos principales, la vista prioriza caber en una pantalla de laptop (1280x800) sin barras de scroll innecesarias.

### 5.2 Mobile (Resoluciones < 768px — Teléfonos)
- **Barra Superior Limpia**: La barra segmentada superior se oculta (`display: none !important`), maximizando el espacio vertical disponible.
- **Bottom Tab Bar Ergonómica (`.navbar-mobile-bottom`)**:
  - Barra fija inferior con área de resguardo (`env(safe-area-inset-bottom)`).
  - Íconos táctiles con tamaño mínimo de interacción de 44x44px.
- **Ancho Total 100% (Horizontal Full-Width)**:
  - Todo el contenido aprovecha el ancho completo (`width: 100%`) eliminando márgenes laterales excesivos.
- **Tablas Convertidas en Tarjetas (Mobile Card Layout)**:
  - Las tablas complejas (cartera de clientes, comprobantes, compras) se transforman automáticamente en tarjetas legibles con disposición clave-valor, eliminando el scroll horizontal incómodo.
- **Aislamiento de Cabecera**:
  - La cabecera del comercio o del contador solo se muestra en la pestaña principal de Dashboard, desapareciendo en los submódulos específicos para centrar el foco del usuario.

---

## 6. Antipatrones Prohibidos (Design Anti-Patterns)

De acuerdo con los estándares de **Google Stitch** y **Taste Design**:

1. ❌ **Prohibido el Negro Puro en Texto**: Nunca utilizar `#000000` para texto en modo claro ni `#ffffff` puro sin opacidad para textos secundarios en modo oscuro.
2. ❌ **Prohibido el Resplandor Neón Excesivo**: No usar cajas con múltiples capas de `box-shadow` hiper-saturadas que cansen la vista del comerciante tras horas de uso.
3. ❌ **Prohibido el Scroll Horizontal en Móviles**: Ninguna tabla o formulario debe forzar el scroll horizontal en teléfonos.
4. ❌ **Prohibidas las Animaciones Bloqueantes**: Toda micro-interacción debe durar entre `150ms` y `250ms` con curvas `cubic-bezier(0.16, 1, 0.3, 1)`.
5. ❌ **Prohibido el Uso de Fuentes Genéricas sin Carácter**: No caer en tipografías por defecto del navegador. Se debe preservar la identidad moderna de Plus Jakarta Sans y SF Pro.

---

## 7. Plan de Acción y Oportunidades de Mejora (Stitch Roadmap)

| Módulo | Diagnóstico Actual | Oportunidad de Mejora con Stitch |
| :--- | :--- | :--- |
| **Terminal POS** | Teclado numérico táctil y cobro rápido eficiente. | Agregar micro-animación de confirmación háptica/visual al emitir ticket (check verde con spring physics). |
| **Dashboard Fiscal** | Semáforo fiscal completo con métricas de recategorización. | Reemplazar barras de progreso estándar por indicadores circulares tipo Apple Watch Health Rings para los topes de ARCA. |
| **Portal Contador** | Matriz de recategorización y calendario CUIT en cards. | Incorporar filtros por badges rápidos de 1-click (ej. *"Solo en Alerta Roja"*, *"Vencen hoy"*). |
| **Cruce Bancario** | Detección de discrepancias con acreditaciones. | Visualización gráfica de dispersión entre facturado vs acreditado en cuenta. |
| **Modo Claro** | Transición completa al 100%. | Pulir micro-contrastes en bordes de modales secundarios para sensación ultra-nítida. |

---
*Este documento `DESIGN.md` constituye la fuente de verdad canónica para todas las iteraciones y mejoras de interfaz del proyecto AutoARCA.*
