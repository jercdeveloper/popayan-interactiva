// Extrae del mapa base de Protomaps (datos de OpenStreetMap) solo las teselas de Popayán y sus haciendas
// y las guarda como archivos propios, que el sitio sirve y el service worker guarda para usar sin conexión.
// No se usan los servidores de teselas de OpenStreetMap: su política prohíbe descargarlas para uso sin conexión.
//
// Uso: node scripts/extraer-mapa.mjs
// Para actualizar el mapa: cambia CONSTRUCCION por una fecha reciente de https://build-metadata.protomaps.dev/builds.json
import { PMTiles, FetchSource } from 'pmtiles';
import { mkdir, writeFile, rm } from 'node:fs/promises';

const CONSTRUCCION = '20261012';
const URL_MAPA = `https://build.protomaps.com/${CONSTRUCCION}.pmtiles`;
const SALIDA = 'public/mapa';

// Zonas a extraer (oeste, sur, este, norte), cada una con su rango de zoom:
// la región de las haciendas en poco detalle, la ciudad completa y un recuadro con detalle de calle
// alrededor de cada hacienda. Un entorno más amplio, en muy poco detalle, deja encuadrar la ruta de las
// haciendas en pantallas anchas; el mapa no deja salir de él.
const ENTORNO = { oeste: -77.0, sur: 2.1, este: -76.1, norte: 2.75 };
const REGION = { oeste: -76.66, sur: 2.33, este: -76.47, norte: 2.52 };
const ZONAS = [
  { nombre: 'entorno', area: ENTORNO, zoom: [6, 11] },
  { nombre: 'región', area: REGION, zoom: [6, 13] },
  { nombre: 'ciudad', area: { oeste: -76.645, sur: 2.415, este: -76.565, norte: 2.475 }, zoom: [6, 15] },
  ...[
    ['Yambitará', 2.45853, -76.5871],
    ['Puente Viejo y Belalcázar', 2.4711, -76.5779],
    ['Calibío', 2.49929, -76.57181],
    ['Las Guacas', 2.45593, -76.52669],
    ['Pisojé', 2.44804, -76.53064],
    ['Coconuco', 2.35714, -76.49581],
    ['Antomoreno', 2.40924, -76.62724],
    ['Versalles', 2.41644, -76.62052],
  ].map(([nombre, lat, lon]) => ({
    nombre,
    area: { oeste: lon - 0.008, sur: lat - 0.008, este: lon + 0.008, norte: lat + 0.008 },
    zoom: [14, 15],
  })),
];
const ZOOM_MIN = 6;
const ZOOM_MAX = 15;

const FUENTES = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'];
// Latín básico, Latín-1 (tildes y ñ) y Latín extendido
const RANGOS = ['0-255', '256-511'];
const URL_FUENTES = 'https://protomaps.github.io/basemaps-assets/fonts';

function lon2x(lon, z) {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

function lat2y(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z);
}

async function extraerTeselas() {
  const archivo = new PMTiles(new FetchSource(URL_MAPA));
  const cabecera = await archivo.getHeader();
  console.log(`Mapa base ${CONSTRUCCION}: zoom ${cabecera.minZoom}–${cabecera.maxZoom}`);

  await rm(`${SALIDA}/teselas`, { recursive: true, force: true });
  // Las zonas se superponen: cada tesela se descarga una sola vez
  const pendientes = new Set();
  for (const { area, zoom } of ZONAS) {
    for (let z = zoom[0]; z <= zoom[1]; z++) {
      for (let x = lon2x(area.oeste, z); x <= lon2x(area.este, z); x++) {
        for (let y = lat2y(area.norte, z); y <= lat2y(area.sur, z); y++) pendientes.add(`${z}/${x}/${y}`);
      }
    }
  }
  let total = 0;
  let bytes = 0;
  for (const clave of pendientes) {
    const [z, x, y] = clave.split('/').map(Number);
    const tesela = await archivo.getZxy(z, x, y);
    if (!tesela) continue;
    await mkdir(`${SALIDA}/teselas/${z}/${x}`, { recursive: true });
    await writeFile(`${SALIDA}/teselas/${z}/${x}/${y}.pbf`, new Uint8Array(tesela.data));
    total++;
    bytes += tesela.data.byteLength;
  }
  console.log(`${total} teselas, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}

async function descargarFuentes() {
  for (const fuente of FUENTES) {
    await mkdir(`${SALIDA}/fuentes/${fuente}`, { recursive: true });
    for (const rango of RANGOS) {
      const respuesta = await fetch(`${URL_FUENTES}/${encodeURIComponent(fuente)}/${rango}.pbf`);
      if (!respuesta.ok) throw new Error(`No se pudo descargar ${fuente} ${rango}: ${respuesta.status}`);
      await writeFile(`${SALIDA}/fuentes/${fuente}/${rango}.pbf`, new Uint8Array(await respuesta.arrayBuffer()));
    }
  }
  console.log(`Glifos de ${FUENTES.length} fuentes descargados`);
}

await extraerTeselas();
await descargarFuentes();
await writeFile(
  'src/lib/mapa-fuente.json',
  JSON.stringify(
    {
      construccion: CONSTRUCCION,
      area: ENTORNO,
      zoom: [ZOOM_MIN, ZOOM_MAX],
      atribucion: '© OpenStreetMap contributors · Protomaps',
    },
    null,
    2,
  ) + '\n',
);
