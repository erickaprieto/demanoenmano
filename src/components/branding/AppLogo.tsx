import Image from "next/image";

type AppLogoProps = {
  /** Ancho de referencia en px (el PNG no es cuadrado; la altura se deriva del aspect ratio). */
  size?: number;
  className?: string;
  priority?: boolean;
};

/** Píxeles intrínsecos de `/public/demanoenmano-neon-logo.png` (actualizar si cambiás el asset). */
const LOGO_NATURAL_W = 552;
const LOGO_NATURAL_H = 452;

/** Logo De Mano en Mano — diseño circular; el PNG es rectangular (552×452) con el círculo dentro. */
export function AppLogo({ size = 80, className = "", priority }: AppLogoProps) {
  const width = size;
  const height = Math.max(1, Math.round((size * LOGO_NATURAL_H) / LOGO_NATURAL_W));

  return (
    <Image
      src="/demanoenmano-neon-logo.png"
      alt="De Mano en Mano: apretón de manos en neón cian y magenta dentro de un símbolo circular de reciclaje"
      width={width}
      height={height}
      sizes={`${width}px`}
      priority={priority}
      className={`object-contain ${className}`.trim()}
    />
  );
}
