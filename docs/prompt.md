# POS Papelería — especificación para construirlo en Laravel

> **Cómo se usa este documento.** Es el prompt maestro de este repositorio. Trabaja **una fase
> a la vez**: «lee `docs/prompt.md` y haz la Fase 2». Cada fase termina en algo que corre en
> local y se puede verificar en el navegador; no arranques la siguiente hasta que los criterios
> de aceptación de la anterior pasen a mano.
>
> **De dónde sale esto.** Este documento reemplaza a una versión anterior
> (`docs/prompt-nextjs-original.md`, conservada como referencia histórica) que especificaba un
> port a Next.js/Vercel/Supabase. Se descartó: el stack elegido ahora es **Laravel**, porque es
> el que domina quien va a mantener y dar soporte a este producto. Las reglas de negocio, el
> modelo de datos y el sistema visual de este documento salen de esa versión y, más atrás
> todavía, de `/home/christopher/ia/posv2` — una app Laravel 11 + Blade + Alpine ya verificada
> en producción que resuelve exactamente este mismo negocio. **`posv2` es referencia de
> patrones, no código para copiar**: este proyecto se escribe desde cero, con Inertia + React
> en vez de Blade+Alpine, y con algunas mejoras deliberadas (dinero en centavos enteros de
> verdad, roles sin paquete externo) que no estaban en ninguna de las dos versiones anteriores.
>
> **Uso.** Personal, un negocio de papelería con una o dos sucursales, poco volumen. **Un solo
> negocio, sin multi-tenencia** — esto corre en local, para que su dueño lo use y lo pruebe él
> mismo un tiempo. Prioriza claridad y que sea fácil de mantener por una sola persona sobre
> escalabilidad o arquitectura para hipotéticos clientes futuros.
>
> **Todo el texto de la interfaz va en español**, en tono llano de mostrador («Cobrar», no
> «Procesar transacción»). Los identificadores de código van en inglés; los de base de datos,
> en inglés también, para no mezclar idiomas dentro de una misma capa.

---

## 1. Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | **Laravel 11, PHP 8.2+** | El stack que su mantenedor domina y puede soportar sin depender de nadie más. |
| Vista | **Inertia.js + React 18 + TypeScript** | Un solo proyecto: los controllers de Laravel devuelven páginas React vía `Inertia::render(...)`, con sesión nativa de Laravel para auth. Sin API REST separada que mantener, sin CORS, sin tokens. Es lo más parecido a los Server Components/Server Actions de la versión Next.js, pero corriendo dentro de Laravel. |
| Base de datos | **MySQL 8 / MariaDB** | Estándar en hosting Laravel, corre igual de bien en local. |
| ORM / migraciones | **Eloquent + migraciones de Laravel** | Nativo del framework; migraciones en PHP revisables antes de correr. |
| Sesión / login | **Sesión nativa de Laravel** (cookie cifrada, `httpOnly`) | Login por **usuario y contraseña** y por **PIN** (§5), ambos contra la tabla `users` del propio proyecto — no hace falta Auth.js ni JWT, Laravel ya resuelve sesión, CSRF y cookies de forma segura por defecto. |
| Autorización | **Policies + Gates nativos de Laravel**, sin `spatie/laravel-permission` | Dos roles fijos (`admin`, `cajera`) no justifican un paquete pensado para permisos dinámicos. |
| Estilos | **Tailwind CSS v3** con la configuración de §4 | La configuración ya existe y está afinada; se copia tal cual — es diseño, no depende del framework. |
| Estado del punto de venta | **React state local (`useReducer` o Context)** en el componente del carrito | El carrito es la única pantalla con estado de cliente de verdad; no hace falta Zustand ni Redux para una sola pantalla. |
| Validación | **Form Requests de Laravel** en el borde de cada acción del servidor | Nunca confíes en lo que llega del cliente. Los errores de validación llegan a React automáticamente como props de Inertia. |
| PDF del ticket | **`barryvdh/laravel-dompdf`, en el servidor** | Sin restricción de Vercel que evitar: una vista Blade se convierte a PDF directamente. Es la única vista Blade real de todo el proyecto. |
| PDF de AcomodaImpresion | **pdf-lib, en el navegador** | No es una limitación de hosting: es una decisión de privacidad y rendimiento (§6) que se mantiene sin cambio. |
| Pruebas | **Pest** (lógica PHP pura: dinero, folios, cálculo de venta), **Vitest** (el motor de retícula en TypeScript), **Playwright** (dos o tres flujos críticos) | La lógica de dinero, folios y retícula de impresión sí se prueba; los formularios CRUD no lo necesitan. |

**Dependencias que NO debes agregar:** librerías de componentes (shadcn, MUI, Chakra),
librerías de tablas, `spatie/laravel-permission`, Zustand/Redux, `moment` (usa Carbon, ya viene
con Laravel). El diseño de §4 es a medida y una librería de componentes pelearía con él en cada
pantalla.

**Punto de partida sugerido para la Fase 0:** `laravel/breeze` con `--stack=react` genera un
esqueleto Inertia + React + Tailwind + auth ya funcional, que ahorra el andamiaje repetitivo.
Se usa solo como punto de partida: el login que trae (email + contraseña) se reemplaza por el
de §5 (usuario/contraseña + PIN), y el Tailwind que trae se reemplaza íntegro por el de §4.

### 1.1 Concurrencia: lo que sí importa aunque todo corra en un solo servidor

La versión Next.js tenía una sección entera de restricciones de Vercel (sin sistema de
archivos, sin procesos de fondo, funciones efímeras en instancias distintas). Casi ninguna
aplica aquí: Laravel corriendo en local tiene sistema de archivos, procesos persistentes y
estado de servidor si hiciera falta. Pero **una cosa se mantiene igual y no es negociable**:
dos pestañas del navegador, o dos cajas registrando ventas al mismo tiempo, siguen siendo
**dos requests concurrentes contra la misma base de datos**. Eso es suficiente para que dos
ventas al mismo segundo generen el mismo folio o dejen el stock en negativo si el código no lo
previene explícitamente. Por eso §7.3 y §7.4 siguen resolviéndose con consultas atómicas dentro
de una transacción, exactamente con el mismo espíritu que en la versión Next.js — la causa ya
no es "instancias serverless distintas", es simplemente "dos requests HTTP al mismo tiempo",
que puede pasar en cualquier servidor, local o no.

---

## 2. Reglas transversales

Aplican a todas las fases. Si una fase las contradice, gana esta sección.

