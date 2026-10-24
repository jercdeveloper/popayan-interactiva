// Vectoriza el isotipo dibujado en Canva (PNG con trazo negro sobre fondo transparente),
// le quita las dos manecillas originales y deja una sola como elemento animable.
// Uso: node scripts/vectorizar-logo.mjs
import sharp from 'sharp';
import potrace from 'potrace';
import { writeFile, mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';

const ENTRADA = 'marca-fuente/isotipo.png';
const SALIDA = 'src/assets/marca';

// Centro del reloj medido sobre el PNG de 1024×1024
const RELOJ = { cx: 649.3, cy: 336.3 };
// Puntas de las dos manecillas originales (horaria hacia las 10, minutero hacia las 2)
const MANECILLAS_ORIGINALES = [
  { x: 634.5, y: 316.5 },
  { x: 671.5, y: 315.5 },
];
const MEDIO_GROSOR_BORRADO = 4.5;
// La manecilla única apunta hacia la 1:30 (45° a la derecha de las 12)
const MANECILLA = { largo: 25, angulo: 45, grosor: 5 };

function distanciaASegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const trace = promisify(potrace.trace);

// El dibujo está abierto por abajo y por la izquierda (sus líneas "se pierden"): se cierra
// con una línea de suelo y una lateral para poder rellenar su interior.
const CIERRE = { suelo: 934, banda: 40, izquierda: 238, desdeY: 405, hastaX: 744 };
const RADIO_CIERRE = 5;

/** Dilata una máscara binaria (1 = tinta) con una ventana cuadrada de radio r. */
function dilatar(mascara, ancho, alto, r) {
  const horizontal = new Uint8Array(mascara.length);
  for (let y = 0; y < alto; y++) {
    let cuenta = 0;
    for (let x = -r; x < ancho; x++) {
      if (x + r < ancho) cuenta += mascara[y * ancho + x + r];
      if (x - r - 1 >= 0) cuenta -= mascara[y * ancho + x - r - 1];
      if (x >= 0) horizontal[y * ancho + x] = cuenta > 0 ? 1 : 0;
    }
  }
  const salida = new Uint8Array(mascara.length);
  for (let x = 0; x < ancho; x++) {
    let cuenta = 0;
    for (let y = -r; y < alto; y++) {
      if (y + r < alto) cuenta += horizontal[(y + r) * ancho + x];
      if (y - r - 1 >= 0) cuenta -= horizontal[(y - r - 1) * ancho + x];
      if (y >= 0) salida[y * ancho + x] = cuenta > 0 ? 1 : 0;
    }
  }
  return salida;
}

/** Devuelve un PNG con la silueta de la torre (negro) a partir del dibujo de líneas. */
async function siluetaDe(gris, ancho, alto) {
  const tinta = new Uint8Array(ancho * alto);
  for (let i = 0; i < tinta.length; i++) tinta[i] = gris[i] < 128 ? 1 : 0;
  for (let x = CIERRE.izquierda; x <= CIERRE.hastaX; x++) for (let y = CIERRE.suelo - CIERRE.banda; y <= CIERRE.suelo + 3; y++) tinta[y * ancho + x] = 1;
  for (let y = CIERRE.desdeY; y <= CIERRE.suelo; y++) for (let x = CIERRE.izquierda - 3; x <= CIERRE.izquierda + 3; x++) tinta[y * ancho + x] = 1;

  const cerrada = dilatar(tinta, ancho, alto, RADIO_CIERRE);

  // Relleno por inundación desde el borde: lo que no se alcanza es el interior de la torre
  const afuera = new Uint8Array(ancho * alto);
  const cola = new Int32Array(ancho * alto);
  let inicio = 0;
  let fin = 0;
  const sembrar = (i) => {
    if (!afuera[i] && !cerrada[i]) {
      afuera[i] = 1;
      cola[fin++] = i;
    }
  };
  for (let x = 0; x < ancho; x++) {
    sembrar(x);
    sembrar((alto - 1) * ancho + x);
  }
  for (let y = 0; y < alto; y++) {
    sembrar(y * ancho);
    sembrar(y * ancho + ancho - 1);
  }
  while (inicio < fin) {
    const i = cola[inicio++];
    const x = i % ancho;
    if (x > 0) sembrar(i - 1);
    if (x < ancho - 1) sembrar(i + 1);
    if (i >= ancho) sembrar(i - ancho);
    if (i < ancho * (alto - 1)) sembrar(i + ancho);
  }

  // Interior = no alcanzado; se contrae para devolver el grosor que agregó la dilatación
  const interior = new Uint8Array(ancho * alto);
  for (let i = 0; i < interior.length; i++) interior[i] = afuera[i] ? 0 : 1;
  const exterior = dilatar(interior.map((v) => 1 - v), ancho, alto, RADIO_CIERRE);
  const imagen = Buffer.alloc(ancho * alto);
  for (let i = 0; i < imagen.length; i++) imagen[i] = exterior[i] ? 255 : 0;
  return sharp(imagen, { raw: { width: ancho, height: alto, channels: 1 } }).png().toBuffer();
}

async function main() {
  const { data, info } = await sharp(ENTRADA)
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Borra solo las dos manecillas originales, sin tocar las marcas horarias
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const sobreManecilla = MANECILLAS_ORIGINALES.some(
        (punta) => distanciaASegmento(x, y, RELOJ.cx, RELOJ.cy, punta.x, punta.y) <= MEDIO_GROSOR_BORRADO,
      );
      if (sobreManecilla) data[y * info.width + x] = 255;
    }
  }

  const limpio = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toBuffer();

  const svgTrazado = await trace(limpio, { threshold: 128, turdSize: 4, optTolerance: 0.25 });
  const d = svgTrazado.match(/ d="([^"]+)"/)[1];

  // Silueta rellena: la torre como edificio encalado, no solo líneas
  const silueta = await trace(await siluetaDe(data, info.width, info.height), { threshold: 128, turdSize: 40, optTolerance: 0.6 });
  const dSilueta = silueta.match(/ d="([^"]+)"/)[1];

  const rad = (MANECILLA.angulo * Math.PI) / 180;
  const x2 = (RELOJ.cx + Math.sin(rad) * MANECILLA.largo).toFixed(1);
  const y2 = (RELOJ.cy - Math.cos(rad) * MANECILLA.largo).toFixed(1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${info.width} ${info.height}" role="img" aria-labelledby="titulo">
  <title id="titulo">Torre del Reloj de Popayán</title>
  <path class="silueta" d="${dSilueta}" fill="none"/>
  <path class="torre" d="${d}" fill="currentColor" fill-rule="evenodd"/>
  <g class="manecilla">
    <line x1="${RELOJ.cx}" y1="${RELOJ.cy}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="${MANECILLA.grosor}" stroke-linecap="round"/>
    <circle cx="${RELOJ.cx}" cy="${RELOJ.cy}" r="4" fill="currentColor"/>
  </g>
</svg>
`;

  await mkdir(SALIDA, { recursive: true });
  await writeFile(`${SALIDA}/isotipo.svg`, svg);
  await writeFile(`${SALIDA}/reloj.json`, JSON.stringify(RELOJ, null, 2) + '\n');
  console.log(`isotipo.svg: ${(svg.length / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
