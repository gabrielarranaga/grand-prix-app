# Grand Prix — Panel de gestión

App web para gestionar la operación de la Escuela de Manejo Grand Prix: reserva de clases,
asignación de profesores y agendas de alumnos, profesores y administrador.

Stack: **Next.js 16 (App Router) + Supabase (Postgres, Auth, RLS) + Tailwind CSS v4**, pensado
para desplegarse en **Vercel**.

## Progreso: MVP completo (4 de 4)

- [x] Modelo de datos (`supabase/schema.sql`): perfiles con rol, disponibilidad de profesor,
      horarios de clase, reservas — con protección anti-doble-reserva a nivel de base de datos.
- [x] Autenticación: registro de alumnos, login, logout, sesiones, rutas protegidas por rol.
- [x] Panel admin (`/admin`): resumen del negocio, crear/editar/eliminar profesores, abrir/eliminar
      horarios.
- [x] Flujo de reserva del alumno (`/alumno`): filtrar por profesor, reservar horario disponible.
- [x] Agenda del alumno (`/alumno/agenda`): próximas clases + historial, cancelar con política de
      4 horas.
- [x] Agenda del profesor (`/profesor`): próximas clases, marcar clases pasadas como completadas o
      no-show.

Roadmap después del MVP (no incluido todavía, ver el mega-prompt original): paquetes y precios,
modalidad de clase (a domicilio / punto de encuentro), pagos integrados (Mercado Pago / Culqi).

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo (gratis).
2. En **Project Settings → API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la compartas ni la subas a git!)
3. Copia `.env.local.example` a `.env.local` y pega esos tres valores.

## 2. Cargar el esquema de base de datos

1. En el panel de Supabase, abre **SQL Editor**.
2. Pega el contenido completo de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.
   Esto crea las tablas, los roles, las políticas de seguridad (RLS) y las funciones de
   reserva/cancelación.

## 3. Correr la app localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

- Ve a `/registro` para crear una cuenta de **alumno** (se registra solo).
- Los **profesores** no se auto-registran: los crea el administrador (eso lo construimos en el
  siguiente paso).
- El **primer administrador** no puede crearse desde la app todavía. Para crearlo:
  1. Regístrate normalmente en `/registro` con el email que va a ser el admin.
  2. En Supabase, ve a **Table Editor → profiles**, busca esa fila y cambia la columna `rol` de
     `alumno` a `admin`.
  3. Vuelve a iniciar sesión en la app — ahora entra a `/admin`.

## Notas de seguridad ya aplicadas

- Cada rol solo ve/edita lo suyo vía Row Level Security en Postgres (no solo en el código de la
  app): un alumno no puede leer reservas de otro alumno, un profesor no puede editar la agenda de
  otro profesor, etc.
- Un usuario no puede auto-otorgarse el rol `admin` aunque manipule el formulario.
- Reservar una clase usa una función de base de datos (`reservar_clase`) que bloquea la fila del
  horario antes de confirmar, evitando que dos alumnos reserven el mismo horario si aprietan
  "reservar" al mismo tiempo.
- Cancelar una reserva usa la función `cancelar_reserva`, con política de cancelación de 4 horas
  antes de la clase (ajustable en `supabase/schema.sql` si el negocio prefiere otro límite).

## Antes de lanzar con alumnos reales

- Reactivar **"Confirm email"** en Supabase (Authentication → Sign In / Providers → Email) o
  configurar un proveedor SMTP propio. Lo desactivamos solo para poder probar sin trabar con el
  límite de correos del servicio gratuito de Supabase.
- Revisar que no queden cuentas ni horarios de prueba (`profesor.sandro.gp@gmail.com`, `Kathy
  Torres`, `Flor Alumna Prueba`, etc.) antes de compartir la app con el negocio real.

## Deploy

En [Vercel](https://vercel.com), importa este repo/carpeta y agrega las mismas 3 variables de
entorno de `.env.local` en la configuración del proyecto.
