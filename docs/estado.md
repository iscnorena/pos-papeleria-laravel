# Estado del proyecto

Bitácora de dónde quedó el trabajo, qué falta y por qué se tomaron ciertas decisiones. Se
actualiza al cerrar cada fase. La especificación manda: ver [`prompt.md`](prompt.md).

---

## Dónde vamos

| Fase                              | Estado                                                           |
| --------------------------------- | ---------------------------------------------------------------- |
| **0 — Andamiaje**                 | ✅ **Cerrada.** Los 3 criterios de aceptación verificados a mano |
| 1 — Autenticación                 | ⬜ Pendiente                                                     |
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
