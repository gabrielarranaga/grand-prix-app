-- Grand Prix - Escuela de Manejo
-- Esquema base: perfiles + roles, disponibilidad de profesores,
-- horarios de clase y reservas. Diseñado para poder agregar despues
-- "paquetes", "modalidad" y "pagos" sin rehacer estas tablas.

-- ============ ENUMS ============

create type public.rol_usuario as enum ('alumno', 'profesor', 'admin');
-- bloqueado: el admin cerro esta franja (vacaciones, no atienden ese dia).
create type public.estado_horario as enum ('disponible', 'reservado', 'completado', 'cancelado', 'bloqueado');
-- profesor_no_asistio: la clase no se dio porque el profesor no pudo ir
-- (no es falta del alumno -- no consume su cupo, no necesita perdon del
-- admin, se libera solo).
create type public.estado_reserva as enum ('confirmada', 'cancelada', 'completada', 'no_show', 'profesor_no_asistio');
-- pendiente: eligio el paquete, todavia no coordino/confirmo pago.
-- parcial: pago el 50% inicial (admin lo confirma a mano tras coordinar por WhatsApp).
-- pagado: pago el 100%. cancelado: se cayo la compra.
-- parcial y pagado desbloquean horarios/agenda para ese alumno.
create type public.estado_compra as enum ('pendiente', 'parcial', 'pagado', 'cancelado');

-- ============ PROFILES ============
-- Espejo de auth.users con el rol y datos de contacto.
-- Se llena automaticamente via trigger cuando se crea un auth.users.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  telefono text,
  rol public.rol_usuario not null default 'alumno',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chequeo de admin para usar dentro de policies. Debe ser una funcion
-- security definer (no un EXISTS inline dentro de la policy): si la policy
-- de "profiles" consultara la tabla "profiles" directamente, esa subconsulta
-- volveria a evaluar la misma policy y entraria en recursion infinita
-- (error de Postgres: "infinite recursion detected in policy"). Al vivir en
-- una funcion security definer (propiedad de postgres, dueño de la tabla),
-- la subconsulta corre sin RLS y no hay recursion.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin');
$$;

-- Cualquier usuario autenticado puede leer perfiles basicos
-- (necesario para que el alumno vea el nombre del profesor, etc.)
create policy "profiles: lectura autenticada"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: usuario edita su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Solo el admin puede crear/editar/borrar perfiles de otros (p.ej. profesores)
create policy "profiles: admin gestiona todo"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Un usuario puede actualizar su propio perfil (nombre, telefono) pero no
-- puede auto-otorgarse un rol distinto via ese mismo UPDATE. Se hace con un
-- trigger (no con RLS) para evitar ambiguedad de lectura OLD/NEW en el
-- subquery de una policy sobre la misma tabla.
-- Solo bloquea cuando hay un usuario final logueado (auth.uid() no nulo) que
-- no es admin. Si auth.uid() es nulo (p.ej. la service role key usada por el
-- panel admin en el servidor) se deja pasar: ese es un contexto de backend
-- ya autorizado antes de llegar aca, no un usuario intentando auto-editarse.
create function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and auth.uid() is not null and not public.is_admin() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;

create trigger before_profile_update
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

-- Trigger: al crear un usuario en auth.users, crear su fila en profiles.
-- El rol por defecto es 'alumno' (auto-registro). Los profesores se crean
-- aparte desde el panel admin (server action con service role).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, telefono, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    new.raw_user_meta_data ->> 'telefono',
    coalesce((new.raw_user_meta_data ->> 'rol')::public.rol_usuario, 'alumno')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ DISPONIBILIDAD DEL PROFESOR ============
-- Franjas recurrentes semanales que un profesor declara como "puedo dar clase aqui".
-- El admin genera horarios_clase concretos a partir de esto (o los crea directo).

