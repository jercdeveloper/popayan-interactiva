import { describe, expect, it } from 'vitest';
import { aParametros, deParametros, planear, sumarDias, type Opcion, type Preferencias } from '../../src/lib/planificador';

const ruta = (id: string, gustos: Opcion['gustos'], base: number, extra: Partial<Opcion> = {}): Opcion => ({
  id,
  tipo: 'ruta',
  nombre: id,
  href: `/rutas/${id}`,
  bloques: 1,
  gustos,
  base,
  carro: false,
  detalle: '',
  ...extra,
});
const excursion = (id: string, gustos: Opcion['gustos'], bloques: Opcion['bloques'], extra: Partial<Opcion> = {}): Opcion => ({
  id,
  tipo: 'excursion',
  nombre: id,
  href: `/excursiones/${id}`,
  bloques,
  gustos,
  base: 1,
  carro: false,
  detalle: '',
  ...extra,
});

// Las mismas opciones que arma la página
const OPCIONES: Opcion[] = [
  ruta('templos', ['templos', 'historia'], 3, { centro: true }),
  ruta('proceres', ['historia', 'cultura'], 3, { centro: true }),
  ruta('semana-santa', ['templos', 'cultura'], 1),
  ruta('gobierno', ['historia'], 1),
  ruta('gastronomia', ['comida', 'cultura'], 2),
  ruta('puentes-y-morro', ['naturaleza', 'historia'], 2),
  ruta('arte-sagrado', ['templos', 'cultura'], 1),
  ruta('haciendas', ['historia', 'naturaleza'], 1, { bloques: 2, carro: true }),
  excursion('silvia', ['cultura', 'naturaleza'], 2, { mejorDia: 2, base: 2 }),
  excursion('coconuco', ['naturaleza'], 1),
  excursion('purace', ['naturaleza'], 2, { base: 0 }),
  excursion('tierradentro', ['historia', 'cultura'], 4, { base: 0 }),
];

const prefs = (p: Partial<Preferencias>): Preferencias => ({ dias: 2, carro: false, gustos: [], ...p });
const ids = (dias: ReturnType<typeof planear>) =>
  dias.flatMap((d) => [d.manana, d.tarde, d.diaEntero]).filter(Boolean).map((o) => o!.id);

