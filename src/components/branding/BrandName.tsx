import { Fragment, type ReactNode } from "react";

const MARK = "De Mano en Mano";

export type BrandNameProps = {
  className?: string;
};

/** Nombre de la marca en itálica dentro de frases y títulos. */
export function BrandName({ className = "" }: BrandNameProps) {
  return <span className={`italic ${className}`.trim()}>{MARK}</span>;
}

/**
 * Reemplaza cada aparición literal de "De Mano en Mano" en un string por {@link BrandName}.
 * Si no aparece la marca, devuelve el texto sin cambios.
 */
export function textWithBrandItalic(text: string): ReactNode {
  if (!text.includes(MARK)) return text;
  const parts = text.split(MARK);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={`b-${i}`}>
          {part}
          {i < parts.length - 1 ? <BrandName /> : null}
        </Fragment>
      ))}
    </>
  );
}
