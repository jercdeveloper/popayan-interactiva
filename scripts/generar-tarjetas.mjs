// Genera las tarjetas para compartir de cada lugar y cada ruta, después de compilar el sitio:
// - tarjetas/<tipo>/<id>.jpg: 1080×1350, el formato vertical de Instagram y WhatsApp
// - tarjetas/og/<tipo>/<id>.jpg: 1200×630, la vista previa cuando se comparte el enlace
// Igual que el sitio: la foto del lugar a sangre y, encima, un panel de vidrio hecho con la misma foto
// desenfocada. Sin foto libre, una superficie terracota con el ícono del tipo de lugar.
// El texto va en trazos (Atkinson Hyperlegible Next) para no depender de las fuentes del sistema.
// Uso: node scripts/generar-tarjetas.mjs [carpeta de salida, por defecto dist]
import sharp from 'sharp';
import { parse } from 'yaml';
import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { cargarFuente, textoATrazos, partirEnLineas, anchoTexto } from './lib/texto-a-trazos.mjs';
import { CATEGORIAS } from '../src/lib/lugares.ts';
import { medirRecorrido, formatearDistancia, formatearDuracion } from '../src/lib/recorrido.ts';

const SALIDA = process.argv[2] ?? 'dist';
const DOMINIO = 'popayaninteractiva.co';

const C = {
  texto: '#1d1d1f',
  texto2: '#6e6e73',
  acento: '#c4532c',
  tinte: 'rgba(255,255,255,0.74)',
  borde: 'rgba(255,255,255,0.55)',
};

const fuentes = {
  texto: await cargarFuente('atkinson', { wght: 400 }),
  medio: await cargarFuente('atkinson', { wght: 600 }),
  titulo: await cargarFuente('atkinson', { wght: 750 }),
};

// ---------- Contenido ----------

async function leerColeccion(carpeta) {
  const archivos = (await readdir(carpeta)).filter((a) => a.endsWith('.md'));
  return Promise.all(
    archivos.map(async (a) => {
      const texto = await readFile(join(carpeta, a), 'utf8');
      return { id: a.replace(/\.md$/, ''), ...parse(texto.split('---')[1]) };
    }),
  );
}

const lugares = await leerColeccion('src/content/lugares');
const porId = new Map(lugares.map((l) => [l.id, l]));
const rutas = await leerColeccion('src/content/rutas');
const creditos = JSON.parse(await readFile('src/assets/fotos/creditos.json', 'utf8'));

async function foto(id) {
  if (!id || !creditos[id]) return null;
  const archivo = `src/assets/fotos/${id}.jpg`;
  try {
    await access(archivo);
    return { archivo, credito: creditos[id] };
  } catch {
    return null;
  }
}

// ---------- Piezas ----------

const CAJA_TORRE = { x: 240, y: 95, ancho: 545, alto: 835 };
const isotipo = await readFile('src/assets/marca/isotipo.svg', 'utf8');
const cuerpoTorre = isotipo.replace(/^[\s\S]*?(<path class="silueta")/, '$1').replace(/<\/svg>\s*$/, '');

function torre(x, y, alto) {
  const escala = alto / CAJA_TORRE.alto;
  const cuerpo = cuerpoTorre
    .replace(/currentColor/g, C.acento)
    .replace('class="silueta" fill="none"', 'class="silueta" fill="#ffffff"');
  return `<g transform="translate(${x - CAJA_TORRE.x * escala} ${y - CAJA_TORRE.y * escala}) scale(${escala})">${cuerpo}</g>`;
}
const anchoTorre = (alto) => (alto * CAJA_TORRE.ancho) / CAJA_TORRE.alto;

/** El ícono de Phosphor relleno, centrado en (cx, cy) */
async function icono(nombre, cx, cy, lado, color) {
  const svg = await readFile(`node_modules/@phosphor-icons/core/assets/fill/${nombre}-fill.svg`, 'utf8');
  const interior = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const e = lado / 256;
  return `<g fill="${color}" transform="translate(${cx - lado / 2} ${cy - lado / 2}) scale(${e})">${interior}</g>`;
}

function bloque(fuente, lineas, x, y, tamano, interlinea, color) {
  return lineas.map((l, i) => textoATrazos(fuente, l, x, y + i * interlinea, tamano, color)).join('');
}