**Dinero.** En MySQL, `BIGINT` guardando **centavos como entero**, nunca `decimal`. En PHP,
**toda la aritmética se hace en centavos con enteros**, nunca con floats: `2.10 + 4.20 !== 6.30`
en coma flotante y esa diferencia termina en un corte de caja descuadrado. Escribe
`app/Support/Money.php` con métodos estáticos `toPesos(int $centavos): string`,
`toCents(string $texto): int` y `format(int $centavos): string` (con símbolo y separador de
miles), y úsalo en todos lados. La conversión ocurre exactamente en dos fronteras: al leer/
escribir en la base (que ya es un entero, no hay conversión real) y al pintar/parsear en la
interfaz. Cantidades (`quantity`, `stock`) sí son `decimal(12,3)`, porque pueden ser
fraccionarias (metros, kilos).

**Fechas.** MySQL no tiene `timestamptz`: guarda `datetime` siempre en **UTC**, sin excepción,
y conviértelo explícitamente al leer con Carbon
(`Carbon::parse($valor, 'UTC')->setTimezone(config('pos.timezone'))`). La zona horaria de
presentación y de corte de día vive en `config('pos.timezone')`, con valor por defecto
`America/Mexico_City`. «Ventas de hoy» significa el día natural en esa zona, nunca la del
servidor ni UTC crudo.

**Redondeo.** Media unidad hacia arriba (`round()` de PHP sobre centavos enteros) y solo al
final del cálculo, nunca en pasos intermedios.

**Errores.** Las acciones del servidor (métodos de Controller que mutan datos) nunca dejan
escapar una excepción cruda a React. Los errores de validación (Form Request) llegan como
`errors` de Inertia de forma automática. Los errores de negocio (turno ya abierto, sin
existencia, pago insuficiente) se lanzan como excepciones propias
(`App\Exceptions\InsufficientStockException`, `ShiftAlreadyOpenException`,
`InsufficientPaymentException`, …) capturadas por el manejador de excepciones de Laravel y
convertidas en `back()->with('error', 'Mensaje en español apto para mostrarse.')`, que la
página React lee de `usePage().props.flash.error`.

**Autorización.** Se verifica **en cada Controller/acción**, del lado del servidor, comparando
contra la sesión — nunca confiando en lo que la interfaz oculta o muestra. Escribe un middleware
`EnsureRole` (`Route::middleware('role:admin')`) y Policies de Laravel
(`ProductPolicy`, `ShiftPolicy`, `SalePolicy`, `ReportPolicy`) para autorización a nivel de
registro (p. ej. "una cajera solo ve sus propios turnos").

**Acceso a datos.** Todo pasa por Eloquent o por las consultas atómicas explícitas y
documentadas de §7.3/§7.4 — nunca una query cruda fuera de esos dos casos puntuales.

**Accesibilidad.** Objetivo mínimo real: todo se puede operar con teclado (la caja se usa con
teclado, no con mouse), foco visible siempre, contraste AA, y los campos numéricos con
`inputMode="decimal"`.

---

## 3. Roles y permisos

Dos roles. No inventes más.

| | `admin` | `cajera` |
|---|---|---|
| Punto de venta, turnos propios, historial propio | ✅ | ✅ |
| Herramientas (§9 de fases, Fase 6) | ✅ | ✅ |
| Sucursales, usuarios, categorías, productos, inventario | ✅ | ❌ |
| Reportes | ✅ | ❌ |
| Cancelar una venta | ✅ | ❌ |
| Ver turnos y ventas de todos | ✅ | ❌ (solo los suyos) |

Cada usuario pertenece a **una sucursal** (`branch_id`). Un cajero solo ve el inventario y
vende contra el inventario de su sucursal. `role` es un `enum('admin','cajera')` directo en
`users`, no una relación con una tabla de roles.

---

## 4. Sistema de diseño

Esta es la parte del producto que no se improvisa. La estética es **papelería impresa**: papel
bond, tinta, filetes, sellos. Nada de tarjetas flotantes con esquinas redondeadas y sombras
difusas — eso es lenguaje de software genérico y contradice el producto. Este sistema **no
cambia respecto a la versión anterior**: es diseño, no depende del framework.

Copia `tailwind.config.js` tal cual. Nota que **reemplaza** la paleta de Tailwind en vez de
extenderla: si un color no está aquí, no se usa. Eso es intencional y es lo que mantiene la
coherencia sin disciplina.

```js
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./resources/js/**/*.{ts,tsx}', './resources/views/**/*.blade.php'],
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            white: '#FFFFFF',
            papel:     { DEFAULT: '#FAF9F4', hondo: '#F1EFE7' },   // fondo de página; zonas rehundidas
            tinta:     { DEFAULT: '#17212F', claro: '#243347', tenue: '#3A4A61' }, // texto principal, cromo oscuro
            grafito:   { DEFAULT: '#5A6472', claro: '#8A93A1' },    // texto secundario y terciario
            linea:     { DEFAULT: '#E2DFD5', fuerte: '#CFCAB9' },   // filetes; bordes de campo
            boligrafo: { DEFAULT: '#2647D6', hondo: '#1A34A8', tenue: '#EAEDFB' }, // acción primaria, enlaces, foco
            marcador:  { DEFAULT: '#FFE24D', hondo: '#F0CB16', tenue: '#FFF6D1' }, // resaltador: SOLO el total y el ítem activo
            sello:     { DEFAULT: '#BE3A2E', hondo: '#9A2C22', tenue: '#FBEDEB' }, // destructivo, cancelada, sin stock
            visto:     { DEFAULT: '#1C7A52', hondo: '#13583A', tenue: '#E8F4EE' }, // completada, pagado, en stock
        },
        fontFamily: {
            display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            sans: ['"Atkinson Hyperlegible Next"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        },
        extend: {
            fontSize: {
                micro:  ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
                fino:   ['0.75rem',   { lineHeight: '1.125rem' }],
                base:   ['0.875rem',  { lineHeight: '1.375rem' }],
                cuerpo: ['1rem',      { lineHeight: '1.5rem' }],
                titulo: ['1.375rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
                cifra:  ['2rem',      { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
                total:  ['2.75rem',   { lineHeight: '3rem', letterSpacing: '-0.02em' }],
            },
            borderRadius: { DEFAULT: '2px', sm: '1px', md: '3px', lg: '4px' },
            boxShadow: {
                impresa: '0 1px 0 0 #E2DFD5, 0 2px 0 0 rgba(23, 33, 47, 0.04)',
                alzada:  '2px 3px 0 0 rgba(23, 33, 47, 0.10)',
                cinta:   '3px 4px 0 0 rgba(23, 33, 47, 0.07)',
                none: 'none',
            },
            spacing: {
                renglon: '2.75rem', // 44px: altura de fila del libro rayado
                tecla:   '3.5rem',  // 56px: alto mínimo de tecla del teclado numérico
                cinta:   '25rem',   // 400px: ancho de la cinta del ticket
            },
            zIndex: { cajon: '40', capa: '50', aviso: '60' },
            transitionDuration: { avance: '120ms' },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
```

