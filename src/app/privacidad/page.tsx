import Link from "next/link";
import { LogoBadge } from "@/components/logo-badge";
import { TitleAccent } from "@/components/title-accent";

const NUMERO_WHATSAPP = "51990697634";

export default function PrivacidadPage() {
  return (
    <main className="min-h-dvh px-5 sm:px-10 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/login" className="inline-flex items-center gap-2.5 mb-8">
          <span className="h-9 w-9 rounded-full overflow-hidden bg-white shadow-sm border border-grafito/10 flex items-center justify-center shrink-0">
            <LogoBadge size={36} bg="#ffffff" fg="#8f1c17" />
          </span>
          <span className="font-display text-base font-bold text-grafito">Grand Prix</span>
        </Link>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-grafito">
          Política de Privacidad
        </h1>
        <TitleAccent className="w-10 h-1 mt-2 mb-1" />
        <p className="text-xs text-grafito/50 mb-8">Última actualización: septiembre de 2026</p>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-7 text-sm text-grafito/75 leading-relaxed">
          <p>
            En Grand Prix – Escuela de Manejo (Lima, Perú) usamos esta app solo para gestionar tus
            clases, tu agenda y tus pagos. Esta página explica qué datos te pedimos, para qué los
            usamos y qué derechos tienes sobre ellos.
          </p>

          <section>
            <h2 className="font-display text-base font-bold text-grafito mb-2">
              1. Qué datos recopilamos
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nombre y apellido.</li>
              <li>Número de celular (es tu usuario para entrar a la app).</li>
              <li>
                Un PIN de 6 dígitos que tú mismo eliges. No lo guardamos como texto legible: queda
                cifrado por la misma infraestructura que usamos para el inicio de sesión (Supabase
                Auth), igual que cualquier contraseña.
              </li>
              <li>Tu historial de clases, horarios reservados y el estado de tus pagos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-grafito mb-2">
              2. Para qué los usamos
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Crear y proteger tu cuenta.</li>
              <li>Que puedas reservar, ver y cancelar tus clases.</li>
              <li>Coordinar contigo el pago de tu paquete por WhatsApp.</li>
              <li>
                Avisarte por correo o WhatsApp cuando tu clase esté cerca de empezar (solo si esa
                función está activa).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-grafito mb-2">
              3. Con quién se comparte
            </h2>
            <p>
              No vendemos ni compartimos tus datos con terceros para fines comerciales o
              publicitarios. Solo los procesan los proveedores que necesitamos para operar la
              app: Supabase (donde vive la base de datos, con conexión cifrada) y WhatsApp/tu
              correo, cuando te contactamos directamente a ti.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-grafito mb-2">
              4. Cuánto tiempo los guardamos
            </h2>
            <p>
              Mientras tengas una cuenta activa con nosotros. Si quieres que eliminemos tu cuenta
              y tus datos, escríbenos y lo hacemos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-grafito mb-2">
              5. Tus derechos
            </h2>
            <p>
              Conforme a la Ley N° 29733, Ley de Protección de Datos Personales del Perú, puedes
              pedirnos en cualquier momento: acceder a tus datos, corregirlos si están mal,
              cancelarlos (borrarlos) u oponerte a un uso específico. Para ejercer cualquiera de
              estos derechos, contáctanos por WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-grafito mb-2">6. Contacto</h2>
            <p>
              ¿Dudas sobre tus datos?{" "}
              <a
                href={`https://wa.me/${NUMERO_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-rojo font-semibold hover:text-rojo-oscuro"
              >
                Escríbenos por WhatsApp
              </a>
              .
            </p>
          </section>
        </div>

        <p className="text-center mt-8">
          <Link href="/login" className="text-sm text-rojo font-semibold hover:text-rojo-oscuro">
            ← Volver
          </Link>
        </p>
      </div>
    </main>
  );
}
