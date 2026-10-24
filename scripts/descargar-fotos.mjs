// Descarga de Wikimedia Commons las fotos elegidas (1600 px) y guarda su crédito en src/assets/fotos/creditos.json.
// Uso: node scripts/descargar-fotos.mjs <elegidas.json>   con { "id-del-lugar": "File:Título exacto.jpg" }
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'PopayanInteractiva/0.1 (prototipo de guia cultural)';
const espera = (ms) => new Promise((s) => setTimeout(s, ms));
const elegidas = JSON.parse(await readFile(process.argv[2], 'utf8'));
const rutaCreditos = 'src/assets/fotos/creditos.json';
const creditos = JSON.parse(await readFile(rutaCreditos, 'utf8'));

async function pedir(url, comoTexto) {
  for (let intento = 0; intento < 5; intento++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return comoTexto ? r.text() : Buffer.from(await r.arrayBuffer());
    await espera(5000 * (intento + 1));
  }
  throw new Error(`No se pudo descargar ${url}`);
}

for (const [id, titulo] of Object.entries(elegidas)) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', format: 'json', titles: titulo, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600', origin: '*' });
  const pagina = Object.values(JSON.parse(await pedir(url, true)).query.pages)[0];
  const i = pagina.imageinfo?.[0];
  if (!i) {
    console.log(`${id}: no encontré ${titulo}`);
    continue;
  }
  const m = i.extmetadata;
  const foto = await pedir(i.thumburl ?? i.url);
  await writeFile(`src/assets/fotos/${id}.jpg`, foto);
  creditos[id] = {
    titulo: titulo.replace(/^File:/, ''),
    autor: (m.Artist?.value ?? 'Autor desconocido').replace(/<[^>]+>/g, '').trim(),
    licencia: m.LicenseShortName?.value ?? '',
    urlLicencia: m.LicenseUrl?.value ?? null,
    fuente: i.descriptionurl,
  };
  console.log(`${id}: ${(foto.length / 1024).toFixed(0)} KB · ${creditos[id].autor} · ${creditos[id].licencia}`);
  await writeFile(rutaCreditos, JSON.stringify(creditos, null, 2) + '\n');
  await espera(1500);
}