**Reglas de uso que no se ven en la configuración:**

- `marcador` (el amarillo) es un resaltador, no un color de marca: aparece **solo** en la cifra
  del total a cobrar y en el renglón activo del carrito. Si aparece en un tercer lugar, ya se
  perdió.
- El escalón `total` (2.75rem) existe por una razón física: la cifra tiene que leerse desde el
  otro lado del mostrador. No lo uses para nada más.
- Los radios son casi cero a propósito: es papel cortado, no una tarjeta de software.
- Las sombras no tienen difuminado: son un filete y un desplazamiento seco, como tinta impresa.
- Tipografía: `display` (Archivo) para títulos y cifras, `sans` (Atkinson Hyperlegible) para
  cuerpo e interfaz, `mono` (IBM Plex Mono) para folios, códigos, cantidades y tickets.

**Fuentes:** autoalojadas en `public/fonts/` como `woff2` variable, con subconjuntos `latin` y
`latin-ext`. Sin `next/font/local` (eso es de Next.js): declara los `@font-face` a mano en
`resources/css/app.css`, con `font-display: swap`, y referencia las familias desde
`fontFamily` de Tailwind. Nada de Google Fonts por CDN.

**Componentes base a escribir primero** (en `resources/js/Components/ui/`, como componentes
React con TypeScript), porque todo lo demás los usa: `Boton`, `Campo` (input con etiqueta y
error), `Selector`, `Aviso` (alerta), `Distintivo` (badge), `Modal`, `EnlaceNav`. Tres variantes
de botón: primaria (`boligrafo`), secundaria (borde `linea-fuerte` sobre blanco), destructiva
(`sello`).

---

## 5. Autenticación

Hay **dos formas de entrar**, en pestañas dentro de la misma pantalla de login:

1. **Usuario y contraseña** — el camino normal al empezar el día.
2. **PIN de 4 a 6 dígitos** con teclado numérico en pantalla — el camino rápido al cambiar de
   turno, cuando la cajera saliente cierra y la entrante abre en el mismo equipo. Debe
   funcionar tanto con clic como tecleando números en el teclado físico, con Retroceso para
   borrar y Enter para enviar.

**Implementación:**

- Contraseñas y PINs se guardan con **bcrypt** (`Hash::make`, costo 12 — ya es el valor por
  defecto de `config/hashing.php` en Laravel), en columnas separadas (`password`, `pin_hash`).
  Un PIN es una credencial débil: por eso está sujeto a límite de intentos.
- **Límite de intentos** en el login por PIN: 5 intentos fallidos por IP en 15 minutos, con
  respuesta genérica («PIN incorrecto») que no revele si el PIN existe. Guarda los intentos en
  una tabla `login_attempts` (`ip`, `kind` enum `'password'|'pin'`, `attempted_at`), consultada
  en cada intento — no en caché ni en memoria del proceso.
- El PIN es único entre los usuarios activos del sistema (un solo negocio, no hace falta
  scoparlo por sucursal salvo que en el futuro haya más de una instalación compartiendo PINs;
  si dos sucursales comparten equipo, sigue siendo único global porque solo hay un negocio).
- Sesión nativa de Laravel: cookie cifrada, `httpOnly`, `secure` en producción, `SameSite=lax`.
  `SESSION_LIFETIME=720` (minutos → 12 horas), que es más que un turno.
- Middleware `auth` protegiendo todas las rutas salvo `/login`, `/ticket/{token}` (público,
  §6) y los assets estáticos.

La pantalla de login es la primera cara del sistema de diseño: fondo `papel`, la tarjeta con
`shadow-impresa` y borde `linea-fuerte`, el nombre del negocio en `display`, las pestañas como
solapas de carpeta. El teclado del PIN usa la altura `tecla` (56px) y muestra el progreso con
cuadritos, no con asteriscos.

---

## 6. Impresión y PDF

**Ticket de venta.** Dos caminos, ambos disponibles desde la misma pantalla:

1. **Imprimir desde el navegador** con CSS de impresión: una hoja de estilos `@media print` con
   `@page { size: 80mm auto; margin: 0 }` y todo lo que no es el ticket oculto. La cajera manda
   a la impresora térmica con Ctrl+P o con el botón «Imprimir», sobre la misma página React del
   ticket.
2. **Descargar PDF**: un botón que pide al servidor `GET /ticket/{token}/pdf`, que arma el PDF
   con **`barryvdh/laravel-dompdf`** a partir de una vista Blade (`resources/views/tickets/pdf.blade.php`)
   — la única vista Blade de todo el proyecto, porque dompdf necesita renderizar HTML del lado
   del servidor y no tiene forma de consumir una página React directamente.

El ticket también vive en una URL con token opaco (`/ticket/{token}`), pública (sin sesión),
para compartirse por WhatsApp — token aleatorio de 32 bytes guardado en la venta, **no** el id
incremental.

**AcomodaImpresion.** Todo ocurre en el navegador: las imágenes se leen con `FileReader`, la
vista previa es HTML posicionado en absoluto, y el PDF se arma con **pdf-lib en el cliente**
incrustando las imágenes originales. Las imágenes **nunca suben al servidor**. Esto no es un
atajo por límites de hosting: es más rápido, no cuesta almacenamiento, funciona con archivos
grandes, y evita subir fotos de clientes a la nube — esa razón no cambia por dejar Vercel. La
única parte que toca el servidor es la búsqueda en bancos de imágenes (Fase 7), que pasa por una
ruta Laravel que actúa de proxy para esconder las llaves de API.

---

## 7. Modelo de datos

Igual en su lógica de negocio a la versión anterior, escrito ahora como migraciones Laravel, sin
ninguna noción de tenencia (un solo negocio) y con el dinero en centavos como `BIGINT`.

