# Estado del proyecto

Bitácora de dónde quedó el trabajo, qué falta y por qué se tomaron ciertas decisiones. Se
actualiza al cerrar cada fase. La especificación manda: ver [`prompt.md`](prompt.md).

---

## Dónde vamos

| Fase                              | Estado                                                           |
| --------------------------------- | ---------------------------------------------------------------- |
| **0 — Andamiaje**                 | ✅ **Cerrada.** Los 3 criterios de aceptación verificados a mano |
| **1 — Autenticación**             | ✅ **Cerrada.** Los 5 criterios verificados con Playwright       |
| **2 — Catálogo y administración** | ✅ **Cerrada.** Los 4 criterios verificados con Playwright       |
| **3 — Turnos de caja**            | ✅ **Cerrada.** Los 4 criterios verificados con Playwright       |
| **4 — Punto de venta**            | ✅ **Cerrada.** Los 7 criterios verificados con Playwright       |
| 5 — Historial, reportes y tablero | ⬜ Pendiente                                                     |
| 6 — Andamio de Herramientas       | ⬜ Pendiente                                                     |
| 7 — AcomodaImpresion              | ⬜ Pendiente                                                     |

---

## Fase 0 — detalle

Commit `b633b3f` · rama `main`.

### Hecho

- Laravel 13.29 (el estable disponible al momento de crear el proyecto; el prompt decía
  "Laravel 11" como referencia de época, no como versión a fijar a la fuerza).
- Breeze `--stack=react --typescript` como punto de partida (Inertia + React 18 + TypeScript).
  El login/registro por correo que trae Breeze **se reemplaza por completo en la Fase 1** —
  aquí solo se usó como andamiaje, no como auth definitiva.
- Tailwind v3 con el sistema de diseño de §4 copiado tal cual: paleta que **reemplaza** la de
  Tailwind, escalas de tipografía, sombras sin difuminado, spacing `renglon`/`tecla`/`cinta`.
- Fuentes autoalojadas en `public/fonts/` (Archivo, Atkinson Hyperlegible Next, IBM Plex Mono —
  subconjuntos `latin` y `latin-ext`, sin cirílico/vietnamita), declaradas a mano en
  `resources/css/app.css` con `@font-face` + `font-display: swap` (no existe `next/font` fuera
  de Next.js).
- `config/pos.php` con la configuración del negocio (§7.1), leída de `.env`.
- MySQL/MariaDB local (`root`/`root`, mismo patrón que otros proyectos Laravel de esta
  máquina). `SESSION_LIFETIME=720` (12h, un turno completo).
- ESLint (flat config, `typescript-eslint` + `eslint-plugin-react`/`react-hooks` +
  `eslint-config-prettier`) + Prettier (`prettier-plugin-tailwindcss`) + Laravel Pint, los tres
  en verde.
- Página de prueba (`resources/js/Pages/Welcome.tsx`) con fondo `papel` y muestra de las tres
  tipografías — verificada visualmente con una captura de Playwright, no solo por curl.
- Tabla `health_check` creada, insertada, consultada y limpiada a mano vía `tinker`.

### Decisiones / gotchas que no eran obvias

- El `package.json` que genera `breeze:install react` traía un choque de peer-deps: `vite@^8`
  (pedido por `laravel-vite-plugin@3.2`) contra `@vitejs/plugin-react@^4.2` (que solo llega
  hasta vite 7). Se resolvió subiendo `@vitejs/plugin-react` a `^5.2.0` (soporta vite 8) y
  `@types/node` a `^22.12.0` (peer de vite 8). También se quitó `@tailwindcss/vite` (el plugin
  de Tailwind v4): este proyecto usa Tailwind v3 con PostCSS clásico, no la integración de Vite
  de v4.
- `resources/js/app.tsx` traía `import './bootstrap'`, pero ese Laravel 13 no genera
  `resources/js/bootstrap.js` (ni trae `axios` como dependencia) — se quitó el import en vez de
  recrear un archivo que el propio framework ya no usa.
- `AGENTS.md`/`CLAUDE.md` que genera el skeleton de Laravel traen instrucciones para instalar
  `laravel/boost` automáticamente. Se reemplazaron por instrucciones propias del proyecto
  (apuntar a `docs/prompt.md`, las reglas de §10, la regla de usar `/design`) para que una
  sesión futura no instale Boost sin que se le haya pedido.
