/**
 * El Planificador de viaje: arma de 1 a 3 días con las rutas y las excursiones que ya existen.
 * No inventa nada: elige y ordena. Las reglas, en orden:
 * 1. Las excursiones que tienen su día (el mercado de Silvia es el martes) van ese día, si cae en el viaje.
 * 2. La primera mañana es una ruta del centro, para ubicarse.
 * 3. El resto se llena por gusto: cada coincidencia con lo que le gusta al visitante suma.
 * 4. Las excursiones de día entero no se comen el primer día si hay más, y no entran en un viaje de un día.
 * 5. Con fecha, las noches se llenan con lo que diga la agenda (procesiones, festivales).
 * No depende de Astro: corre al compilar (el plan de ejemplo) y en el navegador.
 */

export const GUSTOS = ['historia', 'templos', 'comida', 'naturaleza', 'cultura'] as const;
export type Gusto = (typeof GUSTOS)[number];

export interface Opcion {
  id: string;
  tipo: 'ruta' | 'excursion';
  nombre: string;
  href: string;
  /** Medios días que ocupa: 1 (mañana o tarde), 2 (el día entero), 4 (dos días: no entra solo en el plan) */
  bloques: 1 | 2 | 4;
  gustos: Gusto[];
  /** Prioridad propia, antes de los gustos: las rutas esenciales pesan más */
  base: number;
  /** Necesita carro (la Ruta de las haciendas) */
  carro: boolean;
  /** Las rutas del centro, candidatas a la primera mañana */
  centro?: boolean;
  /** 0 domingo … 6 sábado */
  mejorDia?: number;
  /** Texto corto para la tarjeta: "2 h 45 min a pie", "Día completo" */
  detalle: string;
  icono?: string;
  miniatura?: string | null;
}

export interface Preferencias {
  dias: 1 | 2 | 3;
  /** Día de llegada, "AAAA-MM-DD" */
  desde?: string;
  carro: boolean;
  gustos: Gusto[];
}

export interface Noche {
  titulo: string;
  href: string;
  detalle?: string;
  /** Cuándo es: "Noche", "Tarde", "En la agenda"… */
  cuando?: string;
}

export interface Dia {
  numero: number;
  fecha?: string;
  manana: Opcion | null;
  tarde: Opcion | null;
  /** Una excursión o ruta que ocupa el día entero (entonces mañana y tarde van vacías) */
  diaEntero: Opcion | null;
  noche: Noche[];
}

const DIA_MS = 86_400_000;
export const sumarDias = (iso: string, n: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10);
const diaDeLaSemana = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

export function puntaje(o: Opcion, gustos: Gusto[]) {
  return o.base + 2 * o.gustos.filter((g) => gustos.includes(g)).length;
}

export function planear(prefs: Preferencias, opciones: Opcion[], nochesDe?: (fecha: string) => Noche[]): Dia[] {
  const dias: Dia[] = Array.from({ length: prefs.dias }, (_, i) => ({
    numero: i + 1,
    fecha: prefs.desde ? sumarDias(prefs.desde, i) : undefined,
    manana: null,
    tarde: null,
    diaEntero: null,
    noche: [],
  }));
  const usadas = new Set<string>();
  const posibles = opciones.filter((o) => o.bloques !== 4 && (prefs.carro || !o.carro));
  const libre = (d: Dia) => !d.manana && !d.tarde && !d.diaEntero;

  // 1. Las excursiones con su día, si ese día cae en el viaje y el viaje es de más de un día
  if (prefs.dias > 1) {
    for (const o of posibles.filter((o) => o.mejorDia !== undefined && o.bloques === 2)) {
      const dia = dias.find((d) => d.fecha && diaDeLaSemana(d.fecha) === o.mejorDia && libre(d));
      if (dia && o.gustos.some((g) => prefs.gustos.includes(g))) {
        dia.diaEntero = o;
        usadas.add(o.id);
      }
    }
  }

  // 2. La primera mañana libre: la mejor ruta del centro
  const primera = dias.find((d) => !d.diaEntero);
  const centro = posibles
    .filter((o) => o.centro)
    .sort((a, b) => puntaje(b, prefs.gustos) - puntaje(a, prefs.gustos))[0];
  if (primera && centro) {
    primera.manana = centro;
    usadas.add(centro.id);
  }

  // 3. El resto, por gusto. A igual puntaje se respeta el orden de las rutas.
  const candidatas = posibles
    .filter((o) => !usadas.has(o.id))
    // Las excursiones solo si el viaje es de más de un día y coinciden con algún gusto
    .filter((o) => o.tipo === 'ruta' || (prefs.dias > 1 && o.gustos.some((g) => prefs.gustos.includes(g))))
    .map((o, i) => ({ o, i, p: puntaje(o, prefs.gustos) }))
    // A igual puntaje, primero lo de día entero: los medios días siempre caben en lo que quede
    .sort((a, b) => b.p - a.p || b.o.bloques - a.o.bloques || a.i - b.i);

  for (const { o } of candidatas) {
    if (o.bloques === 2) {
      // El día entero: mejor después del primero
      const dia = dias.slice(1).find(libre) ?? (prefs.dias === 1 ? undefined : dias.find(libre));
      if (dia) {
        dia.diaEntero = o;
        usadas.add(o.id);
      }
    } else {
      const dia = dias.find((d) => !d.diaEntero && (!d.manana || !d.tarde));
      if (dia) {
        if (!dia.manana) dia.manana = o;
        else dia.tarde = o;
        usadas.add(o.id);
      }
    }
  }

  // 5. Las noches, con la agenda. Lo que dura varios días se nombra solo el primer día del viaje
  if (nochesDe) {
    const vistos = new Set<string>();
    for (const d of dias) {
      if (!d.fecha) continue;
      d.noche = nochesDe(d.fecha).filter((n) => {
        const clave = `${n.href}|${n.titulo}`;
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
      });
      // En el orden del día: lo de la tarde antes que lo de la noche
      const ORDEN = ['Mañana', 'Tarde', 'Noche', 'En la agenda'];
      const rango = (n: Noche) => (ORDEN.includes(n.cuando ?? 'Noche') ? ORDEN.indexOf(n.cuando ?? 'Noche') : 2);
      d.noche.sort((x, y) => rango(x) - rango(y));
    }
  }
  return dias;
}

/** Las preferencias en la dirección de la página, para compartir el plan: ?dias=2&desde=…&carro=1&gustos=… */
export function aParametros(p: Preferencias) {
  const q = new URLSearchParams({ dias: String(p.dias) });
  if (p.desde) q.set('desde', p.desde);
  if (p.carro) q.set('carro', '1');
  if (p.gustos.length) q.set('gustos', p.gustos.join(','));
  return q.toString();
}

export function deParametros(q: URLSearchParams): Preferencias | null {
  if (!q.has('dias')) return null;
  const dias = Number(q.get('dias'));
  const desde = q.get('desde') ?? '';
  return {
    dias: dias === 1 || dias === 3 ? dias : 2,
    desde: /^\d{4}-\d{2}-\d{2}$/.test(desde) ? desde : undefined,
    carro: q.get('carro') === '1',
    gustos: (q.get('gustos') ?? '').split(',').filter((g): g is Gusto => (GUSTOS as readonly string[]).includes(g)),
  };
}