```
branches             id, name, address?, phone?, is_active, timestamps
users                id, name, username(unique), email?, password, pin_hash?,
                     role enum('admin','cajera'), branch_id→branches, is_active, timestamps
product_categories   id, name, description?, is_active, timestamps
products             id, name(index), code?(index), category_id→product_categories(null on delete),
                     cost_price_cents bigint, sale_price_cents bigint,
                     manages_inventory bool default true, expiry_date?, is_active, timestamps
inventories          id, product_id→products(cascade), branch_id→branches(cascade),
                     stock decimal(12,3) default 0, physical_location?, timestamps
                     UNIQUE(product_id, branch_id)
cash_register_shifts id, user_id→users, branch_id→branches,
                     opening_amount_cents bigint, expected_cash_cents? bigint, actual_cash_cents? bigint,
                     difference_cents? bigint, opened_at, closed_at?, status enum('open','closed'),
                     notes?, timestamps
sales                id, ticket_number(unique), public_token(unique, 64 chars),
                     user_id→users, branch_id→branches, shift_id→cash_register_shifts,
                     subtotal_cents bigint, tax_cents bigint default 0, discount_cents bigint default 0,
                     total_cents bigint, total_cost_cents bigint, profit_cents bigint,
                     status enum('completed','cancelled'), notes?, timestamps
sale_items           id, sale_id→sales(cascade), product_id→products,
                     product_name, quantity decimal(12,3), unit_cost_cents bigint, unit_price_cents bigint,
                     discount_cents bigint default 0, subtotal_cents bigint, profit_cents bigint, timestamps
sale_payments        id, sale_id→sales(cascade), method enum('cash','card','transfer'),
                     amount_cents bigint, reference?, timestamps
shift_payments        id, shift_id→cash_register_shifts, method,
                     total_amount_cents bigint, transaction_count default 0, timestamps
folios               branch_id, date, last_number         PRIMARY KEY(branch_id, date)
login_attempts       id, ip, kind, attempted_at
```

Índices que sí importan: `sales(branch_id, created_at)`, `sales(shift_id)`,
`sale_items(sale_id)`, `inventories(branch_id)`, `products(is_active, name)`.

### 7.1 Configuración del negocio

Un archivo `config/pos.php`, leído de `.env` (no una tabla, un solo negocio):

```php
<?php

return [
    'nombre_negocio' => env('POS_COMPANY_NAME', 'Mi Negocio'),
    'prefijo_ticket' => env('POS_TICKET_PREFIX', 'BR'),
    'tasa_impuesto' => (int) env('POS_TAX_RATE_BPS', 0), // basis points: 1600 = 16.00% (IVA)
    'simbolo_moneda' => env('POS_CURRENCY_SYMBOL', '$'),
    'codigo_moneda' => env('POS_CURRENCY_CODE', 'MXN'),
    'pie_ticket' => env('POS_TICKET_FOOTER', '¡Gracias por su compra!'),
    'ancho_ticket_mm' => (int) env('POS_TICKET_WIDTH_MM', 80),
    'timezone' => env('POS_TIMEZONE', 'America/Mexico_City'),
    'metodos_pago' => [
        'cash' => 'Efectivo',
        'card' => 'Tarjeta',
        'transfer' => 'Transferencia',
    ],
];
```

`tasa_impuesto` se guarda en basis points (entero) por la misma razón que el dinero: nunca un
float representando un porcentaje. Los nombres de los métodos de pago se leen **siempre de
aquí**. En la versión Laravel anterior (`posv2`) esto se repetía con `ucfirst()` en varias
vistas y dejaba "Cash" y "Transfer" a la vista del cliente — no se repite ese error.

### 7.2 Cálculo de una venta

Orden exacto, portado sin cambios:

```
subtotalRenglón = precioUnitario × cantidad − descuentoRenglón
gananciaRenglón = subtotalRenglón − (costoUnitario × cantidad)
subtotal        = Σ subtotalRenglón
impuesto         = subtotal × tasaImpuesto
total            = subtotal + impuesto − descuentoGeneral
costoTotal       = Σ (costoUnitario × cantidad)
ganancia         = total − costoTotal
```

Todo en centavos enteros. `unit_cost_cents` y `product_name` se **copian** al renglón al
momento de vender: si mañana cambia el precio o el nombre del producto, el ticket viejo no
debe cambiar.

**Pagos mixtos:** una venta acepta varios pagos (por ejemplo $100 efectivo + $50 tarjeta). Al
guardarlos, cada pago se **recorta al saldo restante**, de modo que el cambio nunca se registre
como ingreso. El cambio a devolver es `Σ pagos − total` y se muestra en pantalla, no se guarda.
Si `Σ pagos < total − 1` (centavo), se rechaza con «El pago es insuficiente.»

### 7.3 Folio del ticket

Formato: `{prefijo}{branchId}-{YYYYMMDD}-{0001}`, por ejemplo `BR1-20260813-0007`.

El contador vive en la tabla `folios` y se incrementa de forma **atómica** dentro de la misma
transacción de la venta. MySQL no tiene `RETURNING`, así que el patrón es
`INSERT ... ON DUPLICATE KEY UPDATE` seguido de una lectura con bloqueo en la misma transacción:

```php
DB::transaction(function () use ($branchId, $prefix, $timezone) {
    $date = CarbonImmutable::now($timezone)->toDateString();

    DB::statement(
        'INSERT INTO folios (branch_id, date, last_number) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE last_number = last_number + 1',
        [$branchId, $date]
    );

    $lastNumber = DB::table('folios')
        ->where(['branch_id' => $branchId, 'date' => $date])
        ->lockForUpdate()
        ->value('last_number');

    $ymd = CarbonImmutable::now($timezone)->format('Ymd');

    return sprintf('%s%d-%s-%04d', $prefix, $branchId, $ymd, $lastNumber);
});
```

Esto debe ocurrir **dentro** de la misma transacción que crea la venta completa (§7.4).

### 7.4 Descuento de inventario

Solo para productos con `manages_inventory = true`. También debe ser atómico — dos ventas
simultáneas del último cuaderno no pueden dejar el stock en −1. MySQL tampoco tiene
`RETURNING` aquí: se verifica `affected_rows`.

```php
$affected = DB::affectingStatement(
    'UPDATE inventories SET stock = stock - ?
     WHERE product_id = ? AND branch_id = ? AND stock >= ?',
    [$qty, $productId, $branchId, $qty]
);

if ($affected === 0) {
    throw new InsufficientStockException($productName, $qty);
}
```

Si no afecta ninguna fila, no había existencia: se aborta la transacción completa y se responde
«Sin existencia suficiente de {producto}.» La venta entera se guarda dentro de **una sola
transacción de Laravel** (`DB::transaction`): venta + renglones + pagos + inventario + folio —
o queda todo, o no queda nada.

### 7.5 Turnos de caja

- Un usuario **no puede tener dos turnos abiertos**. Al intentarlo: «Ya tienes un turno
  abierto.»
- Sin turno abierto **no se puede vender**: la pantalla del punto de venta redirige a abrir
  turno (middleware `EnsureShiftIsOpen`).
