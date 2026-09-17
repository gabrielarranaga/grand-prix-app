export type Rol = "alumno" | "profesor" | "admin";

export type Profile = {
  id: string;
  nombre: string;
  telefono: string | null;
  rol: Rol;
  created_at: string;
};

export type EstadoHorario = "disponible" | "reservado" | "completado" | "cancelado";
export type EstadoReserva = "confirmada" | "cancelada" | "completada" | "no_show" | "profesor_no_asistio";

export type HorarioClase = {
  id: string;
  profesor_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoHorario;
  created_at: string;
};

export type Reserva = {
  id: string;
  alumno_id: string;
  horario_clase_id: string;
  estado: EstadoReserva;
  fecha_creacion: string;
};

export type EstadoCompra = "pendiente" | "parcial" | "pagado" | "cancelado";
export type ModalidadPago = "contado" | "medio_medio";

export type Paquete = {
  id: string;
  nombre: string;
  horas_practica: number;
  num_clases: number;
  horas_circuito: number;
  incluye_examen_medico: boolean;
  incluye_traslado: boolean;
  precio: number;
  destacado: boolean;
  orden: number;
  activo: boolean;
};

export type CompraPaquete = {
  id: string;
  alumno_id: string;
  paquete_id: string;
  precio: number;
  metodo_pago: string | null;
  modalidad_pago: ModalidadPago | null;
  estado: EstadoCompra;
  fecha_creacion: string;
};