create table public.disponibilidad_profesor (
  id uuid primary key default gen_random_uuid(),
  profesor_id uuid not null references public.profiles (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  hora_inicio time not null,
  hora_fin time not null,
  created_at timestamptz not null default now(),
  constraint disponibilidad_horas_validas check (hora_fin > hora_inicio)
);

alter table public.disponibilidad_profesor enable row level security;

create policy "disponibilidad: lectura autenticada"
  on public.disponibilidad_profesor for select
  to authenticated
  using (true);

create policy "disponibilidad: profesor gestiona la suya"
  on public.disponibilidad_profesor for all
  to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

create policy "disponibilidad: admin gestiona todo"
  on public.disponibilidad_profesor for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============ HORARIOS DE CLASE ============
-- El cronograma es FIJO: Lun-Sab, siempre las mismas 6 franjas de 2h
-- (ver FRANJAS_HORARIAS en el codigo). Por eso esta tabla ya NO tiene una
-- fila por cada franja disponible de cada semana -- solo guarda lo que es
-- una EXCEPCION al default (una clase ya reservada, o un bloqueo del admin
-- por vacaciones/cierre). Si no hay fila para una fecha+hora, esta disponible.
create table public.horarios_clase (
  id uuid primary key default gen_random_uuid(),
  -- Opcional: quien la termina dictando se puede anotar despues; no hace
  -- falta elegir profesor para que un horario exista o se reserve.
  profesor_id uuid references public.profiles (id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  estado public.estado_horario not null default 'disponible',
  created_at timestamptz not null default now(),
  constraint horario_horas_validas check (hora_fin > hora_inicio)
);

create index horarios_clase_profesor_fecha_idx on public.horarios_clase (profesor_id, fecha);
create index horarios_clase_estado_idx on public.horarios_clase (estado);

-- A lo mas una fila "activa" (no cancelada) por fecha+hora: evita que una
-- reserva y un bloqueo choquen sobre el mismo cupo.
create unique index horarios_clase_fecha_hora_activa_unica
  on public.horarios_clase (fecha, hora_inicio)
  where estado <> 'cancelado';

alter table public.horarios_clase enable row level security;

create policy "horarios: lectura autenticada"
  on public.horarios_clase for select
  to authenticated
  using (true);

create policy "horarios: profesor gestiona los suyos"
  on public.horarios_clase for all
  to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

create policy "horarios: admin gestiona todo"
  on public.horarios_clase for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============ RESERVAS ============

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  horario_clase_id uuid not null references public.horarios_clase (id) on delete cascade,
  estado public.estado_reserva not null default 'confirmada',
  fecha_creacion timestamptz not null default now()
);

create index reservas_alumno_idx on public.reservas (alumno_id);

-- Evita dobles reservas: solo puede existir una reserva "confirmada"
-- por horario_clase_id al mismo tiempo, a nivel de base de datos.
create unique index reservas_horario_confirmada_unica
  on public.reservas (horario_clase_id)
  where estado = 'confirmada';

alter table public.reservas enable row level security;

create policy "reservas: alumno ve las suyas"
  on public.reservas for select
  to authenticated
  using (alumno_id = auth.uid());

-- NOTA: no hay policy de UPDATE directa para que el alumno cancele -- eso
-- pasa solo por la funcion cancelar_reserva() (SECURITY DEFINER, respeta
-- el limite de 4 horas y libera el horario). Una policy de UPDATE aca
-- dejaria al alumno cambiar estado/horario_clase_id de su reserva
-- directo por API, saltandose esa regla.

create policy "reservas: profesor ve las de sus horarios"
  on public.reservas for select
  to authenticated
  using (exists (
    select 1 from public.horarios_clase h
    where h.id = horario_clase_id and h.profesor_id = auth.uid()
  ));

create policy "reservas: profesor actualiza estado de las de sus horarios"
  on public.reservas for update
  to authenticated
  using (exists (
    select 1 from public.horarios_clase h
    where h.id = horario_clase_id and h.profesor_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.horarios_clase h
    where h.id = horario_clase_id and h.profesor_id = auth.uid()
  ));

create policy "reservas: admin gestiona todo"
  on public.reservas for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Funcion RPC: reservar una clase por fecha+hora (cronograma fijo). Si no
-- existia una fila para esa fecha+hora, la crea en el momento (estaba
-- disponible por default). Bloquea la fila (FOR UPDATE) para que dos
-- alumnos no reserven el mismo cupo al mismo tiempo; si igual chocan al
-- crear la fila, el indice unico lo frena y se traduce a un mensaje claro.
create function public.reservar_clase_en_fecha(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time
)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
  v_reserva public.reservas;
  v_clases_incluidas integer;
  v_clases_usadas integer;
begin
  select * into v_horario
  from public.horarios_clase
  where fecha = p_fecha and hora_inicio = p_hora_inicio and estado <> 'cancelado'
  for update;

  if v_horario.id is not null and v_horario.estado <> 'disponible' then
    raise exception 'Ese horario ya no esta disponible';
  end if;

  -- No dejar reservar mas clases de las que incluyen los paquetes activos
  -- (parcial o pagado) del alumno.
  select coalesce(sum(p.num_clases), 0) into v_clases_incluidas
  from public.compras_paquete c
  join public.paquetes p on p.id = c.paquete_id
  where c.alumno_id = auth.uid()
    and c.estado in ('parcial', 'pagado');

  select count(*) into v_clases_usadas
  from public.reservas r
  where r.alumno_id = auth.uid()
    and r.estado in ('confirmada', 'completada', 'no_show');

  if v_clases_usadas >= v_clases_incluidas then
    raise exception 'Ya reservaste todas las clases incluidas en tu paquete';
  end if;

  begin
    if v_horario.id is null then
      insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado)
      values (p_fecha, p_hora_inicio, p_hora_fin, 'reservado')
      returning * into v_horario;
    else
      update public.horarios_clase set estado = 'reservado' where id = v_horario.id;
    end if;
  exception when unique_violation then
    raise exception 'Ese horario ya no esta disponible';
  end;

  insert into public.reservas (alumno_id, horario_clase_id, estado)
  values (auth.uid(), v_horario.id, 'confirmada')
  returning * into v_reserva;

  return v_reserva;
