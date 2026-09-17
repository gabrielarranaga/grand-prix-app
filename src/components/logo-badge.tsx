// Isotipo vectorial de Grand Prix (bandera a cuadros) en un circulo, para usar
// como marca en UI chrome (header, login) donde el logo cuadrado con texto no
// entra bien. Vectorial: nunca se ve pixelado sin importar el tamaño.
export function LogoBadge({
  size = 40,
  bg = "#7A1F22",
  fg = "#F7F0E6",
  className,
}: {
  size?: number;
  bg?: string;
  fg?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="Grand Prix"
      className={className}
    >
      <circle cx="28" cy="28" r="28" fill={bg} />
      <g fill={fg}>
        <rect x="14" y="14" width="9" height="9" />
        <rect x="33" y="14" width="9" height="9" />
        <rect x="23.5" y="23.5" width="9" height="9" />
        <rect x="14" y="33" width="9" height="9" />
        <rect x="33" y="33" width="9" height="9" />
      </g>
    </svg>
  );
}
