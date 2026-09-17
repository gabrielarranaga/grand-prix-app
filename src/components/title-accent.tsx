// Barra recta bajo un titulo: acento de marca simple, no una linea ondulada.
export function TitleAccent({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block rounded-full bg-gradient-to-r from-rojo to-rojo-oscuro ${className}`}
    />
  );
}