- Al abrir se captura el fondo de caja (`opening_amount_cents`).
- Al cerrar se captura el efectivo contado (`actual_cash_cents`) y el sistema calcula:
  ```
  efectivoEsperado = fondoDeCaja + Σ pagos en efectivo de las ventas completadas del turno
  diferencia       = efectivoContado − efectivoEsperado
  ```
  La diferencia se muestra en `visto` si es cero, en `sello` si falta dinero, en `grafito` si
  sobra. Además se congela un resumen por método de pago en `shift_payments` (total y número de
  transacciones), para que el corte no dependa de recalcular ventas históricas.
- Las ventas canceladas **no cuentan** para el efectivo esperado.

### 7.6 Cancelación de venta

Solo `admin`. Marca `status = 'cancelled'` y **devuelve el stock** de cada renglón cuyo producto
maneje inventario. No se borra nada: una venta cancelada sigue en el historial, tachada y con
distintivo `sello`.

---

## 8. Fases

Cada fase se entrega corriendo en local y funcionando. Al terminar, verifica los criterios
**a mano en el navegador**, no solo con pruebas.

### Fase 0 — Andamiaje

Proyecto Laravel 11 (sugerido: `laravel/breeze --stack=react` como punto de partida), Inertia +
React + TypeScript, Tailwind con la configuración de §4, fuentes autoalojadas, MySQL local
configurado, migraciones corriendo, ESLint + Prettier + Pint. Una página en blanco con el fondo
`papel` y un título en `display` basta. `.env.example` completo con las variables de §7.1 más
`DB_*` y las llaves de bancos de imágenes de la Fase 7 (`UNSPLASH_ACCESS_KEY`,
`PEXELS_API_KEY`, `PIXABAY_API_KEY`).

**Aceptación:**
1. `php artisan migrate` corre limpio contra MySQL local.
2. `php artisan serve` + `npm run dev` levantan la app; la página raíz carga con la tipografía
   correcta (no la sustituta del sistema — verifícalo en DevTools).
3. Una tabla de prueba se puede crear y consultar (confirma que Eloquent/migraciones funcionan
   de punta a punta).

---

### Fase 1 — Autenticación

Esquema de `users`, `branches` y `login_attempts`; pantalla de login con las dos pestañas (§5);
middleware `auth` + `EnsureRole`; cierre de sesión. Semilla mínima: sucursal «Principal» y
usuario `admin` / `password` / PIN `1234`.

**Aceptación:**
1. `admin` / `password` entra; contraseña incorrecta muestra error en español y no revela si el
   usuario existe.
2. PIN `1234` entra al mismo usuario, tecleando en el teclado físico y con clic.
3. Al sexto intento fallido de PIN seguido, responde «Demasiados intentos, espera unos minutos».
4. Visitar `/dashboard` sin sesión redirige a `/login`.
5. La cookie de sesión es la de Laravel, `httpOnly` (verifícalo en las herramientas del
   navegador).

---

### Fase 2 — Catálogo y administración

CRUD de **sucursales, usuarios, categorías y productos**, más la pantalla de **inventario** con
ajuste manual de existencias. Todo restringido a `admin`. Layout de la aplicación con navegación
lateral, indicador del usuario y de la sucursal activa.

Detalles portados: al crear un producto con `manages_inventory`, se crea su fila de
`inventories` en **todas** las sucursales con stock 0. El admin puede resetear contraseña y PIN
de un usuario. Un producto nunca se borra si ya tiene ventas: se desactiva (`is_active = false`)
y deja de aparecer en la caja, pero sigue en los reportes históricos.

La pantalla de inventario resalta en `sello-tenue` los renglones con stock ≤ 0 y permite filtrar
por sucursal y por categoría, y buscar por nombre o código.

**Aceptación:**
1. Crear producto, categoría, usuario y sucursal, y editarlos, funciona con validación visible
   en el campo que falla (Form Requests → errores de Inertia).
2. Un usuario `cajera` que visite `/productos` recibe 403, aunque escriba la URL a mano.
3. Ajustar existencia de un producto en la sucursal 1 no afecta a la sucursal 2.
4. Desactivar un producto lo saca del catálogo de la caja sin borrar su historial.

---

### Fase 3 — Turnos de caja

Apertura, cierre y detalle de turno según §7.5. Listado con el turno abierto destacado arriba.
El detalle del turno muestra el resumen (ventas, ingreso, ganancia, canceladas), el desglose por
método de pago y la lista de ventas del turno.

La pantalla de cierre es la que más cuidado necesita: la cajera captura el efectivo contado y
**antes de confirmar** ve el esperado y la diferencia calculada en vivo (estado de React).
Confirmar es irreversible, así que va con modal de confirmación.

**Aceptación:**
1. Abrir turno con fondo $500, no poder abrir un segundo turno.
2. Sin turno abierto, `/caja` redirige a la pantalla de apertura.
3. Cerrar con efectivo contado igual al esperado muestra diferencia `$0.00` en `visto`; con $50
   menos, muestra `−$50.00` en `sello`.
4. Una cajera no ve los turnos de otra cajera; el admin ve todos.

---

### Fase 4 — Punto de venta

**La pantalla más importante del producto.** Layout de dos columnas:

**Izquierda: catálogo.** Buscador que filtra por nombre o código conforme se escribe, filtros
por categoría, y una cuadrícula de productos con toque grande. El catálogo completo de la
sucursal **viaja con la página** en las props iniciales de Inertia: buscar deja de depender de
la red en cada tecla, y si el internet parpadea a media venta la caja sigue armando el ticket
(el filtrado es client-side en React sobre los datos ya cargados). Cada producto muestra nombre,
precio y existencia; los agotados salen atenuados con distintivo `sello`, pero se pueden vender
igual si el negocio lo decide (el bloqueo real está en el servidor, §7.4, y aplica solo a
productos con inventario).

**Derecha: el carrito**, con estética de cinta de ticket (ancho `cinta`, `shadow-cinta`),
estado local en React (`useReducer`). Renglones con cantidad editable, descuento por renglón, y
el renglón activo resaltado en `marcador-tenue`. Abajo, subtotal, descuento general, y **el
total en el escalón `total`** — esa cifra es el ancla visual de toda la pantalla.

**Cobro:** modal con los tres métodos de pago (leídos de `config('pos.metodos_pago')`),
posibilidad de agregar varios pagos, cálculo del cambio en vivo, botones de importe rápido
($50, $100, $200, $500, exacto). Al confirmar, se envía la venta al servidor (§7.2–7.4) y
aparece la pantalla de éxito con el folio, el cambio a devolver en grande y los botones
«Imprimir ticket» / «Nueva venta».

**Teclado.** La caja se opera sin mouse: `F2` enfoca el buscador, `Enter` agrega el primer
resultado, `+`/`−` ajustan la cantidad del renglón activo, `Supr` lo quita, `F12` abre el cobro,
`Esc` cierra cualquier modal. Muestra estos atajos en una barra discreta al pie.

