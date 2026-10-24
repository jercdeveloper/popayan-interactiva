import { describe, expect, it } from 'vitest';
import { distanciaMetros, formatearDistancia, formatearDuracion, medirRecorrido } from '../../src/lib/recorrido';

const TORRE: [number, number] = [2.441716, -76.606369];
const ERMITA: [number, number] = [2.440168, -76.602645];

describe('distanciaMetros', () => {
  it('es cero entre un punto y él mismo', () => {
    expect(distanciaMetros(TORRE, TORRE)).toBe(0);
  });

  it('es simétrica', () => {
    expect(distanciaMetros(TORRE, ERMITA)).toBeCloseTo(distanciaMetros(ERMITA, TORRE), 6);
  });

  it('mide unos 445 m entre la Torre del Reloj y La Ermita', () => {
    // Medido en OpenStreetMap: unas cuatro cuadras en línea recta
    expect(distanciaMetros(TORRE, ERMITA)).toBeGreaterThan(400);
    expect(distanciaMetros(TORRE, ERMITA)).toBeLessThan(500);
  });

  it('un grado de latitud son unos 111 km', () => {
    expect(distanciaMetros([2, -76.6], [3, -76.6]) / 1000).toBeCloseTo(111.2, 0);
  });
});

describe('medirRecorrido', () => {
  it('redondea los metros a múltiplos de 50 y los minutos a múltiplos de 5', () => {
    const { metros, minutos } = medirRecorrido([TORRE, ERMITA, TORRE], 'pie');
    expect(metros % 50).toBe(0);
    expect(minutos % 5).toBe(0);
  });

  it('a pie suma el tiempo de visita de cada parada', () => {
    // Tres paradas en el mismo punto: solo cuenta la visita (12 min cada una)
    expect(medirRecorrido([TORRE, TORRE, TORRE], 'pie')).toEqual({ metros: 0, minutos: 35 });
  });

  it('en carro se tarda menos por metro que a pie', () => {
    const lejos: [number, number] = [2.5, -76.55];
    const aPie = medirRecorrido([TORRE, lejos], 'pie');
    const enCarro = medirRecorrido([TORRE, lejos], 'carro');
    expect(enCarro.metros).toBeGreaterThan(aPie.metros);
    expect(enCarro.minutos).toBeLessThan(aPie.minutos);
  });
});

describe('formatos', () => {
  it('duración', () => {
    expect(formatearDuracion(45)).toBe('45 min');
    expect(formatearDuracion(60)).toBe('1 h');
    expect(formatearDuracion(165)).toBe('2 h 45 min');
  });

  it('distancia', () => {
    expect(formatearDistancia(950)).toBe('950 m');
    expect(formatearDistancia(2900)).toBe('2,9 km');
    expect(formatearDistancia(60_900)).toBe('60,9 km');
  });
});
