/**
 * Esquinas del Centro Histórico por las que pasan las procesiones, como [latitud, longitud].
 * Salen del cruce de las calles con nombre en las teselas propias del mapa (datos de OpenStreetMap).
 * La clave dice la carrera y la calle: "cra7-cl5" es la Carrera 7 con Calle 5.
 */
export const ESQUINAS = {
  'cra3-cl4': [2.441361, -76.603082],
  'cra4-cl4': [2.441635, -76.603955],
  'cra5-cl4': [2.441903, -76.604836],
  'cra6-cl4': [2.442197, -76.605692],
  'cra8-cl4': [2.442764, -76.60746],
  'cra9-cl4': [2.443071, -76.60832],
  'cra10-cl4': [2.443349, -76.609199],
  'cra3-cl5': [2.44049, -76.603372],
  'cra4-cl5': [2.440769, -76.604257],
  'cra5-cl5': [2.441048, -76.605141],
  'cra6-cl5': [2.441324, -76.606016],
  'cra7-cl5': [2.441592, -76.606915],
  'cra8-cl5': [2.4419, -76.607787],
  'cra9-cl5': [2.442179, -76.608654],
  'cra10-cl5': [2.442457, -76.609516],
  'cra6-cl6': [2.44044, -76.606333],
  'cra6-cl7': [2.439662, -76.606625],
  'cra7-cl7': [2.439973, -76.607516],
} as const satisfies Record<string, readonly [number, number]>;

export type Esquina = keyof typeof ESQUINAS;

/** Carrera y calle de una esquina, para saber si dos esquinas están sobre la misma vía. */
export function viasDe(esquina: string) {
  const m = esquina.match(/^cra(\d+)-cl(\d+)$/);
  if (!m) throw new Error(`Esquina mal escrita: ${esquina}`);
  return { carrera: Number(m[1]), calle: Number(m[2]) };
}

/** Nombre legible de una esquina: "Carrera 7 con Calle 5" */
export function nombreDeEsquina(esquina: string) {
  const { carrera, calle } = viasDe(esquina);
  return `Carrera ${carrera} con Calle ${calle}`;
}
