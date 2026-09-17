import { cerrarSesion } from "@/app/(auth)/actions";
import { LogoBadge } from "./logo-badge";

export function DashboardHeader({
  nombre,
  etiquetaRol,
}: {
  nombre: string;
  etiquetaRol: string;
}) {
  return (
    <header className="glass-rojo sticky top-0 z-20 text-white rounded-b-[28px] shadow-lg shadow-rojo/15">
      <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-full overflow-hidden bg-white shrink-0 shadow-sm flex items-center justify-center">
            <LogoBadge size={40} bg="#ffffff" fg="#b81714" />
          </span>
          <div>
            <p className="font-display text-base font-semibold leading-tight tracking-tight">
              Grand Prix
            </p>
            <p className="text-[11px] text-white/75 uppercase tracking-wider">{etiquetaRol}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:inline text-white/90">{nombre}</span>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="btn-press text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 border border-white/20"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