El ticket se ve en `/ticket/{token}` con el CSS de impresión de §6: negocio, sucursal, folio,
fecha, cajera, renglones en `mono`, totales, desglose de pagos, cambio, y el pie de
`config('pos.pie_ticket')`.

**Aceptación:**
1. Vender 3 productos distintos con cantidades distintas descuenta las existencias correctas y
   solo de la sucursal del cajero.
2. Pago mixto de $100 efectivo + $50 tarjeta para un total de $130 guarda dos pagos que suman
   exactamente $130 y muestra $20 de cambio.
3. Intentar cobrar con pago insuficiente muestra el error y **no** guarda nada.
4. Vender el último producto en existencia y, en otra pestaña, intentar venderlo de nuevo:
   la segunda falla con «Sin existencia suficiente» y no deja stock negativo.
5. Dos ventas seguidas generan folios consecutivos sin repetirse.
6. La venta completa se puede armar y cobrar **sin tocar el mouse**.
7. El ticket impreso desde el navegador cabe en 80mm sin cortarse, y el botón «Descargar PDF»
   genera un PDF equivalente vía dompdf.

---

### Fase 5 — Historial, reportes y tablero

**Historial de ventas** con filtros por rango de fechas, sucursal, cajera y estado; detalle de
venta con sus renglones, pagos y ticket; cancelación para `admin` (§7.6).

**Reportes** (solo `admin`): diario, por sucursal y por cajera. Cada uno con rango de fechas,
totales de ingreso, costo, ganancia y número de ventas, y desglose por método de pago. Exportar
a CSV desde el cliente (nada de generar archivos en el servidor), con BOM UTF-8 para que abra
bien en Excel con acentos correctos.

**Tablero** al entrar: ventas de hoy, ganancia de hoy, turno abierto, productos con existencia
baja, y accesos directos a caja y herramientas. Para la cajera, solo lo suyo.

**Aceptación:**
1. El reporte diario de hoy cuadra con la suma de las ventas del historial del mismo día.
2. Cancelar una venta devuelve el stock, la saca de los totales del reporte y la deja tachada en
   el historial.
3. Los reportes usan el día natural de `config('pos.timezone')`, no UTC (verifícalo con una
   venta hecha después de las 6 PM).
4. El CSV abre bien en Excel con acentos correctos (BOM UTF-8).

---

### Fase 6 — Sección Herramientas (el andamio)

Nueva sección `/herramientas`, **visible para los dos roles**, con su propia entrada en la
navegación. Es una vitrina de utilidades del mostrador que va a ir creciendo; esta fase construye
el andamio, no las herramientas.

**Registro extensible.** Una herramienta se declara en un solo lugar y aparece sola en la
vitrina:

```ts
// resources/js/tools/registry.ts
export type Herramienta = {
  id: string;                       // 'acomoda-impresion'
  nombre: string;                   // 'Acomodar impresión'
  descripcion: string;              // una línea, la que se lee en la tarjeta
  icono: ComponentType;             // SVG a trazo, no emoji
  ruta: string;                     // '/herramientas/acomoda-impresion'
  roles: Rol[];                     // ['admin', 'cajera']
  estado: 'lista' | 'beta' | 'proxima';
};

export const HERRAMIENTAS: Herramienta[] = [ /* ... */ ];
```

La vitrina lista las tarjetas filtradas por el rol de la sesión, con las de estado `proxima`
atenuadas y sin enlace. Cada herramienta vive en `resources/js/Pages/Herramientas/{id}/` (React)
y en `resources/js/tools/{id}/` (su lógica pura, probable con Vitest). El filtrado por rol se
repite en el servidor al entrar a la ruta (middleware/Policy) — la vitrina esconde, el servidor
bloquea.

**Contrato de cobro (se define ahora, se conecta después).** Las herramientas que calculan un
precio no cobran por su cuenta. Declaran un cargo con esta forma y ya está:

```ts
// resources/js/tools/contracts.ts
export type CargoHerramienta = {
  concepto: string;         // 'Impresión color 4/hoja'
  cantidad: number;         // 5
  precioUnitario: number;   // en centavos
  origen: { toolId: string; meta: Record<string, unknown> };
};
```

En esta fase existe el tipo y una función `agregarAlCarrito(cargo)` **sin implementar**, detrás
de la bandera `config('pos.cobro_herramientas_enabled')` (`.env`: `POS_COBRO_HERRAMIENTAS=false`).
Cuando se conecte (fase futura), insertará un renglón de servicio en el carrito del punto de
venta sin producto asociado — lo que implicará permitir `product_id` nulo en `sale_items` con
`product_name` obligatorio. **Deja anotada esa migración pendiente, no la hagas todavía.**

Además de AcomodaImpresion (Fase 7), registra como `proxima` estas tres, que están previstas:
**Etiquetas y códigos de barras** (hojas de etiquetas de precio para el catálogo), **Cotizador de
trabajos** (copias, engargolados, enmicados) y **Herramientas de PDF** (unir, dividir, convertir
lo que trae el cliente en USB).

**Aceptación:**
1. Agregar una herramienta de prueba al arreglo la hace aparecer en la vitrina sin tocar
   ningún otro archivo.
2. Una herramienta con `roles: ['admin']` no se ve como cajera, y entrar por URL da 403.
3. Las tres tarjetas `proxima` se ven atenuadas y no son clicables.

---

### Fase 7 — AcomodaImpresion

Port de una aplicación de escritorio WPF/.NET que ya funciona en el negocio. Acomoda varias
imágenes en hojas para impresión, muestra la vista previa, genera el PDF listo para imprimir y
calcula cuánto cobrar. **Los números de abajo son del original y están en uso: no los cambies ni
los redondees.**

Todo corre en el navegador (§6). Ninguna imagen sube al servidor.

#### 7.1 El motor de retícula — una sola fuente de verdad

**Este es el punto crítico del port.** Un solo módulo puro,
`resources/js/tools/acomoda-impresion/layout-engine.ts`, recibe la configuración y la lista de
imágenes y devuelve, para una página dada, los rectángulos ya calculados:

```ts
type Celda = {
  celda: Rect;                 // el rectángulo de la celda
  imagen: Rect | null;         // dónde va la imagen dentro de ella
  imagenId: string | null;
  rotada: boolean;
  deformar: boolean;           // object-fit: fill vs contain
};
celdasDePagina(config: Config, imagenes: Imagen[], pagina: number): Celda[]
```