- `docs/prompt-nextjs-original.md` (la referencia histórica) quedó en `.prettierignore`: un
  `prettier --write .` sin excluirlo reformatea sus tablas Markdown y ensucia el diff de un
  archivo que debe quedarse intacto byte a byte.

### Pendiente para cerrar del todo (no bloquea empezar la Fase 1)

- Laravel Pint/ESLint/Prettier están en verde pero no hay un `composer test`/CI corriendo en
  cada push todavía — no lo pedía la Fase 0, se deja anotado por si se quiere más adelante.

---

## Fase 1 — detalle

Commit siguiente a `97d08e7` · rama `main`.

### Hecho

- Migraciones: `branches` (antes que `users`, por la FK), `users` reescrita al esquema real de
  §7 (`username` único, `email` opcional, `password`, `pin_hash` opcional, `role`
  `enum('admin','cajera')`, `branch_id`, `is_active`; se quitaron `email_verified_at` y
  `remember_token` de Breeze — no hay verificación de correo ni "recordarme" en el prompt) y
  `login_attempts` (`ip`, `kind`, `attempted_at`, sin timestamps de Eloquent).
- Modelos `Branch`, `User` (con `App\Enums\Role` como backed enum para el cast de `role`, y
  `pin_hash`/`password` con cast `'hashed'` — asignar `$user->pin_hash = '1234'` ya lo guarda
  con bcrypt solo) y `LoginAttempt`.
- `EnsureRole` (el `requerirRol` del prompt), registrado como alias `role` en
  `bootstrap/app.php`. Se usa a partir de la Fase 2; esta fase solo lo deja listo.
- Login con dos pestañas en `resources/js/Pages/Auth/Login.tsx`, maquetado primero en `/design`
  (dos artboards: pestaña contraseña y pestaña PIN) antes de escribirlo en React. Estado de
  pestaña 100% cliente (`useState`), sin round-trip al servidor para cambiar de pestaña.
