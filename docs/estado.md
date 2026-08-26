# Estado del proyecto

Bitácora de dónde quedó el trabajo, qué falta y por qué se tomaron ciertas decisiones. Se
actualiza al cerrar cada fase. La especificación manda: ver [`prompt.md`](prompt.md).

---

## Dónde vamos

| Fase                              | Estado                                                           |
| --------------------------------- | ---------------------------------------------------------------- |
| **0 — Andamiaje**                 | ✅ **Cerrada.** Los 3 criterios de aceptación verificados a mano |
| **1 — Autenticación**             | ✅ **Cerrada.** Los 5 criterios verificados con Playwright       |
| 2 — Catálogo y administración     | ⬜ Pendiente                                                     |
| 3 — Turnos de caja                | ⬜ Pendiente                                                     |
| 4 — Punto de venta                | ⬜ Pendiente                                                     |
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
