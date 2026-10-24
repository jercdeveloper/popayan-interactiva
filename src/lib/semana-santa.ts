/**
 * Lo que comparten las páginas de Semana Santa: el trazado de cada procesión, las calles por las que
 * pasa y en qué momento de la semana estamos. No depende de Astro: también lo usa el navegador.
 */
import { ESQUINAS, viasDe, type Esquina } from './esquinas';
import { anioDeLaProxima, desdePascua } from './pascua';

/** La línea de la procesión: del templo a la primera esquina, el circuito y de vuelta al templo. */
export function trazadoDe(recorrido: string[], templo: [number, number]): [number, number][] {
  return [templo, ...recorrido.map((e) => [...ESQUINAS[e as Esquina]] as [number, number]), templo];
}

/** Las vías en el orden en que las recorre: "Carrera 7", "Calle 5", "Carrera 10"… */
export function viasDelRecorrido(recorrido: string[]): string[] {
  const vias: string[] = [];
  for (let i = 1; i < recorrido.length; i++) {
    const a = viasDe(recorrido[i - 1]);
    const b = viasDe(recorrido[i]);
    const via = a.carrera === b.carrera ? `Carrera ${a.carrera}` : `Calle ${a.calle}`;
    if (vias.at(-1) !== via) vias.push(via);
  }
  return vias;
}

/** Une una lista en español: "a, b y c" */
export const enLista = (cosas: string[]) =>
  cosas.length < 2 ? (cosas[0] ?? '') : `${cosas.slice(0, -1).join(', ')} y ${cosas.at(-1)}`;

export type Momento =
  | { tipo: 'antes'; anio: number; dias: number }
  | { tipo: 'durante'; anio: number; desdePascua: number };

/**
 * Dónde estamos frente a la Semana Santa el día `hoy` ("AAAA-MM-DD"): cuántos días faltan para el
 * Domingo de Ramos o, durante la semana, qué día es (en días desde el Domingo de Pascua).
 */
export function momento(hoy: string): Momento {
  let anio = anioDeLaProxima(hoy);
  // El Domingo de Pascua ya no hay procesiones: cuenta la del año siguiente
  if (hoy > desdePascua(anio, -1)) anio++;
  const ramos = desdePascua(anio, -7);
  const dia = 86_400_000;
  const dias = Math.round((Date.parse(`${ramos}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / dia);
  return dias > 0 ? { tipo: 'antes', anio, dias } : { tipo: 'durante', anio, desdePascua: -7 - dias };
}

/** "20:00" → "8:00 p. m.", sin saltos de línea; un texto ("Por la tarde") queda en minúscula */
export function horaLegible(hora: string) {
  const m = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hora.charAt(0).toLowerCase() + hora.slice(1);
  const h = Number(m[1]);
  const doce = h % 12 || 12;
  return `${doce}:${m[2]} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}
