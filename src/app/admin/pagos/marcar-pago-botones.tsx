import { marcarPago } from "./actions";

export function MarcarPagoBotones({ compraId, estado }: { compraId: string; estado: string }) {
  if (estado === "pagado" || estado === "cancelado") {
    return null;
  }

  return (
    <div className="flex gap-3">
      {estado === "pendiente" && (
        <form action={marcarPago.bind(null, compraId, "parcial")}>
          <button type="submit" className="text-sm font-semibold text-grafito/70 hover:text-rojo">
            Marcar 50% pagado
          </button>
        </form>
      )}
      <form action={marcarPago.bind(null, compraId, "pagado")}>
        <button type="submit" className="text-sm font-semibold text-rojo hover:text-rojo-oscuro">
          Marcar pagado completo
        </button>
      </form>
    </div>
  );
}