La vista previa en pantalla y el PDF **consumen ese mismo arreglo**, cambiando solo la escala.
Si duplicas el cálculo, la vista previa y el PDF se van a desincronizar y el cliente va a pagar
por hojas que salieron distintas a lo que vio. Este módulo es el que se prueba con Vitest.

**Unidades.** El original trabaja en 1/96 de pulgada; el píxel CSS es exactamente lo mismo, así
que las fórmulas se copian tal cual:

```
px = pulgadas × 96
px = cm × (96 / 2.54)
```

**Papel** (en pulgadas): `Carta` 8.5 × 11.0, `Oficio` 8.5 × 13.0. Orientación `Vertical` u
`Horizontal`; **horizontal intercambia ancho y alto**. (Mejora bienvenida: agregar `A4`
21.0 × 29.7 cm.)

**Retícula**, con márgenes `ml, mr, mt, mb` y `spacing` en pulgadas:

```
anchoDisponible = anchoPagina − ml − mr − spacing × (cols − 1)
altoDisponible  = altoPagina  − mt − mb − spacing × (rows − 1)
anchoCelda = anchoDisponible / cols
altoCelda  = altoDisponible  / rows
celda(r,c).x = ml + c × (anchoCelda + spacing)
celda(r,c).y = mt + r × (altoCelda  + spacing)
```

Las celdas se generan **por filas** (fila 0 completa, luego fila 1…); ese orden decide en qué
celda cae cada imagen.

**Colocación de la imagen**, tres modos evaluados **en este orden de prioridad**:

1. `usarTamanoFijo` → tamaño fijo en cm (`anchoCm × altoCm`), **centrada** en la celda y
   **deformada** para llenar ese rectángulo.
2. `maximizar` → llena la celda entera, **deformada** (sin respetar proporción). **Es el
   default.**
3. Ninguno → ajuste proporcional centrado:
   ```
   aspectoCelda = anchoCelda / altoCelda
   si aspectoImagen > aspectoCelda:  ancho = anchoCelda; alto = anchoCelda / aspectoImagen
   si no:                            alto  = altoCelda;  ancho = altoCelda × aspectoImagen
   x = celda.x + (anchoCelda − ancho) / 2
   y = celda.y + (altoCelda  − alto)  / 2
   ```

Que los modos 1 y 2 deformen la imagen **no es un error**: es el comportamiento del original
(`Stretch.Fill`) y el negocio lo usa así. Consérvalo.

**Girar** (`rotar`): rotación de 90° sobre el centro de la imagen. Además, en el modo 3 el
aspecto usado en la fórmula se **invierte** (`aspecto = 1 / aspectoImagen`).

**Guías de corte** (`mostrarGuias`): borde punteado de **cada celda** (no de la imagen), trazo
gris, patrón de guiones `4 2`; grosor 1px en pantalla, 0.5px en el PDF.

**Paginación:**
```
celdasPorPagina = rows × cols
totalPaginas    = ceil(totalImagenes / celdasPorPagina)   // mínimo 1
indiceInicial   = pagina × celdasPorPagina
```
Las celdas sobrantes de la última hoja se dibujan **vacías con fondo `#F5F5F5` y borde
`#E0E0E0`**. Si al cambiar de layout la página actual queda fuera de rango, se ajusta a la
última página válida.

#### 7.2 Precios

**Color:** precio *por imagen*, depende de cuántas celdas tiene el layout.

| Celdas por hoja | Precio por imagen |
|---|---|
| 1 | 10.00 |
| 2 | 5.00 |
| 4 | 3.00 |
| 6 | 2.00 |
| 9 | 1.00 |

**Blanco y negro:** precio *por hoja*, default `1.00`.

```
si totalImagenes == 0             → 0
si NO es color                    → ceil(totalImagenes / celdasPorPagina) × precioBN
si es color                       → totalImagenes × precioColor[celdasPorPagina]
si el layout no está en la tabla  → totalImagenes × 10.00   (respaldo)
```

Se muestra como `Total: $0.00` y se recalcula ante cualquier cambio de layout, de cantidad de
imágenes o del interruptor color/BN. Los precios se editan desde la propia herramienta y se
guardan en `localStorage` (son de este equipo, no del negocio).

#### 7.3 Valores por defecto y límites

| Campo | Default | Límite |
|---|---|---|
| Layout | `1 (1×1)` | opciones: 1×1, 1×2, 2×2, 2×3, 3×3 |
| Papel | `Carta` | |
| Orientación | `Horizontal` | |
| Márgenes (4) | `0.0 in` | rango 0.0–1.0, paso ±0.05 |
| Espaciado | `0.1 in` | rango 0.0–1.0, paso ±0.05 |
| DPI | `300` | ver nota |
| Guías de corte | activado | |
| Girar | desactivado | |
| Maximizar | activado | |
| Tamaño fijo | desactivado | default 5.0 × 5.0 cm |
| Color | activado | |

Las etiquetas del selector de layout son literalmente: `1 (1×1)`, `2 (1×2)`, `4 (2×2)`,
`6 (2×3)`, `9 (3×3)`.

#### 7.4 Interfaz

Dos columnas, como el original.

**Izquierda (~280px, con scroll):** sección **Imágenes** (botones `Agregar`, `Buscar`, `Limpiar`
y la cuadrícula de miniaturas reordenables arrastrando, con zona de soltar archivos);
**Configuración** (Layout / Papel / Orientación, un desplegable colapsable «Márgenes y
espaciado (pulgadas)» con los 4 márgenes y el espaciado con botoncitos ▲▼ de ±0.05, DPI, y las
casillas Mostrar guías de corte / Girar imágenes / Maximizar imágenes / Usar tamaño fijo con
ancho y alto en cm); **Presets** (`Guardar` / `Cargar`); **Precios** (interruptor Color /
Blanco y negro, el total, `Configurar precios`); y el botón **`Generar PDF`**.

**Derecha:** la hoja renderizada a escala con celdas, imágenes y guías; abajo
`◀ Anterior` / `Página X de N` / `Siguiente ▶`.

`Limpiar` y `Generar PDF` se deshabilitan sin imágenes; la paginación se deshabilita en los
extremos. Reordenar funciona en dos lugares: arrastrando en la lista lateral, y soltando una
imagen sobre la posición de otra en la vista previa.

#### 7.5 Presets

Guardar y cargar configuraciones en `localStorage`, más **importar y exportar como archivo
`.json`** con este formato exacto, para que los presets de la app de escritorio sigan sirviendo:

