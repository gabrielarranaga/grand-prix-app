// Tira corta de bandera a cuadros bajo un titulo: la firma de la landing.
export function TitleAccent({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block !h-2 ${className}`}
      style={{
        background:
          "repeating-conic-gradient(var(--color-grafito) 0 25%, transparent 0 50%) 0 0 / 8px 8px",
      }}
    />
  );
}
