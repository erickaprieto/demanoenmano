/**
 * Subconjunto demo de provincia → cantón → distrito (CR) para selects en cascada.
 * En producción reemplazar por dataset oficial o API.
 */

export type UbicacionOption = { id: string; label: string };

export const PROVINCIAS_CR: UbicacionOption[] = [
  { id: "1", label: "San José" },
  { id: "2", label: "Alajuela" },
  { id: "3", label: "Cartago" },
  { id: "4", label: "Heredia" },
  { id: "5", label: "Guanacaste" },
  { id: "6", label: "Puntarenas" },
  { id: "7", label: "Limón" },
];

/** id cantón único: `${provinciaId}-${cantonSlug}` */
export const CANTONES_BY_PROVINCIA: Record<string, UbicacionOption[]> = {
  "1": [
    { id: "1-sj", label: "San José" },
    { id: "1-esc", label: "Escazú" },
    { id: "1-des", label: "Desamparados" },
    { id: "1-mor", label: "Moravia" },
  ],
  "2": [
    { id: "2-ala", label: "Alajuela" },
    { id: "2-sr", label: "San Ramón" },
    { id: "2-gre", label: "Grecia" },
  ],
  "3": [
    { id: "3-car", label: "Cartago" },
    { id: "3-para", label: "Paraíso" },
  ],
  "4": [
    { id: "4-her", label: "Heredia" },
    { id: "4-sb", label: "Santa Bárbara" },
  ],
  "5": [
    { id: "5-lib", label: "Liberia" },
    { id: "5-nic", label: "Nicoya" },
  ],
  "6": [
    { id: "6-pun", label: "Puntarenas" },
    { id: "6-esp", label: "Esparza" },
  ],
  "7": [
    { id: "7-lim", label: "Limón" },
    { id: "7-poc", label: "Pococí" },
  ],
};

export const DISTRITOS_BY_CANTON: Record<string, UbicacionOption[]> = {
  "1-sj": [
    { id: "carmen", label: "Carmen" },
    { id: "merced", label: "Merced" },
    { id: "hospital", label: "Hospital" },
    { id: "catedral", label: "Catedral" },
  ],
  "1-esc": [
    { id: "esc-1", label: "Escazú" },
    { id: "esc-2", label: "San Rafael" },
    { id: "esc-3", label: "San Antonio" },
  ],
  "1-des": [
    { id: "des-1", label: "Desamparados" },
    { id: "des-2", label: "San Miguel" },
    { id: "des-3", label: "San Juan de Dios" },
  ],
  "1-mor": [
    { id: "mor-1", label: "San Vicente" },
    { id: "mor-2", label: "San Jerónimo" },
  ],
  "2-ala": [
    { id: "ala-1", label: "Alajuela" },
    { id: "ala-2", label: "San José" },
    { id: "ala-3", label: "Carrizal" },
  ],
  "2-sr": [
    { id: "sr-1", label: "San Ramón" },
    { id: "sr-2", label: "San Rafael" },
  ],
  "2-gre": [
    { id: "gre-1", label: "Grecia" },
    { id: "gre-2", label: "San Isidro" },
  ],
  "3-car": [
    { id: "car-1", label: "Oriental" },
    { id: "car-2", label: "Occidental" },
    { id: "car-3", label: "Carmen" },
  ],
  "3-para": [
    { id: "para-1", label: "Paraíso" },
    { id: "para-2", label: "Santiago" },
  ],
  "4-her": [
    { id: "her-1", label: "Heredia" },
    { id: "her-2", label: "Mercedes" },
  ],
  "4-sb": [
    { id: "sb-1", label: "Santa Bárbara" },
    { id: "sb-2", label: "San Pedro" },
  ],
  "5-lib": [
    { id: "lib-1", label: "Liberia" },
    { id: "lib-2", label: "Cañas Dulces" },
  ],
  "5-nic": [
    { id: "nic-1", label: "Nicoya" },
    { id: "nic-2", label: "Mansión" },
  ],
  "6-pun": [
    { id: "pun-1", label: "Puntarenas" },
    { id: "pun-2", label: "Pitahaya" },
  ],
  "6-esp": [
    { id: "esp-1", label: "Esparza" },
    { id: "esp-2", label: "San Juan Grande" },
  ],
  "7-lim": [
    { id: "lim-1", label: "Limón" },
    { id: "lim-2", label: "Valle La Estrella" },
  ],
  "7-poc": [
    { id: "poc-1", label: "Guápiles" },
    { id: "poc-2", label: "La Rita" },
  ],
};
