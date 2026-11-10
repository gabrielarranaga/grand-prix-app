import { TitleAccent } from "./title-accent";

// Encabezado de pantalla con el patron de la landing: etiqueta mono en rojo,
// titular Bricolage con la palabra clave en rojo (<em>) y bajada en gris.
export function PageHeader({
  etiqueta,
  titulo,
  bajada,
}: {
  etiqueta: string;
  titulo: React.ReactNode;
  bajada?: React.ReactNode;
}) {
  return (
    <div className="animate-in">
      <p className="tag">{etiqueta}</p>
      <h1 className="titular text-[2rem] sm:text-[2.4rem] text-grafito mt-3">{titulo}</h1>
      <TitleAccent className="w-14 mt-3" />
      {bajada && <p className="text-[15px] leading-relaxed text-grafito/65 mt-3 max-w-xl">{bajada}</p>}
    </div>
  );
}
