// Genera los recursos de marca a partir de la torre vectorizada (src/assets/marca/isotipo.svg):
// logotipo horizontal, favicon (micro-marca), íconos de la PWA e ícono de Apple.
// Uso: node scripts/generar-marca.mjs
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { cargarFuente, textoATrazos, anchoTexto } from './lib/texto-a-trazos.mjs';

const COLOR = {
  teja: '#A8482A',
  tejaOscura: '#7A3119',
  nazareno: '#5B2D73',
  cal: '#F2F3F0',
  calClara: '#FAFAF8',
  piedra: '#3A332D',
};

// Caja que ocupa el dibujo dentro de su lienzo de 1024×1024
const CAJA = { x: 240, y: 95, ancho: 545, alto: 835 };

const isotipoFuente = await readFile('src/assets/marca/isotipo.svg', 'utf8');
const cuerpoTorre = isotipoFuente.replace(/^[\s\S]*?(<path class="torre")/, '$1').replace(/<\/svg>\s*$/, '');

/** La torre escalada para que su caja mida `alto`, con la esquina superior izquierda en (x, y). */
function torre(x, y, alto, color = 'currentColor') {
  const escala = alto / CAJA.alto;
  const cuerpo = cuerpoTorre.replace(/currentColor/g, color);
  return `<g transform="translate(${x - CAJA.x * escala} ${y - CAJA.y * escala}) scale(${escala})">${cuerpo}</g>`;
}

/** Torre centrada en un ícono cuadrado. `ocupacion` = fracción del lado que ocupa su alto. */
function icono(lado, fondo, trazo, ocupacion) {
  const alto = lado * ocupacion;
  const ancho = (alto * CAJA.ancho) / CAJA.alto;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" fill="${fondo}"/>
  ${torre((lado - ancho) / 2, (lado - alto) / 2, alto, trazo)}
</svg>`;
}

/** Micro-marca para la pestaña: la esfera del reloj con su única manecilla. */
function microMarca() {
  const marcas = Array.from({ length: 12 }, (_, i) => {
    const largo = i % 3 === 0 ? 4.5 : 2.6;
    return `<line x1="32" y1="13.5" x2="32" y2="${13.5 + largo}" transform="rotate(${i * 30} 32 32)"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${COLOR.teja}"/>
  <circle cx="32" cy="32" r="22" fill="${COLOR.calClara}"/>
  <g stroke="${COLOR.piedra}" stroke-width="2.4" stroke-linecap="round">${marcas}</g>
  <line x1="32" y1="32" x2="42.5" y2="21.5" stroke="${COLOR.piedra}" stroke-width="4.2" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="3.6" fill="${COLOR.piedra}"/>
</svg>`;
}

/** Empaqueta PNG en un .ico (formato con PNG embebido, admitido por todos los navegadores actuales). */
function ico(pngs) {
  const cabecera = Buffer.alloc(6 + 16 * pngs.length);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2);
  cabecera.writeUInt16LE(pngs.length, 4);
  let desplazamiento = cabecera.length;
  pngs.forEach(({ lado, datos }, i) => {
    const o = 6 + i * 16;
    cabecera.writeUInt8(lado >= 256 ? 0 : lado, o);
    cabecera.writeUInt8(lado >= 256 ? 0 : lado, o + 1);
    cabecera.writeUInt16LE(1, o + 4);
    cabecera.writeUInt16LE(32, o + 6);
    cabecera.writeUInt32LE(datos.length, o + 8);
    cabecera.writeUInt32LE(desplazamiento, o + 12);
    desplazamiento += datos.length;
  });
  return Buffer.concat([cabecera, ...pngs.map((p) => p.datos)]);
}

async function png(svg, lado) {
  return sharp(Buffer.from(svg)).resize(lado, lado).png().toBuffer();
}

async function logotipoHorizontal() {
  const fuente = await cargarFuente('atkinson', { wght: 400 });
  const altoTorre = 640;
  const xTexto = 640;
  const tamano = 190;
  const anchoNombre = Math.max(anchoTexto(fuente, 'Popayán', tamano), anchoTexto(fuente, 'Interactiva', tamano));
  const ancho = Math.ceil(xTexto + anchoNombre + 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${altoTorre}" role="img" aria-labelledby="titulo-logo">
  <title id="titulo-logo">Popayán Interactiva</title>
  ${torre(0, 0, altoTorre)}
  ${textoATrazos(fuente, 'Popayán', xTexto, 280, tamano, 'currentColor')}
  ${textoATrazos(fuente, 'Interactiva', xTexto, 490, tamano, 'currentColor')}
</svg>
`;
}

async function main() {
  await mkdir('public/iconos', { recursive: true });

  await writeFile('src/assets/marca/logo-horizontal.svg', await logotipoHorizontal());

  const favicon = microMarca();
  await writeFile('public/favicon.svg', favicon);
  await writeFile(
    'public/favicon.ico',
    ico([
      { lado: 16, datos: await png(favicon, 16) },
      { lado: 32, datos: await png(favicon, 32) },
      { lado: 48, datos: await png(favicon, 48) },
    ]),
  );

  // Íconos "any": la torre ocupa el 82 % del alto, como en el diseño original
  for (const lado of [192, 512]) {
    await sharp(Buffer.from(icono(lado, COLOR.teja, COLOR.calClara, 0.82))).png().toFile(`public/iconos/icono-${lado}.png`);
  }
  // Íconos "maskable": la torre entera cabe dentro del círculo seguro del 80 %
  for (const lado of [192, 512]) {
    await sharp(Buffer.from(icono(lado, COLOR.teja, COLOR.calClara, 0.66))).png().toFile(`public/iconos/icono-maskable-${lado}.png`);
  }
  await sharp(Buffer.from(icono(180, COLOR.teja, COLOR.calClara, 0.76))).png().toFile('public/iconos/apple-touch-icon.png');
  await sharp(Buffer.from(icono(512, COLOR.nazareno, COLOR.calClara, 0.82))).png().toFile('public/iconos/icono-noche-512.png');

  console.log('Recursos de marca generados.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
