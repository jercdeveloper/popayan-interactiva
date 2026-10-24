// Genera una lámina para comparar el logotipo horizontal con el nombre en
// Atkinson Hyperlegible Next (versión del usuario) y en Bodoni Moda.
// Uso: node scripts/comparar-nombre.mjs <ruta de salida .png>
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { cargarFuente, textoATrazos } from './lib/texto-a-trazos.mjs';

const salida = process.argv[2] ?? 'comparacion-nombre.png';
const COLOR = { cal: '#F2F3F0', piedra: '#3A332D', suave: '#6B6258', borde: '#DCDDD8' };

function torre(isotipo, x, y, alto) {
  // El dibujo ocupa aprox. de y=95 a y=930 dentro de su lienzo de 1024
  const escala = alto / 835;
  const cuerpo = isotipo
    .replace(/^[\s\S]*?<path/, '<path')
    .replace(/<\/svg>\s*$/, '')
    .replace(/currentColor/g, COLOR.piedra);
  return `<g transform="translate(${x - 240 * escala} ${y - 95 * escala}) scale(${escala})">${cuerpo}</g>`;
}

async function main() {
  const isotipo = await readFile('src/assets/marca/isotipo.svg', 'utf8');
  const atkinson = await cargarFuente('atkinson', { wght: 400 });
  const etiqueta = await cargarFuente('atkinson', { wght: 500 });
  // Tamaño óptico bajo: trazos finos más firmes, a juego con el grosor de la torre
  const bodoni = await cargarFuente('bodoni', { wght: 500, opsz: 20 });

  const ancho = 2400;
  const alto = 2300;
  const bloque = (y0, fuente, tamano, interlinea, rotulo) => `
    ${textoATrazos(etiqueta, rotulo, 160, y0 + 60, 44, COLOR.suave)}
    ${torre(isotipo, 260, y0 + 160, 640)}
    ${textoATrazos(fuente, 'Popayán', 900, y0 + 440, tamano, COLOR.piedra)}
    ${textoATrazos(fuente, 'Interactiva', 900, y0 + 440 + interlinea, tamano, COLOR.piedra)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
  <rect width="100%" height="100%" fill="${COLOR.cal}"/>
  ${bloque(80, atkinson, 190, 210, 'A. Tu versión: Atkinson Hyperlegible Next')}
  <rect x="160" y="1140" width="${ancho - 320}" height="2" fill="${COLOR.borde}"/>
  ${bloque(1200, bodoni, 196, 220, 'B. Bodoni Moda')}
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(salida);
  console.log(`Lámina guardada en ${salida}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
