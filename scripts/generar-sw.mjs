// Genera el service worker después de `astro build`, con Workbox.
// - Páginas, estilos, scripts, íconos y fuentes: se guardan al instalar (la app funciona sin señal).
// - Mapa (teselas y glifos): se guardan a medida que se ven, o todas juntas con el botón
//   "Guardar el mapa" de la página /mapa, que lee dist/mapa/indice.json.
import { generateSW } from 'workbox-build';
import { readdir, writeFile, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const fuenteMapa = JSON.parse(await readFile('src/lib/mapa-fuente.json', 'utf8'));
const CACHE_MAPA = `mapa-${fuenteMapa.construccion}`;

async function listar(directorio) {
  const entradas = await readdir(directorio, { withFileTypes: true });
  const archivos = await Promise.all(
    entradas.map((e) => (e.isDirectory() ? listar(join(directorio, e.name)) : [join(directorio, e.name)])),
  );
  return archivos.flat();
}

const archivosMapa = (await listar(join(DIST, 'mapa')))
  .filter((ruta) => ruta.endsWith('.pbf'))
  .map((ruta) => '/' + relative(DIST, ruta).split(sep).map(encodeURIComponent).join('/'));

await writeFile(join(DIST, 'mapa', 'indice.json'), JSON.stringify({ cache: CACHE_MAPA, archivos: archivosMapa }));

const { count, size, warnings } = await generateSW({
  globDirectory: DIST,
  globPatterns: ['**/*.{html,js,css,svg,png,ico,woff2,webmanifest}'],
  // Subconjuntos de fuentes que el español no usa (símbolos, matemáticas y el latino extendido de Ibarra;
  // las letras del español están en el latino básico). Si una página los pide, se descargan en ese momento
  // Las tarjetas para compartir se descargan solo cuando alguien comparte
  // La hoja de códigos QR es para quien los instala, no para el visitante: no va sin conexión
  globIgnores: [
    'mapa/**',
    'tarjetas/**',
    'pasaporte/codigos/**',
    '_astro/*-math-*',
    '_astro/*-symbols-*',
    '_astro/ibarra-real-nova-latin-ext-*',
  ],
  swDest: join(DIST, 'sw.js'),
  mode: 'production',
  sourcemap: false,
  inlineWorkboxRuntime: true,
  clientsClaim: true,
  skipWaiting: false,
  cleanupOutdatedCaches: true,
  dontCacheBustURLsMatching: /\/_astro\//,
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  // Las páginas se guardan con la dirección que usan los enlaces (/rutas, no /rutas/index.html),
  // para encontrarlas sin señal. El servidor sirve /rutas desde rutas/index.html (.htaccess).
  manifestTransforms: [
    (entradas) => ({
      manifest: entradas.map((e) =>
        e.url !== 'index.html' && e.url.endsWith('/index.html') ? { ...e, url: e.url.slice(0, -'/index.html'.length) } : e,
      ),
      warnings: [],
    }),
  ],
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/mapa/') && url.pathname.endsWith('.pbf'),
      handler: 'CacheFirst',
      options: { cacheName: CACHE_MAPA },
    },
    {
      // Las fotos no van en la instalación (pesan demasiado): se guardan a medida que se ven,
      // para que lo ya visitado se vea completo sin señal. Su nombre cambia si cambia la foto.
      urlPattern: ({ url }) => url.pathname.startsWith('/_astro/') && /\.(avif|webp|jpe?g)$/.test(url.pathname),
      handler: 'CacheFirst',
      options: {
        cacheName: 'fotos',
        expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90, purgeOnQuotaError: true },
      },
    },
  ],
});

for (const aviso of warnings) console.warn(aviso);
console.log(
  `Service worker: ${count} archivos en la instalación (${(size / 1024).toFixed(0)} KB); mapa: ${archivosMapa.length} archivos en "${CACHE_MAPA}".`,
);