/** El fondo: la foto recortada al formato o, sin foto, la superficie terracota con el ícono */
async function fondo(f, W, H, nombreIcono, libre = 0) {
  if (f && libre) {
    // La foto ocupa solo la franja que el panel deja libre, para que lo importante no quede debajo;
    // el resto es la misma foto, ampliada y desenfocada, que el vidrio cubre casi entera
    const relleno = await sharp(f.archivo).resize(W, H, { fit: 'cover' }).blur(40).toBuffer();
    const franja = await sharp(f.archivo).resize(libre, H, { fit: 'cover', position: sharp.strategy.attention }).toBuffer();
    return sharp(relleno).composite([{ input: franja, left: W - libre, top: 0 }]).toBuffer();
  }
  if (f) {
    return sharp(f.archivo).resize(W, H, { fit: 'cover', position: sharp.strategy.attention }).toBuffer();
  }
  const lado = Math.min(W, H) * 0.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="0.3" cy="0.2" r="1"><stop offset="0" stop-color="#d9714a"/><stop offset="1" stop-color="#a8401f"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${await icono(nombreIcono, W * 0.62, H * 0.3, lado, 'rgba(255,255,255,0.2)')}
  </svg>`;
  return sharp(Buffer.from(svg)).toBuffer();
}

const rect = ({ x, y, w, h, r }, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${extra}/>`;

/**
 * Compone la tarjeta: fondo, velo, vidrio (la foto desenfocada recortada a los paneles) y el contenido.
 * `paneles` son los rectángulos de vidrio; `encima` es el SVG del texto.
 */
async function componer({ base, W, H, paneles, encima, velo }) {
  const borrosa = await sharp(base).blur(36).modulate({ saturation: 1.4 }).toBuffer();
  const mascara = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${paneles.map((p) => rect(p, 'fill="#fff"')).join('')}</svg>`,
  );
  const vidrio = await sharp(borrosa).composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
  const capa = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    ${paneles.map((p) => rect(p, `fill="${C.tinte}" stroke="${C.borde}" stroke-width="2"`)).join('')}
    ${encima}
  </svg>`);
  return sharp(base)
    .composite([{ input: Buffer.from(velo) }, { input: vidrio }, { input: capa }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}

/** Velo oscuro abajo (para el crédito) y arriba (para la marca) */
const velo = (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.32"/>
      <stop offset="0.2" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
</svg>`;

/** La cápsula de la marca: torre y nombre */
function capsulaMarca(x, y, alto) {
  const t = alto * 0.7;
  const tam = alto * 0.36;
  const w = 18 + anchoTorre(t) + 14 + anchoTexto(fuentes.medio, 'Popayán Interactiva', tam) + 26;
  return {
    panel: { x, y, w, h: alto, r: alto / 2 },
    svg: torre(x + 18, y + (alto - t) / 2, t) + textoATrazos(fuentes.medio, 'Popayán Interactiva', x + 18 + anchoTorre(t) + 14, y + alto / 2 + tam * 0.36, tam, C.texto),
  };
}

/** El crédito de la foto, en una cápsula oscura para que se lea sobre cualquier fondo */
function lineaCredito(f, x, y, tam, maxAncho = 900) {
  if (!f) return '';
  const texto = partirEnLineas(fuentes.texto, `Foto: ${f.credito.autor} · ${f.credito.licencia} · Wikimedia Commons`, tam, maxAncho, 1)[0];
  const ancho = anchoTexto(fuentes.texto, texto, tam);
  const px = tam * 0.7;
  const alto = tam * 1.7;
  return (
    rect({ x: x - ancho - 2 * px, y: y - alto, w: ancho + 2 * px, h: alto, r: alto / 2 }, 'fill="rgba(0,0,0,0.5)"') +
    textoATrazos(fuentes.texto, texto, x - ancho - px, y - alto / 2 + tam * 0.36, tam, 'rgba(255,255,255,0.92)')
  );
}

async function guardar(buffer, ruta) {
  await mkdir(join(ruta, '..'), { recursive: true });
  await writeFile(ruta, buffer);
}

// ---------- Tarjeta vertical (lugares y rutas comparten la misma composición) ----------

/**
 * @param {object} o
 * @param {string} o.meta   línea en terracota sobre el título
 * @param {string} o.titulo
 * @param {string} [o.etiqueta] rótulo pequeño sobre el cuerpo ("¿Sabías que…?")
 * @param {string} o.cuerpo
 * @param {string} o.enlace ruta sin dominio
 */
async function tarjetaVertical({ f, nombreIcono, meta, titulo, etiqueta, cuerpo, enlace, salida }) {
  const W = 1080;
  const H = 1350;
  const M = 48;
  const P = 52;
  const ancho = W - 2 * M - 2 * P;

  // Se arma de abajo hacia arriba dentro del panel
  const panelAbajo = H - M;
  const yEnlace = panelAbajo - P;
  const ySeparador = yEnlace - 52;

  const lineasCuerpo = partirEnLineas(fuentes.texto, cuerpo, 38, ancho, 4);
  const yCuerpoFin = ySeparador - 44;
  const yCuerpo = yCuerpoFin - (lineasCuerpo.length - 1) * 52;
  const yEtiqueta = etiqueta ? yCuerpo - 56 : yCuerpo;

  let tamTitulo = 84;
  let lineasTitulo = partirEnLineas(fuentes.titulo, titulo, tamTitulo, ancho, 3);
  if (lineasTitulo.length > 2) {
    tamTitulo = 68;
    lineasTitulo = partirEnLineas(fuentes.titulo, titulo, tamTitulo, ancho, 3);
  }
  const inter = tamTitulo * 1.04;
  const yTituloFin = yEtiqueta - (etiqueta ? 64 : 70);
  const yTitulo = yTituloFin - (lineasTitulo.length - 1) * inter;
  const yMeta = yTitulo - tamTitulo - 18;
  const panel = { x: M, y: yMeta - 30 - P + 6, w: W - 2 * M, h: 0, r: 44 };
  panel.h = panelAbajo - panel.y;

  const marca = capsulaMarca(M, M, 84);
  const encima = [
    marca.svg,
    textoATrazos(fuentes.medio, partirEnLineas(fuentes.medio, meta, 30, ancho, 1)[0], M + P, yMeta, 30, C.acento),
    bloque(fuentes.titulo, lineasTitulo, M + P, yTitulo, tamTitulo, inter, C.texto),
    etiqueta ? textoATrazos(fuentes.medio, partirEnLineas(fuentes.medio, etiqueta, 28, ancho, 1)[0], M + P, yEtiqueta, 28, C.acento) : '',
    bloque(fuentes.texto, lineasCuerpo, M + P, yCuerpo, 38, 52, C.texto),
    `<rect x="${M + P}" y="${ySeparador}" width="${ancho}" height="2" fill="rgba(0,0,0,0.1)"/>`,
    textoATrazos(fuentes.medio, `${DOMINIO}${enlace}`, M + P, yEnlace, 30, C.texto2),
    lineaCredito(f, W - M, panel.y - 16, 22),
  ].join('\n');

  const base = await fondo(f, W, H, nombreIcono);
  await guardar(await componer({ base, W, H, paneles: [panel, marca.panel], encima, velo: velo(W, H) }), salida);
}

// ---------- Vista previa horizontal ----------

async function vistaPrevia({ f, nombreIcono, meta, titulo, cuerpo, enlace, salida }) {
  const W = 1200;
  const H = 630;
  const M = 36;
  const P = 44;
  const panel = { x: M, y: M, w: 640, h: H - 2 * M, r: 36 };
  const ancho = panel.w - 2 * P;

  const t = 62;
  const yMarca = panel.y + P + 4;
  let tam = 66;
  let lineasTitulo = partirEnLineas(fuentes.titulo, titulo, tam, ancho, 3);
  if (lineasTitulo.length > 2) {
    tam = 54;
    lineasTitulo = partirEnLineas(fuentes.titulo, titulo, tam, ancho, 3);
  }
  const yMeta = yMarca + t + 58;
  const yTitulo = yMeta + 22 + tam;
  const yTituloFin = yTitulo + (lineasTitulo.length - 1) * tam * 1.04;
  const yEnlace = panel.y + panel.h - P + 2;
  const caben = Math.max(0, Math.min(3, Math.floor((yEnlace - 52 - (yTituloFin + 58)) / 40) + 1));
  const lineasCuerpo = cuerpo && caben ? partirEnLineas(fuentes.texto, cuerpo, 28, ancho, caben) : [];

  const encima = [
    torre(panel.x + P, yMarca, t),
    textoATrazos(fuentes.medio, 'Popayán Interactiva', panel.x + P + anchoTorre(t) + 14, yMarca + t / 2 + 10, 28, C.texto),
    textoATrazos(fuentes.medio, partirEnLineas(fuentes.medio, meta, 26, ancho, 1)[0], panel.x + P, yMeta, 26, C.acento),
    bloque(fuentes.titulo, lineasTitulo, panel.x + P, yTitulo, tam, tam * 1.04, C.texto),
    bloque(fuentes.texto, lineasCuerpo, panel.x + P, yTituloFin + 58, 28, 40, C.texto2),
    textoATrazos(fuentes.medio, `${DOMINIO}${enlace}`, panel.x + P, yEnlace, 24, C.texto2),
    lineaCredito(f, W - 16, H - 16, 17, 480),
  ].join('\n');

  const base = await fondo(f, W, H, nombreIcono, W - panel.x - panel.w + 70);
  await guardar(await componer({ base, W, H, paneles: [panel], encima, velo: velo(W, H) }), salida);
}

// ---------- Lugares y rutas ----------

for (const l of lugares) {
  const f = await foto(l.id);
  const categoria = CATEGORIAS[l.categoria];
  const enRutas = rutas.filter((r) => r.paradas.includes(l.id)).map((r) => r.nombre);
  const comun = {
    f,
    nombreIcono: categoria.icono,
    meta: `${categoria.singular} · ${l.epoca}`,
    titulo: l.nombre,
    enlace: `/lugares/${l.id}`,
  };
  await tarjetaVertical({
    ...comun,
    etiqueta: l.dato ? '¿Sabías que…?' : enRutas.length === 1 ? 'Está en la ruta' : enRutas.length ? 'Está en estas rutas' : undefined,
    cuerpo: l.dato ?? (enRutas.length ? enRutas.join(' · ') : l.resumen),
    salida: join(SALIDA, 'tarjetas/lugares', `${l.id}.jpg`),
  });
  await vistaPrevia({ ...comun, cuerpo: l.resumen, salida: join(SALIDA, 'tarjetas/og/lugares', `${l.id}.jpg`) });
}

for (const r of rutas) {
  const modo = r.modo ?? 'pie';
  const paradas = r.paradas.map((id) => porId.get(id));
  if (paradas.some((p) => !p)) throw new Error(`La ruta ${r.id} nombra un lugar que no existe`);
  const { metros, minutos } = medirRecorrido(
    paradas.map((p) => p.coordenadas),
    modo,
  );
  const comun = {
    f: await foto(r.foto),
    nombreIcono: modo === 'carro' ? 'car-simple' : 'footprints',
    meta: `${modo === 'carro' ? 'En carro' : 'A pie'} · ${paradas.length} paradas · ${formatearDistancia(metros)} · ${formatearDuracion(minutos)}`,
    titulo: r.nombre,
    enlace: `/rutas/${r.id}`,
  };
  await tarjetaVertical({
    ...comun,
    etiqueta: `De ${paradas[0].nombre} a ${paradas.at(-1).nombre}`,
    cuerpo: r.lema,
    salida: join(SALIDA, 'tarjetas/rutas', `${r.id}.jpg`),
  });
  await vistaPrevia({ ...comun, cuerpo: r.lema, salida: join(SALIDA, 'tarjetas/og/rutas', `${r.id}.jpg`) });
}

// La vista previa del sitio
await vistaPrevia({
  f: await foto('parque-caldas'),
  nombreIcono: 'map-pin',
  meta: 'Guía cultural gratuita',
  titulo: 'Popayán, contada lugar por lugar',
  cuerpo: 'Rutas, historias que citan sus fuentes y un mapa que funciona sin señal.',
  enlace: '',
  salida: join(SALIDA, 'tarjetas/og/inicio.jpg'),
});

console.log(`Tarjetas: ${lugares.length} lugares, ${rutas.length} rutas, más sus vistas previas`);
