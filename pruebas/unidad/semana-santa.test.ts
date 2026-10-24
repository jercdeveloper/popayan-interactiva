import { describe, expect, it } from 'vitest';
import { anioDeLaProxima, desdePascua, domingoDePascua } from '../../src/lib/pascua';
import { ESQUINAS, viasDe } from '../../src/lib/esquinas';
import { momento, viasDelRecorrido, enLista } from '../../src/lib/semana-santa';
import { distanciaMetros } from '../../src/lib/recorrido';
import { eventos, lugares, procesiones } from './contenido';

describe('Domingo de Pascua', () => {
  it('coincide con el calendario de varios años', () => {
    expect(domingoDePascua(2024)).toBe('2024-03-31');
    expect(domingoDePascua(2025)).toBe('2025-04-20');
    expect(domingoDePascua(2026)).toBe('2026-04-05');
    expect(domingoDePascua(2027)).toBe('2027-03-28');
    expect(domingoDePascua(2028)).toBe('2028-04-16');
    expect(domingoDePascua(2038)).toBe('2038-04-25');
  });

  it('cuenta los días antes de la Pascua', () => {
    expect(desdePascua(2027, -7)).toBe('2027-03-21');
    expect(desdePascua(2027, -2)).toBe('2027-03-26');
    // Cruza de mes
    expect(desdePascua(2026, -7)).toBe('2026-03-29');
  });

  it('la próxima Semana Santa es la de este año hasta su Pascua', () => {
    expect(anioDeLaProxima('2026-10-24')).toBe(2027);
    expect(anioDeLaProxima('2027-03-28')).toBe(2027);
    expect(anioDeLaProxima('2027-03-29')).toBe(2028);
  });
});

describe('momento de la semana', () => {
  it('antes cuenta los días hasta el Domingo de Ramos', () => {
    expect(momento('2027-03-20')).toEqual({ tipo: 'antes', anio: 2027, dias: 1 });
  });

  it('durante la semana dice qué día es', () => {
    expect(momento('2027-03-21')).toEqual({ tipo: 'durante', anio: 2027, desdePascua: -7 });
    expect(momento('2027-03-26')).toEqual({ tipo: 'durante', anio: 2027, desdePascua: -2 });
  });

  it('el Domingo de Pascua ya cuenta hacia la del año siguiente', () => {
    const m = momento('2027-03-28');
    expect(m.tipo).toBe('antes');
    expect(m.anio).toBe(2028);
  });
});

describe('recorridos de las procesiones', () => {
  const conRecorrido = procesiones.filter((p) => p.recorrido);

  it('las cinco noches de la Junta tienen recorrido', () => {
    expect(conRecorrido.map((p) => p.id).sort()).toEqual(
      ['jueves-santo', 'martes-santo', 'miercoles-santo', 'sabado-santo', 'viernes-santo'],
    );
  });

  it('cada esquina existe', () => {
    for (const p of conRecorrido) for (const e of p.recorrido!) expect(e in ESQUINAS, `${p.id}: ${e}`).toBe(true);
  });

  it('va por las calles: dos esquinas seguidas comparten carrera o calle', () => {
    for (const p of conRecorrido) {
      const r = p.recorrido!;
      for (let i = 1; i < r.length; i++) {
        const a = viasDe(r[i - 1]);
        const b = viasDe(r[i]);
        expect(a.carrera === b.carrera || a.calle === b.calle, `${p.id}: ${r[i - 1]} → ${r[i]}`).toBe(true);
      }
    }
  });

  it('vuelve a donde empezó', () => {
    for (const p of conRecorrido) expect(p.recorrido!.at(-1), p.id).toBe(p.recorrido![0]);
  });

  it('empieza a menos de una cuadra y media de su templo', () => {
    for (const p of conRecorrido) {
      const templo = lugares.find((l) => l.id === p.templo)!;
      const inicio = ESQUINAS[p.recorrido![0] as keyof typeof ESQUINAS];
      expect(distanciaMetros(templo.coordenadas, [...inicio]), p.id).toBeLessThan(150);
    }
  });

  it('todas las noches recorren el mismo circuito de unos dos kilómetros', () => {
    for (const p of conRecorrido) {
      const r = p.recorrido!;
      let metros = 0;
      for (let i = 1; i < r.length; i++) {
        metros += distanciaMetros([...ESQUINAS[r[i - 1] as keyof typeof ESQUINAS]], [...ESQUINAS[r[i] as keyof typeof ESQUINAS]]);
      }
      expect(metros, p.id).toBeGreaterThan(1800);
      expect(metros, p.id).toBeLessThan(2600);
    }
  });

  it('nombra las vías en orden', () => {
    const martes = procesiones.find((p) => p.id === 'martes-santo')!;
    expect(viasDelRecorrido(martes.recorrido!)).toEqual([
      'Carrera 7', 'Calle 5', 'Carrera 10', 'Calle 4', 'Carrera 3', 'Calle 5', 'Carrera 6', 'Calle 7',
    ]);
    expect(enLista(['a', 'b', 'c'])).toBe('a, b y c');
  });
});

describe('datos de las procesiones', () => {
  it('los templos existen', () => {
    for (const p of procesiones) {
      expect(lugares.some((l) => l.id === p.templo), p.id).toBe(true);
      if (p.destino) expect(lugares.some((l) => l.id === p.destino), p.id).toBe(true);
    }
  });

  it('el orden no se repite', () => {
    expect(new Set(procesiones.map((p) => p.orden)).size).toBe(procesiones.length);
  });

  it('ningún paso se repite dentro de una procesión', () => {
    for (const p of procesiones) expect(new Set(p.pasos.map((x) => x.nombre)).size, p.id).toBe(p.pasos.length);
  });

  it('coinciden con las noches de la agenda', () => {
    const semana = eventos.find((e) => e.id.startsWith('semana-santa-') && e.jornadas)!;
    const anio = Number(semana.inicio.slice(0, 4));
    for (const p of procesiones) {
      const fecha = desdePascua(anio, p.desdePascua);
      expect(semana.jornadas!.some((j) => j.fecha === fecha), `${p.id}: ${fecha}`).toBe(true);
    }
  });
});

describe('horas', () => {
  it('se escriben como en Colombia y no se parten', async () => {
    const { horaLegible } = await import('../../src/lib/semana-santa');
    expect(horaLegible('20:00')).toBe('8:00 p. m.');
    expect(horaLegible('10:00')).toBe('10:00 a. m.');
    expect(horaLegible('12:30')).toBe('12:30 p. m.');
    expect(horaLegible('Por la tarde')).toBe('por la tarde');
  });
});