end;
$$;

grant execute on function public.reservar_clase_en_fecha(date, time, time) to authenticated;

-- Funcion RPC: el admin bloquea una franja puntual (vacaciones, no atienden).
create function public.bloquear_horario(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time
)
returns public.horarios_clase
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_horario
  from public.horarios_clase
  where fecha = p_fecha and hora_inicio = p_hora_inicio and estado <> 'cancelado'
  for update;

  if v_horario.id is not null and v_horario.estado <> 'disponible' then
    raise exception 'Ese horario ya tiene una reserva o un bloqueo';
  end if;

  if v_horario.id is null then
    insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado)
    values (p_fecha, p_hora_inicio, p_hora_fin, 'bloqueado')
    returning * into v_horario;
  else
    update public.horarios_clase set estado = 'bloqueado' where id = v_horario.id
    returning * into v_horario;
  end if;

  return v_horario;
end;
$$;

grant execute on function public.bloquear_horario(date, time, time) to authenticated;

-- Funcion RPC: el admin asigna directamente un cupo disponible a un alumno
-- (sin que el alumno tenga que reservarlo el mismo). Respeta las mismas
-- reglas que una reserva normal (cupo libre y limite de clases del paquete).
create function public.asignar_clase_a_alumno(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_alumno_id uuid
)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
  v_reserva public.reservas;
  v_clases_incluidas integer;
  v_clases_usadas integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_horario
  from public.horarios_clase
  where fecha = p_fecha and hora_inicio = p_hora_inicio and estado <> 'cancelado'
  for update;

  if v_horario.id is not null and v_horario.estado <> 'disponible' then
    raise exception 'Ese horario ya no esta disponible';
  end if;

  select coalesce(sum(p.num_clases), 0) into v_clases_incluidas
  from public.compras_paquete c
  join public.paquetes p on p.id = c.paquete_id
  where c.alumno_id = p_alumno_id
    and c.estado in ('parcial', 'pagado');

  select count(*) into v_clases_usadas
  from public.reservas r
  where r.alumno_id = p_alumno_id
    and r.estado in ('confirmada', 'completada', 'no_show');

  if v_clases_usadas >= v_clases_incluidas then
    raise exception 'Ese alumno ya reservo todas las clases incluidas en su paquete';
  end if;

  begin
    if v_horario.id is null then
      insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado)
      values (p_fecha, p_hora_inicio, p_hora_fin, 'reservado')
      returning * into v_horario;
    else
      update public.horarios_clase set estado = 'reservado' where id = v_horario.id;
    end if;
  exception when unique_violation then
    raise exception 'Ese horario ya no esta disponible';
  end;

  insert into public.reservas (alumno_id, horario_clase_id, estado)
  values (p_alumno_id, v_horario.id, 'confirmada')
  returning * into v_reserva;

  return v_reserva;
