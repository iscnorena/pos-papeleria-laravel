# POS Papelería

Punto de venta para papelería. Laravel + Inertia.js + React/TypeScript, MySQL, un solo negocio.

La especificación completa —reglas de negocio, modelo de datos, sistema de diseño y las 8
fases— vive en **[`docs/prompt.md`](docs/prompt.md)**. Ese documento manda: si este README lo
contradice, gana el documento. La versión anterior del prompt (pensada para un port a
Next.js/Vercel, descartado) se conserva como referencia histórica en
[`docs/prompt-nextjs-original.md`](docs/prompt-nextjs-original.md).

**Estado: Fase 5 (historial, reportes y tablero) terminada.** Siguiente: Fase 6, sección
Herramientas.

## Arranque

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# crea la base MySQL local (nombre en DB_DATABASE de .env) antes de migrar
php artisan migrate
npm run build   # o: npm run dev, en dos terminales junto con `php artisan serve`
```

## Comandos

| Comando                           | Qué hace                                                  |
| --------------------------------- | --------------------------------------------------------- |
| `php artisan serve`               | Servidor de desarrollo Laravel                            |
| `npm run dev`                     | Vite en modo desarrollo (HMR)                             |
| `npm run build`                   | Compila los assets de producción                          |
| `npm run typecheck`               | Solo TypeScript                                           |
| `npm run lint` / `lint:fix`       | ESLint sobre `resources/js`                               |
| `npm run format` / `format:check` | Prettier                                                  |
| `composer pint` / `pint:test`     | Laravel Pint (formato PHP)                                |
| `php artisan migrate`             | Corre las migraciones                                     |
| `php artisan db:seed`             | Siembra sucursales, usuarios, categorías y productos (§9) |
| `php artisan test`                | Pest/PHPUnit                                              |
| `npm run test:e2e`                | Playwright — necesita el server y Vite corriendo          |

## Cómo está armado

```
docs/prompt.md              la especificación — léela antes de tocar nada
app/Models/                  modelos Eloquent
app/Services/                lógica de negocio (ventas, turnos, inventario, folios)
app/Support/Money.php        dinero en centavos enteros (§2) — toCents/toPesos/format
config/pos.php               configuración del negocio (§7.1) — nombre, ticket, impuesto, zona horaria
database/migrations/         esquema (§7)
resources/js/Pages/          páginas Inertia/React (Admin/* son las pantallas de la Fase 2)
resources/js/Components/ui/  componentes base de §4 (Boton, Campo, Selector, Aviso, Distintivo, EnlaceNav)
resources/js/lib/money.ts    contraparte de solo lectura de Money.php, para pintar centavos en React
resources/css/app.css        fuentes autoalojadas (@font-face) + directivas Tailwind
public/fonts/                woff2 copiados de los paquetes @fontsource* (ver "Fuentes")
tailwind.config.js           sistema de diseño de §4 — la paleta se REEMPLAZA, no se extiende
```

## Cosas que muerden

**La paleta reemplaza a la de Tailwind.** No existen `bg-blue-500` ni `text-gray-700`: solo los
colores de §4 (`papel`, `tinta`, `grafito`, `linea`, `boligrafo`, `marcador`, `sello`, `visto`).

**El dinero se calcula en centavos enteros** (`BIGINT` en la base), nunca con floats ni
`decimal` (§2). La conversión ocurre en exactamente dos fronteras: al pintar en la interfaz y al
parsear un formulario.

**Sin multi-tenencia.** Un solo negocio. No agregues `tenant_id` ni ningún mecanismo de
tenencia sin discutirlo primero — se descartó deliberadamente (ver `docs/prompt.md`).

**Cualquier trabajo de diseño usa el skill `/design` primero**, maquetando en el canvas de
Claude Design antes de escribir el componente React/Inertia definitivo — está en el
encabezado de `docs/prompt.md`.

## Fuentes

Autoalojadas en `public/fonts/`, copiadas desde los paquetes `@fontsource*` en
`devDependencies` (solo son el origen; en tiempo de ejecución no se usan). Declaradas a mano en
`resources/css/app.css` con `@font-face` y `font-display: swap` (sin `next/font`, eso es de
Next.js).

- **display** · Archivo (variable 100–900) — títulos y cifras
- **sans** · Atkinson Hyperlegible Next (variable 200–800) — cuerpo e interfaz
- **mono** · IBM Plex Mono (400/500/600) — folios, códigos, cantidades, tickets

## Base de datos

MySQL/MariaDB local. `DATABASE_URL` no aplica aquí (eso era de la versión Postgres/Supabase);
usa `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` en `.env`.

Las pruebas (`php artisan test`) corren contra una base aparte, `pos_papeleria_test`
(configurada en `phpunit.xml`) — este PHP no trae `pdo_sqlite`, así que no se puede usar el
`:memory:` por defecto de Laravel. Créala una vez por máquina:

```bash
mysql -u root -p -e "CREATE DATABASE pos_papeleria_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Entrar por primera vez

Con la semilla de `php artisan db:seed` (contraseña `password` para los tres):

| Usuario  | PIN  | Rol    | Sucursal   |
| -------- | ---- | ------ | ---------- |
| `admin`  | 1234 | admin  | Principal  |
| `cajera` | 5678 | cajera | Principal  |
| `maria`  | 9012 | cajera | Sucursal 2 |