- `LoginRequest` (usuario/contraseña, throttle nativo de Laravel por `username`+IP, mensaje
  genérico "Usuario o contraseña incorrectos.") y `PinLoginRequest` (PIN de 4-6 dígitos, límite
  de 5 fallos por IP en 15 minutos contra la tabla `login_attempts`, mensaje "Demasiados
  intentos, espera unos minutos." en el sexto). El PIN se busca iterando los usuarios activos
  con `Hash::check()` — no hay forma de indexar un hash de bcrypt, y con unas pocas decenas de
  usuarios como mucho, es irrelevante en rendimiento.
- Componentes base de §4 arrancados: `Boton` (tres variantes) y `Campo` (input + etiqueta +
  error), en `resources/js/Components/ui/`.
- Semilla mínima (`DatabaseSeeder`, idempotente con `firstOrCreate`): sucursal `Principal` +
  usuario `admin` / `password` / PIN `1234`.
- Limpieza del andamiaje de Breeze que no aplica a este producto (nada de correo): se borraron
  registro, recuperación/reseteo de contraseña, verificación de email, confirmación de
  contraseña, y la pantalla de perfil — con sus controllers, Form Requests, páginas React y
  tests. `AuthenticatedLayout` se simplificó a una barra mínima (nombre del negocio + usuario +
  cerrar sesión); la navegación lateral real es de la Fase 2, cuando haya algo a lo que navegar.
- Pruebas: 9 Pest/PHPUnit (`tests/Feature/Auth/AuthenticationTest.php`) cubriendo los 5
  criterios de aceptación más casos de borde, corriendo contra una base MySQL de prueba
  (`pos_papeleria_test` — este PHP no tiene `pdo_sqlite`, así que `phpunit.xml` apunta a MySQL
  en vez del `:memory:` que trae Laravel por defecto). Además, **5 pruebas Playwright**
  (`e2e/login.spec.ts`) que ejecutan los 5 criterios de aceptación como los ejecutaría una
  persona: clic en el teclado de PIN, tecleo físico, el sexto intento bloqueado, la cookie
  `httpOnly` leída del navegador real.

### Decisiones / gotchas que no eran obvias

- **PIN único globalmente**, no por sucursal: el prompt lo permite ("si aún no sabes la
  sucursal, hazlo único global") y, al no haber tenencia, coincide con "único entre los
  usuarios activos del sistema" sin código extra.
- **`SESSION_DRIVER=array` en pruebas** (heredado del `phpunit.xml` de Laravel) no impide
  probar que la cookie es `httpOnly`: el driver solo cambia dónde se guarda el contenido de la
  sesión en el servidor, la cookie de sesión se emite igual sin importar el driver.
- Este PHP 8.4 **no tiene la extensión `pdo_sqlite`** (solo `pdo_mysql`), así que el
  `DB_CONNECTION=sqlite`/`:memory:` que trae `phpunit.xml` de fábrica falla con "could not find
  driver". Se apuntó a una base MySQL real (`pos_papeleria_test`, mismas credenciales
  `root`/`root`) — hay que crearla a mano una vez (`CREATE DATABASE pos_papeleria_test`) en
  cualquier máquina nueva antes de correr `php artisan test`.
- Se quitaron `@headlessui/react` y `concurrently` de `package.json`: quedaron sin ningún uso
  real tras borrar `Dropdown.tsx` y el resto del andamiaje de Breeze.
- `e2e/login.spec.ts` limpia `login_attempts` en un `beforeEach` (vía `tinker` con `execSync`)
  para que la prueba del bloqueo de PIN sea repetible — si no, correrla dos veces en menos de
  15 minutos arrancaría ya bloqueada por la corrida anterior. Requiere `php artisan serve
--port=8010` y `npm run dev` corriendo antes de `npm run test:e2e`.

### Pendiente para cerrar del todo (no bloquea empezar la Fase 2)

- No hay CI que corra `php artisan test` / `npm run test:e2e` en cada push — mismo pendiente
  que se anotó en la Fase 0.

---

## Fase 2 — detalle

Commit siguiente a `7e44639` · rama `main`.

### Hecho

- `app/Support/Money.php` (§2): `toCents`/`toPesos`/`format`, todo con enteros — nunca pasa
  por un float, ni siquiera en el parseo. Su contraparte de solo-lectura en el cliente,
  `resources/js/lib/money.ts` (`formatearPesos`/`centavosAPesos`), porque React necesita pintar
  los centavos que llegan por props de Inertia sin ida y vuelta al servidor; el formulario en
  cambio manda el texto tal cual y es `Money::toCents()` quien lo convierte al guardar — la
  "dos fronteras" del prompt se respeta así de los dos lados.
- Migraciones y modelos de `product_categories`, `products` (dinero en `_cents` `BIGINT`,
  `category_id` con `nullOnDelete`) e `inventories` (`UNIQUE(product_id, branch_id)`).
- `InventoryService::provisionForAllBranches()` — se llama al crear un producto con
  `manages_inventory`, y también si una edición lo activa después de haber estado apagado.
  `adjustStock()` fija el valor nuevo (no es un delta).
- CRUD completo de Sucursales, Usuarios, Categorías y Productos + pantalla de Inventario, todo
  bajo el middleware `role:admin` (rutas en español: `/sucursales`, `/usuarios`, `/categorias`,
  `/productos`, `/inventario`, tal como las nombra el criterio de aceptación #2). Nada se borra
  nunca — todo es `is_active` o, en usuarios, restablecer contraseña/PIN por separado
  (`PUT /usuarios/{id}/contrasena` y `/pin`).
- Maquetado primero en `/design` (layout con navegación lateral + el patrón tabla/panel lateral
  en Productos + Inventario con filtros) antes de escribir el React.
- Componentes de §4 que faltaban: `Selector`, `Aviso`, `Distintivo`, `EnlaceNav`.
  `AuthenticatedLayout` ahora tiene la navegación lateral real (solo para `admin`; una cajera
  no la ve) y el indicador de sucursal activa + usuario en la barra superior.
- Semilla completa de §9: dos sucursales, tres usuarios (`admin`/`cajera`/`maria` con sus PINes
  y contraseña `password`), las 7 categorías, y 44 productos con margen 30-60% —
  `InventoryService` los provisiona en ambas sucursales al sembrarlos.
- Pruebas: 8 Pest (`tests/Feature/Admin/AdminManagementTest.php`) cubriendo los 4 criterios de
  aceptación, más una corrida manual con Playwright sobre los mismos 4 criterios con
  interacción real de navegador (capturas incluidas, no solo aserciones).

### Decisiones / gotchas que no eran obvias

- **Bug real que atrapó la verificación con Playwright, no los tests de Pest**: los `Campo`/
  `Selector` de las cuatro pantallas admin no llevaban `name` ni `id`, así que
  `htmlFor`/`id` quedaban ambos `undefined` — la etiqueta nunca quedaba asociada al campo
  (rompe accesibilidad: un lector de pantalla no la anuncia, y clicar la etiqueta no enfoca el
  input). Pest no lo detectó porque las pruebas de Pest pegan directo a las rutas HTTP, sin
  pasar por el DOM. Se corrigió en dos capas: `useId()` de React como respaldo dentro de
  `Campo`/`Selector` (garantiza que SIEMPRE haya una asociación válida aunque el llamador no
  pase nada), y además se agregó `name` explícito en cada campo de las cuatro pantallas. Queda
  como recordatorio para las fases que faltan: una pantalla que "se ve bien" en una captura
  puede seguir rota para teclado/lector de pantalla — conviene interactuar con Playwright
  (`getByLabel`, `getByRole`), no solo mirar el pixel.
- El seed completo de §9 se movió a la Fase 2 (no se dejó para "cuando haga falta"): las
  tablas de categorías/productos/inventario ya existen aquí, y sin datos de verdad no se puede
  probar a mano ni el filtrado del inventario ni que ajustar una sucursal no toque la otra.
- `InventoryController@index` filtra con `whereHas` sobre `product` y hace `join` con
  `products` solo para poder `orderBy('products.name')` (Eloquent no deja ordenar por una
  columna de una relación sin el join). `select('inventories.*')` evita que el join traiga
  columnas de `products` duplicadas al hidratar el modelo.
- Los checkboxes (`is_active`, `manages_inventory`) no tienen el problema clásico de HTML de
  "una casilla sin marcar no se manda": Inertia serializa `useForm().data` como JSON con
  `router.post`/`put`, no como un `<form>` nativo, así que un booleano `false` sí viaja al
  servidor tal cual.

### Pendiente para cerrar del todo (no bloquea empezar la Fase 3)

- Mismo pendiente de siempre: no hay CI. Se sigue posponiendo a propósito.

---

## Fase 3 — detalle

Commit siguiente a `600e5ff` · rama `main`.

### Hecho

- Migraciones y modelos de `cash_register_shifts` y `shift_payments` (§7). **Además**, el
  esquema (solo esquema) de `sales`, `sale_items` y `sale_payments`: la fórmula de cierre de
  turno (§7.5) necesita sumar los pagos en efectivo de las ventas completadas del turno, así
  que esas tablas tenían que existir ya, aunque nada las llene todavía — eso es 100% trabajo de
  la Fase 4 (`SaleService`, folios, el punto de venta). Ningún controller, ruta ni página de
  ventas se construyó aquí; los modelos `Sale`/`SaleItem`/`SalePayment` solo tienen sus
  relaciones, sin lógica de negocio.
- `ShiftService`: `open()` (revienta con `ShiftAlreadyOpenException` si ya hay un turno
  abierto del usuario), `expectedCash()` (fondo + Σ pagos en efectivo de ventas completadas —
  hoy siempre da el fondo, porque no hay ventas), y `close()` (congela `shift_payments` por los
  tres métodos dentro de una transacción, y guarda esperado/contado/diferencia).
- Primera excepción de negocio real del proyecto: `App\Exceptions\BusinessException` (clase
  base) y `ShiftAlreadyOpenException`, con un `render()` en `bootstrap/app.php` que las
  convierte en `back()->with('error', ...)` — el patrón que pide §2 para "turno ya abierto, sin
  existencia, pago insuficiente", listo para que la Fase 4 lo reutilice tal cual.
- Rutas: `/caja` (redirige a abrir o al detalle del turno abierto, según haya o no uno — esta
  ruta es la que la Fase 4 va a convertir en el punto de venta real) y `/turnos/*` (listado,
  abrir, detalle, cerrar). Autorización a nivel de registro en el controller (no un middleware
  de rol): una cajera solo ve/cierra su propio turno; el admin ve todos pero no puede cerrar el
  de otra persona.
- Cuatro pantallas, maquetadas primero en `/design`: listado (turno abierto destacado arriba),
  apertura, cierre (con el cálculo de la diferencia en vivo, 100% cliente, coloreado
  visto/sello/grafito según el signo) y detalle (resumen, desglose por método de pago, lista de
  ventas — todo en cero por ahora, a la espera de la Fase 4).
- Nuevo componente de §4: `Modal`, usado en la confirmación de cierre ("Esta acción es
  irreversible").
- `resources/js/lib/money.ts` gana `pesosACentavos()` — la única excepción a "el cliente nunca
  parsea dinero": una vista previa en pantalla (la diferencia mientras se teclea), nunca lo que
  se manda al guardar. Nuevo `resources/js/lib/fecha.ts` para pintar fechas en la zona horaria
  del navegador (no la del servidor).
- "Turnos" se agregó a la navegación lateral para **ambos roles** (§3: es de los pocos ítems
  que ve una cajera) — obligó a separar `ENLACES_COMUNES` de `ENLACES_ADMIN` en
  `AuthenticatedLayout`, que hasta la Fase 2 solo mostraba el sidebar a `admin`.
- Pruebas: 8 Pest (`tests/Feature/ShiftTest.php`) cubriendo los 4 criterios de aceptación más
  autorización a nivel de registro, y una corrida manual con Playwright sobre los mismos 4
  criterios con interacción real (clic, formularios, tres sesiones de navegador distintas para
  probar que una cajera no ve el turno de otra).

### Decisiones / gotchas que no eran obvias

- **Bug en la propia prueba de Playwright, no en la app**: la prueba de "una cajera no ve el
  turno de otra" leía `page.url()` justo después de un `click()` que dispara una navegación de
  Inertia — como esa navegación es asíncrona, `url()` a veces capturaba la URL **anterior**
  (`/turnos/abrir`) en vez de la nueva (`/turnos/{id}`), así que la prueba visitaba una URL que
  no era la que creía y "confirmaba" un 200 donde debía haber 403. Se corrigió con
  `page.waitForURL(/\/turnos\/\d+$/)` antes de leer `url()`. Es el mismo tipo de trampa que
  [[feedback-verify-with-playwright-not-just-pest]] advierte pero al revés: aquí Pest tenía
  razón (sus 8 pruebas ya cubrían esto correctamente) y el script de Playwright era el que
  mentía — un recordatorio de que la verificación manual también puede tener bugs propios, no
  solo la app.
- `MySQL` no permite `TRUNCATE` sobre una tabla referenciada por una FK (aunque esa tabla
  hija esté vacía). El script de verificación usaba `TRUNCATE cash_register_shifts` para
  resetear entre pruebas y fallaba por la FK de `sales.shift_id` — se cambió a `DELETE FROM`.
- El cálculo de "efectivo esperado" vive en un solo método (`ShiftService::expectedCash()`)
  reutilizado tanto por la pantalla de cierre (antes de guardar, como vista previa) como por
  `close()` (al guardar) — evita el mismo tipo de desincronización que el prompt advierte para
  el motor de retícula de la Fase 7, aunque aquí el riesgo es menor.
- La autorización de turnos **no** usa el middleware `role:admin` de las fases anteriores:
  aquí ambos roles acceden a las mismas rutas, pero cada quien ve datos distintos según sea
  dueño del turno o no. Por eso vive como chequeos explícitos dentro del controller
  (`autorizarAcceso`/`autorizarCierre`), no como un middleware — es autorización a nivel de
  registro, no de ruta.

### Pendiente para cerrar del todo (no bloquea empezar la Fase 4)

- Mismo pendiente de siempre: no hay CI.
- `sale_items.product_id` sigue `NOT NULL` (como debe ser en esta fase); la migración para
  permitirlo nulo cuando se conecte el cobro de Herramientas (Fase 6) sigue pendiente y
  **anotada, no hecha**, tal como pide el prompt.

---

## Fase 4 — detalle

Commit siguiente a `83a0d78` · rama `main`.

### Hecho

- `app/Exceptions/InsufficientStockException` e `InsufficientPaymentException`, sobre el
  `BusinessException` que ya existía desde la Fase 3 — mismo patrón, mismo `render()`.
- `FolioService::next()` — exactamente la consulta atómica de §7.3, traducida a MySQL
  (`INSERT ... ON DUPLICATE KEY UPDATE` + `lockForUpdate()`), sin tabla `folios` con `id` ni
  timestamps (coincide con el prompt: se maneja con `DB::table`, nunca un modelo Eloquent).
- `SaleService::createSale()` — la pieza central de la fase. Una sola transacción: calcula
  cada renglón desde el `Product` en la base (nunca desde lo que mande el cliente), folio,
  inserta venta + renglones, descuenta inventario de forma atómica
  (`UPDATE ... WHERE stock >= ?`, `InsufficientStockException` si `affected === 0`), y recorta
  cada pago al saldo restante para que el cambio nunca se registre como ingreso.
- `PosController`: `/caja` ahora **es** el punto de venta (ya no redirige a `turnos.show` como
  en la Fase 3 — ese placeholder se reemplazó, tal como estaba anotado). El catálogo completo
  de la sucursal viaja en las props iniciales; el filtrado por nombre/código y categoría es
  100% cliente. `TicketController` sirve `/ticket/{token}` (público, sin `auth`) y su PDF vía
  `barryvdh/laravel-dompdf`.
- Pantalla de punto de venta: catálogo + carrito (`useReducer` propio en `Pos/carrito.ts`),
  atajos de teclado completos (F2/Enter/+/−/Supr/F12/Esc), descuento por renglón editable
  inline, modal de cobro con pagos mixtos y cambio en vivo (`Pos/CobroModal.tsx`), pantalla de
  éxito con folio y cambio. Maquetado primero en `/design` (catálogo+carrito, modal de cobro,
  éxito).
- Ticket público con CSS de impresión (`@page { size: 80mm auto }`) y botón "Descargar PDF";
  el cambio no se guarda en la venta (§7.2), así que solo viaja al ticket por query string
  cuando se llega ahí desde la pantalla de éxito — un ticket abierto después (WhatsApp) no
  lo trae, lo cual es correcto.
- Pruebas: 6 Pest (`tests/Feature/PosTest.php`) cubriendo 6 de los 7 criterios de aceptación
  a nivel HTTP, más **7 pruebas Playwright** con interacción real de navegador cubriendo los
  7 criterios, incluida la más delicada: armar y cobrar una venta completa **sin tocar el
  mouse** (F2, tipeo, Enter, +, F12, tipeo, Enter, Tab/foco, Enter).

### Decisiones / gotchas que no eran obvias

- **Bug real que solo la verificación con teclado (no Pest, no un clic de mouse) atrapó**:
  tras agregar un producto con Enter en el buscador, el foco se quedaba en el campo de texto.
  Como el atajo de +/- está deliberadamente desactivado mientras el foco está en un input (para
  no interferir con la escritura normal), presionar `+` justo después de agregar un producto
  no hacía nada — rompía exactamente el flujo "sin mouse" que pide el criterio de aceptación
  #6. Se corrigió soltando el foco del buscador (`buscadorRef.current?.blur()`) inmediatamente
  después de agregar por Enter. Ni una prueba Pest ni mirar una captura de pantalla lo hubieran
  encontrado — solo tecleando de verdad.
- **Bug en el propio script de verificación, no en la app**: el helper que llamaba
  `php artisan tinker --execute="..."` desde Node no escapaba `$` antes de meter el PHP en un
  string de shell con comillas dobles — bash expandía `$u`, `$p`, etc. como variables vacías
  antes de que PHP los viera, así que cada preparación de datos fallaba en seco. Se corrigió
  escapando también `\` y `$`, no solo `"`.
- **Las cantidades de venta son enteras** (aunque `sale_items.quantity` siga `decimal(12,3)`
  en la base, por si algún día hace falta — ver el fix de "existencia como entero" de más
  arriba): esta papelería vende piezas completas, así que `StoreSaleRequest` valida
  `items.*.quantity` como `integer`, no como el `numeric` que tolera fracciones.
- **El botón "Confirmar cobro" se deshabilita en el cliente si el pago no alcanza**, en vez de
  dejar que el usuario lo intente y reciba el error del servidor. Esto cumple el espíritu del
  criterio de aceptación #3 (no se puede cobrar con pago insuficiente) de una forma más
  amable que "mostrar el error después de intentarlo" — el servidor igual lo rechaza si algo
  lo evade (confirmado con Pest, que sí prueba el POST directo). El indicador "Falta: $X" en
  el propio modal es el equivalente visible de ese error mientras no alcanza.
- Tras editar páginas nuevas (`Pos/*`, `Ticket/Show.tsx`), correr las pruebas sin `npm run
build` primero revienta con `ViteException: Unable to locate file in Vite manifest` — no es
  un bug, es que el manifest de producción quedó desactualizado. Ya había pasado en fases
  anteriores; se deja aquí de nuevo como recordatorio porque volvió a costar una vuelta de
  depuración.

### Pendiente para cerrar del todo (no bloquea empezar la Fase 5)

- Mismo pendiente de siempre: no hay CI.
