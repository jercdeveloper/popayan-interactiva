// Convierte texto en trazos SVG a partir de las fuentes variables del proyecto,
// para generar logos y láminas sin depender de las fuentes instaladas en el sistema.
import * as fontkit from 'fontkit';
import { decompress } from 'wawoff2';
import { readFileSync } from 'node:fs';

const ARCHIVOS = {
  bodoni: 'node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-standard-normal.woff2',
  'bodoni-italica': 'node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-standard-italic.woff2',
  atkinson: 'node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2',
};

const cache = new Map();

/**
 * @param {'bodoni' | 'bodoni-italica' | 'atkinson'} familia
 * @param {Record<string, number>} ejes p. ej. { wght: 500, opsz: 96 }
 */
export async function cargarFuente(familia, ejes = {}) {
  const clave = `${familia}:${JSON.stringify(ejes)}`;
  if (!cache.has(clave)) {
    // fontkit no aplica ejes variables sobre WOFF2: se descomprime a TTF primero
    const ttf = Buffer.from(await decompress(readFileSync(ARCHIVOS[familia])));
    const base = fontkit.create(ttf);
    cache.set(clave, Object.keys(ejes).length ? base.getVariation(ejes) : base);
  }
  return cache.get(clave);
}

/** Devuelve un <g> con el texto en trazos, con la línea base en (x, y). */
export function textoATrazos(fuente, texto, x, y, tamano, color) {
  const escala = tamano / fuente.unitsPerEm;
  const { glyphs, positions } = fuente.layout(texto);
  let cursor = 0;
  const trazos = glyphs.map((glifo, i) => {
    const pos = positions[i];
    const gx = cursor + pos.xOffset;
    const gy = pos.yOffset;
    cursor += pos.xAdvance;
    const d = glifo.path.toSVG();
    return d ? `<path transform="translate(${gx} ${-gy})" d="${d}"/>` : '';
  });
  return `<g fill="${color}" transform="translate(${x} ${y}) scale(${escala} ${-escala})">${trazos.join('')}</g>`;
}

/** Ancho del texto en píxeles al tamaño dado. */
export function anchoTexto(fuente, texto, tamano) {
  return (fuente.layout(texto).advanceWidth * tamano) / fuente.unitsPerEm;
}

/**
 * Parte el texto en líneas que caben en `ancho`. Si pasa de `maxLineas`, corta la última con puntos
 * suspensivos para que la tarjeta nunca se desborde.
 */
export function partirEnLineas(fuente, texto, tamano, ancho, maxLineas = Infinity) {
  const lineas = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (anchoTexto(fuente, prueba, tamano) <= ancho || !actual) actual = prueba;
    else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;
  const cortadas = lineas.slice(0, maxLineas);
  let ultima = cortadas[maxLineas - 1];
  while (ultima.includes(' ') && anchoTexto(fuente, `${ultima}…`, tamano) > ancho) ultima = ultima.slice(0, ultima.lastIndexOf(' '));
  cortadas[maxLineas - 1] = `${ultima.replace(/[,.;:]$/, '')}…`;
  return cortadas;
}