```json
{
  "PresetName": "Sin nombre",
  "Rows": 1, "Columns": 1,
  "MarginTop": 0.0, "MarginBottom": 0.0, "MarginLeft": 0.0, "MarginRight": 0.0,
  "Spacing": 0.1,
  "PaperSize": "Carta", "Orientation": "Horizontal",
  "Dpi": 300,
  "ShowCutGuides": true, "RotateImages": false, "MaximizeImages": true,
  "UseCustomImageSize": false, "CustomImageWidthCm": 5.0, "CustomImageHeightCm": 5.0
}
```

#### 7.6 Búsqueda en bancos de imágenes

Tres proveedores en un buscador con combo, en este orden: **Unsplash, Pexels, Pixabay**. Flujo:
elegir proveedor → escribir texto → cuántos resultados (1 a 20, default 4) → buscar → marcar con
casilla → `Agregar` las descarga en tamaño grande y las suma al lote.

Cada proveedor se normaliza a `{ id, previewUrl, largeImageUrl, tags }`:

- **Unsplash:** `GET https://api.unsplash.com/search/photos?client_id={key}&query={q}&per_page={n}`
  → `results[]`, preview `urls.small`, grande `urls.regular`, tags `alt_description`.
- **Pexels:** cabecera `Authorization: {key}`, endpoint de búsqueda de fotos.
- **Pixabay:** `GET https://pixabay.com/api/?key={key}&q={q}&per_page={n}&image_type=photo`
  → `hits[]`, preview `previewURL`, grande `largeImageURL`, tags `tags`.

**Las llaves viven solo en el servidor**, en `config/services.php` / `.env`. La búsqueda pasa
por una ruta Laravel `POST /herramientas/acomoda-impresion/buscar` que hace la petición y
devuelve la lista normalizada; la descarga de la imagen grande también pasa por el servidor
para evitar CORS, y regresa el binario al cliente, que lo mete al lote en memoria. Si falta una
llave, el buscador debe decir `Configura la API Key de {proveedor} para buscar.` en vez de
reventar.

#### 7.7 Mejoras sobre el original

El original tiene estas limitaciones, que en web salen casi gratis. Hazlas:

- **No valida** que el tamaño fijo en cm quepa en la celda: con 20cm en una celda de 5cm la
  imagen se desborda en silencio. Avisa al usuario.
- El **DPI se guarda pero no afecta nada**. O lo aplicas de verdad (resolución de las imágenes
  incrustadas en el PDF) o lo quitas de la interfaz. No lo dejes de adorno.
- Permite **retícula personalizada N×M** además de los cinco layouts fijos, con precio calculado
  por el respaldo de §7.2.

Lo que **no** debes arreglar: el precio de color asume que todas las imágenes van al precio del
layout actual. Es una simplificación deliberada del negocio.

#### 7.8 Aceptación (verifícala a mano, una por una)

1. Subes 5 imágenes con layout `4 (2×2)` → muestra `Página 1 de 2`; la primera hoja con 4
   imágenes y la segunda con 1 imagen y 3 celdas grises.
2. Cambias a `9 (3×3)` → pasa a `Página 1 de 1` y el total va de `5 × 3.00 = $15.00` a
   `5 × 1.00 = $5.00`.
3. Cambias a Blanco y negro con `9 (3×3)` y 5 imágenes → `$1.00` (una sola hoja).
4. Con «Maximizar» activado la imagen llena la celda aunque se deforme; al desactivarlo aparece
   centrada, con proporción correcta y bandas vacías.
5. Con «Usar tamaño fijo» en 5×5 cm y papel Carta vertical, **la imagen mide exactamente 5cm ×
   5cm en la hoja impresa. Mídelo con regla** — es la única prueba real de que la conversión de
   unidades quedó bien.
6. Subes los márgenes a 1.0 pulgada por lado → las celdas se encogen, siguen alineadas y no
   desbordan la hoja.
7. Arrastras la imagen 3 sobre la posición de la 1 → se reordenan y la vista previa lo refleja
   de inmediato.
8. Guardas un preset, cambias toda la configuración, lo cargas → todo vuelve a como estaba,
   incluida la paginación. Un `.json` exportado por la app de escritorio también carga.
9. Buscas «gato» en cada proveedor → llegan miniaturas; seleccionas dos, las agregas y entran al
   lote como imágenes normales.
10. Sin llave de API configurada, el buscador muestra el mensaje y no lanza una excepción.
11. **El PDF generado coincide visualmente con la vista previa, celda por celda.**
12. Con 30 imágenes de 4MB cada una, la vista previa sigue respondiendo (usa miniaturas en
    pantalla y los archivos originales solo al generar el PDF).

---

## 9. Semilla de datos

Un `DatabaseSeeder` (con un `TestDataSeeder` dedicado), idempotente, que deja el sistema usable
de inmediato (`php artisan db:seed`):

- Sucursales: `Principal` y `Sucursal 2`.
- Usuarios: `admin` (rol admin, PIN 1234), `cajera` (rol cajera, PIN 5678, Principal),
  `maria` (rol cajera, PIN 9012, Sucursal 2). Contraseña `password` para los tres.
- Categorías de papelería: Cuadernos, Escritura, Papel, Escolar, Oficina, Arte, Impresión.
- ~40 productos realistas con costo y precio de venta coherentes (margen 30–60%) e inventario
  inicial en ambas sucursales.
- Nada de ventas ni turnos: eso se genera usando el sistema.

---

## 10. Cosas que NO debes hacer

Recopiladas de decisiones ya tomadas en este producto. Si algo aquí te parece mal, dilo antes de
cambiarlo, no después.

- **No cambies los números** de §7.1–7.3 (Fase 7). Salen de una app en uso; inventarlos rompe
  precios reales.
- **No uses la paleta de Tailwind** ni agregues colores fuera de §4.
- **No metas una librería de componentes** ni Zustand/Redux. El diseño es a medida y el carrito
  es una sola pantalla.
- **No calcules dinero con flotantes**, ni en PHP ni en TypeScript.
- **No confíes en el rol del cliente.** Cada acción lo revalida en el servidor (Policy o
  middleware, no solo esconder un botón).
- **No dupliques la lógica de retícula** entre vista previa y PDF.
- **No subas imágenes de AcomodaImpresion al servidor.**
- **No expongas las llaves de Unsplash/Pexels/Pixabay al navegador.**
- **No generes folios contando ventas existentes** (§7.3): siempre la tabla `folios` con
  `INSERT ... ON DUPLICATE KEY UPDATE` dentro de una transacción.
- **No borres registros** con historial: desactiva (`is_active = false`) o cancela
  (`status = 'cancelled'`), nunca `DELETE`.
- **No agregues `spatie/laravel-permission`** ni ninguna capa de tenencia: es un solo negocio.
- **No hagas la Fase N+1** antes de que la Fase N pase sus criterios de aceptación a mano.
