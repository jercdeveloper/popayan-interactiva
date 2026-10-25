/**
 * El Pasaporte de Popayán, sin cuentas ni servidor: los sellos viven en el teléfono.
 * De cada sello se guarda solo qué lugar, qué día y cómo se ganó; la ubicación nunca se guarda.
 * Sin servidor no se pueden evitar las trampas: por eso los sellos no dan premios con valor (fase 3).
 */

export type Modo = 'ubicacion' | 'qr';
export interface Sello {
  /** "AAAA-MM-DD" */
  fecha: string;
  modo: Modo;
}
export type Sellos = Record<string, Sello>;

export const CLAVE = 'pasaporte-v1';
const PREFIJO = 'PI1.';

/**
 * A qué distancia del punto del lugar se puede sellar, en metros. Una hacienda o una plaza son grandes;
 * un templo se sella desde su atrio.
 */
export function radioDe(categoria: string) {
  if (categoria === 'hacienda') return 150;
  if (categoria === 'plaza') return 70;
  if (categoria === 'puente' || categoria === 'monumento') return 50;
  return 40;
}

export type Revision = { estado: 'cerca' } | { estado: 'lejos'; metros: number } | { estado: 'impreciso' };

/**
 * ¿Alcanza para sellar? Se le da al visitante el beneficio del margen de error del GPS, hasta 50 m.
 * Si el GPS tiene un error de más de 100 m, no se sabe si está cerca o lejos.
 */
export function revisarUbicacion(distancia: number, precision: number, radio: number): Revision {
  if (distancia - Math.min(precision, 50) <= radio) return { estado: 'cerca' };
  if (precision > 100) return { estado: 'impreciso' };
  return { estado: 'lejos', metros: Math.round((distancia - radio) / 10) * 10 };
}

const esFecha = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const esModo = (v: unknown): v is Modo => v === 'ubicacion' || v === 'qr';

/** Se queda solo con lo que tiene forma de sello; lo demás se descarta sin romper nada. */
function depurar(datos: unknown, validos?: Set<string>): Sellos {
  const sellos: Sellos = {};
  if (!datos || typeof datos !== 'object') return sellos;
  for (const [id, s] of Object.entries(datos as Record<string, unknown>)) {
    if (validos && !validos.has(id)) continue;
    const { fecha, modo } = (s ?? {}) as Record<string, unknown>;
    if (esFecha(fecha) && esModo(modo)) sellos[id] = { fecha, modo };
  }
  return sellos;
}

/** Lee los sellos guardados. Si el almacenamiento falla o está dañado, el pasaporte empieza vacío. */
export function leer(almacen: Pick<Storage, 'getItem'> | null | undefined): Sellos {
  try {
    const texto = almacen?.getItem(CLAVE);
    return texto ? depurar(JSON.parse(texto)) : {};
  } catch {
    return {};
  }
}

/** Guarda los sellos; devuelve false si el navegador no lo permite (modo privado, sin espacio). */
export function guardar(almacen: Pick<Storage, 'setItem'> | null | undefined, sellos: Sellos) {
  try {
    almacen?.setItem(CLAVE, JSON.stringify(sellos));
    return Boolean(almacen);
  } catch {
    return false;
  }
}

/** Sella un lugar. Si ya estaba sellado, se conserva el primer sello. */
export function sellar(sellos: Sellos, id: string, modo: Modo, hoy: string): Sellos {
  return sellos[id] ? sellos : { ...sellos, [id]: { fecha: hoy, modo } };
}

/** Une dos pasaportes (al recuperar una copia): de cada lugar queda el sello más antiguo. */
export function unir(a: Sellos, b: Sellos): Sellos {
  const salida: Sellos = { ...a };
  for (const [id, s] of Object.entries(b)) if (!salida[id] || s.fecha < salida[id].fecha) salida[id] = s;
  return salida;
}

/** Un código de texto con todos los sellos, para guardarlo o pasarlo a otro teléfono. */
export function exportar(sellos: Sellos): string {
  const compacto = Object.entries(sellos).map(([id, s]) => [id, s.fecha.replaceAll('-', ''), s.modo === 'qr' ? 1 : 0]);
  const base64 = btoa(JSON.stringify(compacto));
  return PREFIJO + base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Lee un código de copia; devuelve null si no es un código del pasaporte. Ignora lugares que no existen. */
export function importar(codigo: string, validos: Set<string>): Sellos | null {
  const limpio = codigo.trim();
  if (!limpio.startsWith(PREFIJO)) return null;
  try {
    const base64 = limpio.slice(PREFIJO.length).replaceAll('-', '+').replaceAll('_', '/');
    const compacto = JSON.parse(atob(base64));
    if (!Array.isArray(compacto)) return null;
    const datos: Record<string, Sello> = {};
    for (const fila of compacto) {
      if (!Array.isArray(fila) || typeof fila[0] !== 'string' || !/^\d{8}$/.test(String(fila[1]))) continue;
      const f = String(fila[1]);
      datos[fila[0]] = { fecha: `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6)}`, modo: fila[2] === 1 ? 'qr' : 'ubicacion' };
    }
    return depurar(datos, validos);
  } catch {
    return null;
  }
}

/** El día de hoy en el teléfono, "AAAA-MM-DD" */
export function hoyLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