describe('el plan', () => {
  it('la primera mañana es una ruta del centro', () => {
    const [dia1] = planear(prefs({ dias: 1 }), OPCIONES);
    expect(['templos', 'proceres']).toContain(dia1.manana?.id);
  });

  it('a quien le gustan los templos le toca la Ruta de los templos primero', () => {
    const [dia1] = planear(prefs({ dias: 1, gustos: ['templos'] }), OPCIONES);
    expect(dia1.manana?.id).toBe('templos');
  });

  it('un viaje de un día no lleva excursiones ni días enteros', () => {
    const [dia] = planear(prefs({ dias: 1, gustos: ['naturaleza'], carro: true }), OPCIONES);
    expect(dia.diaEntero).toBeNull();
    expect(dia.manana?.tipo).toBe('ruta');
    expect(dia.tarde?.tipo).toBe('ruta');
  });

  it('la comida trae la ruta gastronómica', () => {
    expect(ids(planear(prefs({ dias: 1, gustos: ['comida'] }), OPCIONES))).toContain('gastronomia');
  });

  it('sin carro no aparece la Ruta de las haciendas', () => {
    expect(ids(planear(prefs({ dias: 3, gustos: ['historia', 'naturaleza'] }), OPCIONES))).not.toContain('haciendas');
  });

  it('con carro, las haciendas ocupan un día entero que no es el primero', () => {
    const dias = planear(prefs({ dias: 3, carro: true, gustos: ['historia', 'naturaleza'] }), OPCIONES);
    const conHaciendas = dias.find((d) => d.diaEntero?.id === 'haciendas');
    expect(conHaciendas).toBeDefined();
    expect(conHaciendas!.numero).toBeGreaterThan(1);
  });

  it('si el viaje pasa por un martes, Silvia va ese martes', () => {
    // El 26 de octubre de 2027 es martes
    const dias = planear(prefs({ dias: 3, desde: '2027-10-25', gustos: ['cultura'] }), OPCIONES);
    const silvia = dias.find((d) => d.diaEntero?.id === 'silvia');
    expect(silvia?.fecha).toBe('2027-10-26');
  });

  it('Silvia el martes no desplaza la ruta del centro: va otro día', () => {
    // Llega un martes: el martes es Silvia y la ruta del centro pasa al día siguiente
    const dias = planear(prefs({ dias: 2, desde: '2027-10-26', gustos: ['cultura'] }), OPCIONES);
    expect(dias[0].diaEntero?.id).toBe('silvia');
    expect(['templos', 'proceres']).toContain(dias[1].manana?.id);
  });

  it('Tierradentro nunca entra solo en el plan: necesita dormir allá', () => {
    expect(ids(planear(prefs({ dias: 3, gustos: ['historia', 'cultura'] }), OPCIONES))).not.toContain('tierradentro');
  });

  it('nada se repite', () => {
    for (const dias of [1, 2, 3] as const) {
      const lista = ids(planear(prefs({ dias, carro: true, gustos: ['naturaleza', 'cultura'] }), OPCIONES));
      expect(new Set(lista).size).toBe(lista.length);
    }
  });

  it('con fecha, cada día lleva la suya y las noches de la agenda', () => {
    const dias = planear(prefs({ dias: 2, desde: '2027-03-25' }), OPCIONES, (f) =>
      f === '2027-03-26' ? [{ titulo: 'Procesión del Santo Entierro', href: '/semana-santa/viernes-santo' }] : [],
    );
    expect(dias.map((d) => d.fecha)).toEqual(['2027-03-25', '2027-03-26']);
    expect(dias[0].noche).toEqual([]);
    expect(dias[1].noche[0].titulo).toBe('Procesión del Santo Entierro');
  });

  it('suma días aunque cambie el mes', () => {
    expect(sumarDias('2027-03-31', 1)).toBe('2027-04-01');
  });
});

describe('el plan en la dirección', () => {
  it('ida y vuelta', () => {
    const p: Preferencias = { dias: 3, desde: '2027-03-21', carro: true, gustos: ['templos', 'comida'] };
    expect(deParametros(new URLSearchParams(aParametros(p)))).toEqual(p);
  });

  it('descarta lo que no reconoce', () => {
    const p = deParametros(new URLSearchParams('dias=9&desde=ayer&gustos=templos,karaoke'));
    expect(p).toEqual({ dias: 2, desde: undefined, carro: false, gustos: ['templos'] });
  });

  it('sin días en la dirección, no hay plan guardado', () => {
    expect(deParametros(new URLSearchParams(''))).toBeNull();
  });
});

describe('las noches', () => {
  it('lo que dura varios días se nombra una sola vez', () => {
    const festival = { titulo: 'Festival', href: '/agenda' };
    const dias = planear(prefs({ dias: 3, desde: '2027-03-23' }), OPCIONES, () => [festival]);
    expect(dias.map((d) => d.noche.length)).toEqual([1, 0, 0]);
  });

  it('cada cosa dice en qué parte del día es', async () => {
    const { parteDelDia } = await import('../../src/lib/semana-santa');
    expect(parteDelDia('10:00')).toBe('Mañana');
    expect(parteDelDia('Por la tarde')).toBe('Tarde');
    expect(parteDelDia('20:00')).toBe('Noche');
  });
});

describe('el orden de la noche', () => {
  it('lo de la tarde va antes que lo de la noche', () => {
    const dias = planear(prefs({ dias: 1, desde: '2027-03-24' }), OPCIONES, () => [
      { titulo: 'Amo Jesús', href: '/a', cuando: 'Noche' },
      { titulo: 'Procesión Chiquita', href: '/b', cuando: 'Tarde' },
    ]);
    expect(dias[0].noche.map((n) => n.titulo)).toEqual(['Procesión Chiquita', 'Amo Jesús']);
  });
});

describe('los días enteros', () => {
  it('a igual puntaje no los desplazan los medios días', () => {
    const dias = planear(prefs({ dias: 3, carro: true, gustos: ['naturaleza'] }), OPCIONES);
    expect(ids(dias)).toContain('haciendas');
  });
});
