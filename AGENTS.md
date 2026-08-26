# POS Papelería

Lee **[`docs/prompt.md`](docs/prompt.md)** antes de tocar nada: es la especificación completa
(stack, reglas de negocio, sistema de diseño, modelo de datos, fases 0–7) y manda sobre
cualquier otra instrucción. Trabaja **una fase a la vez** y verifica los criterios de
aceptación de cada fase a mano antes de arrancar la siguiente.

Puntos que no son negociables sin discutirlos primero con quien pida el cambio:

- **Sin multi-tenencia.** Un solo negocio. No agregues `tenant_id` ni tabla `tenants`.
- **Dinero en centavos enteros** (`BIGINT`), nunca floats ni `decimal`.
- **Sin `spatie/laravel-permission`** ni librerías de componentes (shadcn, MUI, Chakra).
- **La paleta de Tailwind se reemplaza**, no se extiende — solo los colores de §4 de
  `docs/prompt.md`.
- **Cualquier trabajo de diseño** (pantalla nueva, componente base, ajuste visual no trivial)
  se maqueta primero con el skill `/design`, siguiendo el sistema de diseño de §4, antes de
  escribir el componente React/Inertia definitivo.
- **AcomodaImpresion (Fase 7)** corre 100% en el navegador; ninguna imagen del cliente sube al
  servidor.