end;
$$;

grant execute on function public.asignar_clase_a_alumno(date, time, time, uuid) to authenticated;

-- Funcion RPC: cancelar una reserva propia, respetando la politica de
-- cancelacion (por defecto: hasta 4 horas antes del inicio de la clase).
create function public.cancelar_reserva(p_reserva_id uuid)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_reserva public.reservas;
  v_horario public.horarios_clase;
begin
  select * into v_reserva from public.reservas where id = p_reserva_id and alumno_id = auth.uid();

  if v_reserva is null then
    raise exception 'Reserva no encontrada';
  end if;

  if v_reserva.estado <> 'confirmada' then
    raise exception 'Esta reserva ya no se puede cancelar';
  end if;

  select * into v_horario from public.horarios_clase where id = v_reserva.horario_clase_id for update;

  if (v_horario.fecha + v_horario.hora_inicio) - now() < interval '4 hours' then
    raise exception 'Ya no se puede cancelar: faltan menos de 4 horas para la clase';
  end if;

  update public.reservas set estado = 'cancelada' where id = p_reserva_id returning * into v_reserva;
  update public.horarios_clase set estado = 'disponible' where id = v_horario.id;

  return v_reserva;
end;
$$;

grant execute on function public.cancelar_reserva(uuid) to authenticated;

-- ============ PAQUETES ============
-- Catalogo de paquetes de clases (precio fijo, sin descuento de horas
-- todavia). Horas/clases/circuito quedan como campos estructurados (no
-- texto libre) para poder mostrarlos como una lista de tics en la UI.

create table public.paquetes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  horas_practica smallint not null,
  num_clases smallint not null,
  horas_circuito smallint not null default 0,
  incluye_examen_medico boolean not null default false,
  incluye_traslado boolean not null default false,
  precio numeric(10, 2) not null,
  destacado boolean not null default false,
  orden smallint not null default 0,
  activo boolean not null default true
);

alter table public.paquetes enable row level security;

create policy "paquetes: lectura autenticada"
  on public.paquetes for select
  to authenticated
  using (true);

create policy "paquetes: admin gestiona todo"
  on public.paquetes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.paquetes
  (nombre, horas_practica, num_clases, horas_circuito, incluye_examen_medico, incluye_traslado, precio, destacado, orden) values
  ('Académico', 8, 4, 0, false, false, 360, false, 1),
  ('Básico', 10, 5, 0, false, false, 430, false, 2),
  ('Standard', 12, 6, 1, false, false, 500, false, 3),
  ('Integral', 14, 7, 2, true, true, 920, true, 4);

-- ============ COMPRAS DE PAQUETE ============
-- Registra que un alumno eligio un paquete y con que metodo de pago dijo
-- que iba a pagar. No hay pasarela de pago conectada todavia (roadmap):
-- "estado" queda en 'pendiente' hasta que alguien del negocio lo confirme
-- manualmente como 'pagado' (por ahora, desde el Table Editor de Supabase).

create table public.compras_paquete (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  paquete_id uuid not null references public.paquetes (id),
  precio numeric(10, 2) not null,
  metodo_pago text,
  -- 'contado' (pago completo de una vez) o 'medio_medio' (50% ahora, 50% a
  -- mitad del curso). Se pide al elegir el paquete y va en el mensaje de WhatsApp.
  modalidad_pago text,
  estado public.estado_compra not null default 'pendiente',
  fecha_creacion timestamptz not null default now()
);

create index compras_paquete_alumno_idx on public.compras_paquete (alumno_id);

-- Un alumno solo puede tener UN paquete activo (no cancelado) a la vez.
create unique index compras_paquete_alumno_activa_unica
  on public.compras_paquete (alumno_id)
  where estado <> 'cancelado';

alter table public.compras_paquete enable row level security;

create policy "compras: alumno ve las suyas"
  on public.compras_paquete for select
  to authenticated
  using (alumno_id = auth.uid());

