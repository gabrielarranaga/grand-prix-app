# Contexto — App web Escuela de Manejo Grand Prix

Trasladada aquí desde `Escritorio/Landing pages/Escuela_de_manejo/app web/` el 2026-09-22, como parte de una reorganización para que todo lo de este negocio viva bajo `Escuela de manejo content/`. No confundir con la landing estática (`../Landing web y Linktree Escuela de Manejo/`) — esto es una aplicación web aparte, con su propio proceso de build.

## Qué es

Aplicación Next.js (App Router, TypeScript), con Supabase (`supabase/`) y variables de entorno en `.env.local` / `.env.local.example` (el `.example` sí se puede compartir, el `.env.local` real no — valores sensibles). Se despliega en Netlify (`netlify.toml`) y también tenía config de Vercel (`vercel.json`) — confirmar cuál es el destino de despliegue real vigente antes de asumir uno.

## Git

**Esta sí tenía repositorio Git propio** (`app web/.git`) — se trasladó intacto junto con el resto. Historial de commits preservado.

## Cómo correrla localmente

```bash
npm install
npm run dev
```

`node_modules/` y `.next/` **no se trasladaron** a propósito — regenerables, pesaban espacio considerable. Correr `npm install` (y `npm run build` si hace falta el build de producción) antes de trabajar aquí por primera vez en esta ubicación.

## Documentación propia del proyecto

Revisar `README.md`, `CLAUDE.md` y `AGENTS.md` dentro de esta misma carpeta — traen instrucciones específicas de la app.

## Decisiones técnicas importantes (rescatadas de sesiones de "Landing pages" antes de borrarlas, 2026-09-22)

### Modalidad actual: 100% presencial, sin puntos de encuentro ni clases a domicilio

Grand Prix opera hoy 100% presencial desde un único local fijo — no existe todavía el concepto de puntos de encuentro variables ni clases a domicilio.

**Por qué:** el dueño lo aclaró explícitamente (2026-09-13): *"Ahorita seguimos en modalidad presencial del local. El próximo año recién procederemos a la virtualidad, donde plantearemos puntos de encuentro y clases a domicilio."* Surgió al construir un campo de "punto de encuentro" para el sistema de recordatorios (ver abajo) — el dueño tuvo que aclarar que ni siquiera aplica a cómo funciona el negocio hoy.

**Cómo aplicar:** no construir ni sugerir funcionalidad que asuma múltiples puntos de encuentro, logística de visitas a domicilio, o asignación de instructor por ubicación, hasta que el dueño mencione el paso a virtualidad (esperado ~2027). Un campo único de "punto de encuentro" puede quedar estático/opcional porque solo hay un local físico.

### Sistema de recordatorios: construido y migrado, pero inactivo a propósito

Existe una función de recordatorio de clase (`src/app/api/cron/recordatorios/route.ts`, función Postgres `recordatorios_pendientes()`, tabla `configuracion_negocio`) completamente construida, con su migración de base de datos ya corrida en el Supabase real (`supabase/fix-14-recordatorios.sql`). Se queda totalmente inerte hasta que se configuren tres cosas: una cuenta de Resend + variables de entorno `RESEND_API_KEY`/`RESEND_FROM`, y que la app esté desplegada en algún lado con el cron de `vercel.json` (`*/15 * * * *`) activo. **Envío por WhatsApp/Twilio fue rechazado explícitamente por el dueño** (postura de "sin costos" — solo el canal gratuito por email vía Resend está en alcance si se activa algún día).

### Sistema de referidos: eliminado por completo

El sistema de referidos (`codigo_referido`, `referido_por`, `saldo_credito`, tabla `referidos`, descuento en checkout, `/alumno/invita`, botón "brevete obtenido") se eliminó por completo del código el 2026-09-13, a pedido del dueño ("el sistema de referidos los vamos a quitar por el momento"). La migración SQL combinada original se conservó como `supabase/fix-14-referidos-y-recordatorios.sql.old`, de referencia por si se quiere reintroducir más adelante — **nunca se aplicó** a la base de datos real.

**Cómo aplicar:** no asumir que recordatorios o referidos son funcionalidades activas al razonar sobre el comportamiento actual de la app — verificar variables de entorno/estado de la BD antes de afirmar que alguno está activo. No reintroducir UI/schema de referidos sin un pedido nuevo y explícito.

**Constraint transversal:** el dueño tiene una postura firme de "sin costos" para esta app, confirmada varias veces — cualquier feature que implique un servicio de pago (SMS, WhatsApp Business API, etc.) necesita confirmación explícita antes de proponerse.

## Relación con el resto del negocio

- Los datos oficiales de Grand Prix (paquetes, precios, horarios, trayectoria) salen del perfil/banco de contenido del proyecto de redes (`perfil-escuela-grand-prix.md`, `banco-contenido-grand-prix.md` en la raíz de `Escuela de manejo content/`) y del propio mega-prompt de la landing (`../Landing web y Linktree Escuela de Manejo/mega-prompt-grand-prix.md`) — mantener consistencia entre ambos si algo cambia (precio, horario, etc.).
- La landing estática (un solo `index.html` + linktree, sin build) es un proyecto aparte: `../Landing web y Linktree Escuela de Manejo/`.
- Para construir o mejorar esta app con criterio de diseño, la skill `landing-pages` (`~/.claude/skills/landing-pages/`) tiene la plantilla y el catálogo de skills de diseño/frontend/animación/accesibilidad a usar.
