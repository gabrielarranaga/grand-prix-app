"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopiarNumero({ numero }: { numero: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(numero);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el numero igual queda a la vista.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="btn-press inline-flex items-center gap-2 rounded-full border border-grafito/20 bg-white px-4 py-2 text-grafito"
    >
      <span className="font-mono text-base font-bold tracking-wider select-all">{numero}</span>
      {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-grafito/50" />}
      <span className="text-xs text-grafito/55">{copiado ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