-- Solo puede crear su compra en estado 'pendiente' -- si pudiera mandar
-- 'pagado' directo por API se desbloquearia clases gratis sin pagar.
create policy "compras: alumno crea las suyas"
  on public.compras_paquete for insert
  to authenticated
  with check (alumno_id = auth.uid() and estado = 'pendiente');

-- Ademas del check de arriba, se fuerza el precio real del paquete al
-- crear la fila (si no, un alumno podria mandar un "precio" inventado por
-- API directa, sin pasar por la Server Action que ya lo calcula bien).
create function public.forzar_precio_real_paquete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    select precio into new.precio from public.paquetes where id = new.paquete_id;
  end if;
  return new;
end;
$$;

create trigger before_compra_insert
  before insert on public.compras_paquete
  for each row execute function public.forzar_precio_real_paquete();

-- Si se arrepiente ANTES de pagar (sigue en 'pendiente'), puede cancelarla
-- el mismo para elegir otro paquete. Una vez parcial/pagada, eso ya no
-- aplica -- cualquier cambio pasa por WhatsApp con el negocio.
create policy "compras: alumno cancela su compra pendiente"
  on public.compras_paquete for update
  to authenticated
  using (alumno_id = auth.uid() and estado = 'pendiente')
  with check (alumno_id = auth.uid() and estado = 'cancelado');

create policy "compras: admin gestiona todo"
  on public.compras_paquete for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============ RECORDATORIOS DE CLASE ============

alter table public.reservas
  add column recordatorio_enviado boolean not null default false;

-- Un solo punto de encuentro para toda la escuela (hoy solo opera un carro).
-- Si mas adelante hay mas de un carro/instructor en paralelo esto tendria
-- que pasar a ser por horario/profesor en vez de un valor global unico.
create table public.configuracion_negocio (
  id boolean primary key default true check (id),
  punto_encuentro_texto text,
  punto_encuentro_maps_link text
);

insert into public.configuracion_negocio (id) values (true);

alter table public.configuracion_negocio enable row level security;

create policy "configuracion: lectura autenticada"
  on public.configuracion_negocio for select
  to authenticated
  using (true);

create policy "configuracion: admin edita"
  on public.configuracion_negocio for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Reservas a 1h50-2h de empezar que todavia no mandaron recordatorio. La
-- llama el cron (route handler) con la service role. security definer
-- porque necesita el email, que vive en auth.users, no en profiles.
create function public.recordatorios_pendientes()
returns table (
  reserva_id uuid,
  alumno_nombre text,
  alumno_telefono text,
  alumno_email text,
  fecha date,
  hora_inicio time,
  instructor_nombre text,
  punto_encuentro_texto text,
  punto_encuentro_maps_link text
)
language sql
security definer set search_path = public, auth
stable
as $$
  select
    r.id,
    a.nombre,
    a.telefono,
    u.email,
    h.fecha,
    h.hora_inicio,
    p.nombre,
    cfg.punto_encuentro_texto,
    cfg.punto_encuentro_maps_link
  from public.reservas r
  join public.horarios_clase h on h.id = r.horario_clase_id
  join public.profiles a on a.id = r.alumno_id
  join auth.users u on u.id = a.id
  left join public.profiles p on p.id = h.profesor_id
  left join public.configuracion_negocio cfg on true
  where r.estado = 'confirmada'
    and r.recordatorio_enviado = false
    and (h.fecha + h.hora_inicio) between (now() + interval '1 hour 50 minutes') and (now() + interval '2 hours');
$$;

grant execute on function public.recordatorios_pendientes() to service_role;

-- ============ GRANTS DE TABLA ============
-- RLS solo filtra filas; ademas hace falta el permiso de SQL sobre la
-- operacion (SELECT/INSERT/UPDATE/DELETE). Se declaran explicitos aca en
-- vez de depender de los privilegios por defecto del proyecto.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on public.profiles, public.disponibilidad_profesor, public.horarios_clase, public.reservas,
     public.paquetes, public.compras_paquete, public.configuracion_negocio
  to authenticated;

grant all
  on public.profiles, public.disponibilidad_profesor, public.horarios_clase, public.reservas,
     public.paquetes, public.compras_paquete, public.configuracion_negocio
  to service_role;
