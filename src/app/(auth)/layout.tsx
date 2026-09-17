import Image from "next/image";
import { Award, ShieldCheck, Car } from "lucide-react";
import { LogoBadge } from "@/components/logo-badge";

const BENEFICIOS = [
  {
    icon: Award,
    titulo: "31+ años de experiencia",
    texto: "Formando conductores responsables en Lima desde hace más de tres décadas.",
  },
  {
    icon: ShieldCheck,
    titulo: "Instructores certificados",
    texto: "Profesionales con la paciencia y la experiencia para enseñarte bien, a tu ritmo.",
  },
  {
    icon: Car,
    titulo: "Flota moderna",
    texto: "Vehículos bien mantenidos, listos para tus prácticas y para tu examen.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col">
      <div className="relative overflow-hidden px-6 pt-10 pb-20 sm:px-10 sm:pt-14 sm:pb-28">
        <Image
          src="/instructor-sonriendo.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="object-cover object-[50%_38%]"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-vino/55 via-vino-oscuro/65 to-ink/85" />
        <div className="relative max-w-3xl mx-auto animate-in">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-11 w-11 rounded-full overflow-hidden bg-white shadow-lg flex items-center justify-center shrink-0">
              <LogoBadge size={44} bg="#ffffff" fg="#8f1c17" />
            </span>
            <p className="font-display text-lg font-bold text-white tracking-tight">Grand Prix</p>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
            Escuela de manejo · Lima, Perú
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase leading-[1.08] text-white tracking-tight max-w-xl mt-2">
            La escuela correcta, con el método correcto
          </h1>
          <p className="text-sm sm:text-base text-white/70 mt-4 max-w-md leading-relaxed">
            Aquí reservas tus clases, revisas tu horario y sigues tu progreso. La instrucción al
            volante la sigues recibiendo con el mismo equipo de siempre.
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 sm:px-10 -mt-10 sm:-mt-14 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-in grid sm:grid-cols-3 gap-4 mb-8">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="bg-white rounded-2xl border border-grafito/10 shadow-sm p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rojo to-rojo-oscuro text-white mb-3">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="font-display text-sm font-bold text-grafito">{titulo}</p>
                <p className="text-xs text-grafito/60 mt-1 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>

          <div className="animate-in max-w-sm mx-auto bg-white rounded-2xl border border-grafito/10 shadow-sm p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
