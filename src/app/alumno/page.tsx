import Image from "next/image";
import { requireProfile } from "@/lib/auth";
import { TitleAccent } from "@/components/title-accent";

const STATS = [
  { valor: "31+", etiqueta: "Años en el mercado" },
  { valor: "1,000+", etiqueta: "Alumnos con brevete" },
  { valor: "4.9★", etiqueta: "+65 reseñas en Google" },
];

export default async function InicioPage() {
  const profile = await requireProfile("alumno");

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <p className="text-sm text-grafito/60">Hola, {profile.nombre.split(" ")[0]}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-grafito tracking-tight leading-[1.05]">
          Grand Prix
        </h1>
        <TitleAccent className="w-10 h-1 mt-2" />
        <p className="text-sm text-grafito/60 mt-1.5">Escuela de Manejo · Lima, Perú</p>
      </div>

      <div className="animate-in corte-asimetrico relative overflow-hidden h-64 sm:h-80 max-sm:landscape:h-48">
        <Image
          src="/circuito.webp"
          alt="Práctica de manejo Grand Prix en la Costa Verde"
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STATS.map((s, i) => (
          <div
            key={s.etiqueta}
            className="animate-in glass corte-asimetrico-sm p-4 text-center"
            style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}
          >
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-rojo tracking-tight">
              {s.valor}
            </p>
            <p className="text-[11px] sm:text-xs text-grafito/60 mt-1 leading-tight">
              {s.etiqueta}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
