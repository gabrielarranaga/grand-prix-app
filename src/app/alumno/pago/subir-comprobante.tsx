"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarComprobante } from "./actions";

const LIMITE_MB = 6;

// La captura se sube directo del celular al almacenamiento privado de
// Supabase (carpeta del propio alumno); despues la base registra el
// comprobante y calcula el monto desde la compra, no desde el navegador.
export function SubirComprobante({ compraId, alumnoId }: { compraId: string; alumnoId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (!archivo) return;
    if (archivo.size > LIMITE_MB * 1024 * 1024) {
      setError(`La imagen pesa más de ${LIMITE_MB} MB. Toma una captura de pantalla en vez de una foto.`);
      return;
    }

    setEnviando(true);
    setError(null);

    const extension = (archivo.name.split(".").pop() || "jpg").toLowerCase();
    const ruta = `${alumnoId}/${compraId}-${Date.now()}.${extension}`;

    const supabase = createClient();
    const { error: errorSubida } = await supabase.storage
      .from("comprobantes")
      .upload(ruta, archivo, { contentType: archivo.type || "image/jpeg" });

    if (errorSubida) {
      setEnviando(false);
      setError("No se pudo subir la imagen. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }

    const resultado = await registrarComprobante(compraId, ruta);
    setEnviando(false);

    if (resultado.error) {
      setError(resultado.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id="comprobante"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          setArchivo(e.target.files?.[0] ?? null);
          setError(null);
        }}
      />
      <label
        htmlFor="comprobante"
        className="btn-press flex items-center gap-3 rounded-xl border-[1.5px] border-dashed border-grafito/25 bg-white px-4 py-3.5 cursor-pointer hover:border-rojo"
      >
        <Upload className="h-5 w-5 text-rojo shrink-0" />
        <span className="text-sm text-grafito truncate">
          {archivo ? archivo.name : "Elegir captura de la galería"}
        </span>
      </label>

      {error && <p className="text-sm text-rojo">{error}</p>}

      <button
        type="button"
        onClick={enviar}
        disabled={!archivo || enviando}
        className="btn-press w-full glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold py-3 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar comprobante"}
      </button>
    </div>
  );
}
