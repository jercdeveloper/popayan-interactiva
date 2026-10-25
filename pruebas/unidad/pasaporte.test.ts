import { describe, expect, it } from 'vitest';
import {
  CLAVE,
  exportar,
  guardar,
  importar,
  leer,
  radioDe,
  revisarUbicacion,
  sellar,
  unir,
  type Sellos,
} from '../../src/lib/pasaporte';
import { codigoDeSello } from '../../src/lib/codigo-sello';
import { lugares } from './contenido';

/** Un almacenamiento en memoria, como localStorage */
function memoria(inicial: Record<string, string> = {}) {
  const datos = { ...inicial };
  return {
    getItem: (k: string) => datos[k] ?? null,
    setItem: (k: string, v: string) => void (datos[k] = v),
    datos,
  };
}

const validos = new Set(lugares.map((l) => l.id));

describe('cuándo se puede sellar', () => {
  it('cerca del lugar, sí', () => {
    expect(revisarUbicacion(30, 10, 40)).toEqual({ estado: 'cerca' });
  });

  it('el margen de error del GPS juega a favor del visitante, hasta 50 m', () => {
    expect(revisarUbicacion(70, 35, 40)).toEqual({ estado: 'cerca' });
    expect(revisarUbicacion(120, 500, 40)).toEqual({ estado: 'impreciso' });
  });

  it('lejos, dice cuánto falta', () => {
    expect(revisarUbicacion(400, 8, 40)).toEqual({ estado: 'lejos', metros: 360 });
  });

  it('los lugares grandes se sellan desde más lejos', () => {
    expect(radioDe('hacienda')).toBeGreaterThan(radioDe('templo'));
    expect(radioDe('plaza')).toBeGreaterThan(radioDe('templo'));
    for (const l of lugares) expect(radioDe(l.categoria), l.id).toBeGreaterThanOrEqual(40);
  });
});

describe('los sellos', () => {
  it('se guardan y se leen', () => {
    const almacen = memoria();
    const sellos = sellar({}, 'la-ermita', 'ubicacion', '2026-10-24');
    expect(guardar(almacen, sellos)).toBe(true);
    expect(leer(almacen)).toEqual({ 'la-ermita': { fecha: '2026-10-24', modo: 'ubicacion' } });
  });

  it('sellar dos veces conserva el primer sello', () => {
    const una = sellar({}, 'la-ermita', 'qr', '2026-10-24');
    expect(sellar(una, 'la-ermita', 'ubicacion', '2026-11-01')).toEqual(una);
  });

  it('datos dañados no rompen el pasaporte', () => {
    expect(leer(memoria({ [CLAVE]: '{no es json' }))).toEqual({});
    expect(leer(memoria({ [CLAVE]: JSON.stringify({ x: { fecha: 'ayer', modo: 'magia' } }) }))).toEqual({});
    expect(leer(null)).toEqual({});
  });

  it('si el navegador no deja guardar, lo avisa', () => {
    const lleno = { setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(guardar(lleno, {})).toBe(false);
  });
});

describe('copia de seguridad', () => {
  const sellos: Sellos = {
    'la-ermita': { fecha: '2026-10-24', modo: 'ubicacion' },
    'torre-del-reloj': { fecha: '2026-10-25', modo: 'qr' },
  };

  it('el código devuelve los mismos sellos', () => {
    const codigo = exportar(sellos);
    expect(codigo).toMatch(/^PI1\.[A-Za-z0-9_-]+$/);
    expect(importar(codigo, validos)).toEqual(sellos);
  });

  it('aguanta espacios y saltos de línea al pegarlo', () => {
    expect(importar(`\n  ${exportar(sellos)}  \n`, validos)).toEqual(sellos);
  });

  it('rechaza lo que no es un código del pasaporte', () => {
    expect(importar('hola', validos)).toBeNull();
    expect(importar('PI1.@@@', validos)).toBeNull();
  });

  it('ignora lugares que no existen', () => {
    const codigo = exportar({ ...sellos, 'lugar-inventado': { fecha: '2026-10-24', modo: 'qr' } });
    expect(importar(codigo, validos)).toEqual(sellos);
  });

  it('al unir dos pasaportes queda el sello más antiguo de cada lugar', () => {
    const otro: Sellos = { 'la-ermita': { fecha: '2026-09-01', modo: 'qr' }, catedral: { fecha: '2026-10-01', modo: 'ubicacion' } };
    expect(unir(sellos, otro)).toEqual({
      'la-ermita': { fecha: '2026-09-01', modo: 'qr' },
      'torre-del-reloj': sellos['torre-del-reloj'],
      catedral: otro.catedral,
    });
  });
});

describe('códigos QR', () => {
  it('cada lugar tiene un código distinto, siempre el mismo', () => {
    const codigos = lugares.map((l) => codigoDeSello(l.id));
    expect(new Set(codigos).size).toBe(lugares.length);
    expect(codigoDeSello('la-ermita')).toBe(codigoDeSello('la-ermita'));
    expect(codigoDeSello('la-ermita')).toMatch(/^[0-9a-f]{8}$/);
  });
});
