// Busca en Wikimedia Commons fotos candidatas, con licencia libre, para los lugares que aún no tienen. No descarga nada.
// Uso: node scripts/buscar-fotos.mjs <salida.json>
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
const UA = 'PopayanInteractiva/0.1 (prototipo de guia cultural)';
// La foto tiene que ser de Popayán o de su región, no de otro lugar con el mismo nombre
const DE_LA_REGION = /popay|cauca|timb[ií]o|coconuco|purac[eé]|calib[ií]o|pisoj/i;
const espera = (ms) => new Promise((s) => setTimeout(s, ms));
async function consultar(url) {
  for (let intento = 0; intento < 5; intento++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const texto = await r.text();
    if (texto.startsWith('{')) return JSON.parse(texto);
    await espera(5000 * (intento + 1)); // Commons pide bajar el ritmo
  }
  throw new Error('Commons no respondió');
}
const LIBRES = /^(CC BY(-SA)? [\d.]+|CC0|Public domain|CC BY [\d.]+)$/i;
const ya = JSON.parse(await readFile('src/assets/fotos/creditos.json', 'utf8'));
const dir = 'src/content/lugares';
const salida = {};
for (const a of (await readdir(dir)).filter((f) => f.endsWith('.md'))) {
  const id = a.replace('.md', '');
  if (ya[id]) { salida[id] = { yaTiene: true }; continue; }
  if (process.argv[3] && JSON.parse(await readFile(process.argv[3], 'utf8').catch(() => '{}'))[id]?.candidatas?.length) continue;
  const datos = parse((await readFile(`${dir}/${id}.md`, 'utf8')).split('---')[1]);
  const consultas = [`${datos.nombre} Popayán`, datos.nombre.replace(/\(.*?\)/g, '').trim()];
  let candidatas = [];
  for (const q of consultas) {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.search = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '6', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600', origin: '*' });
    const d = await consultar(url);
    candidatas = Object.values(d.query?.pages ?? {})
      .sort((x, y) => x.index - y.index)
      .map((p) => ({ titulo: p.title, i: p.imageinfo?.[0] }))
      .filter((c) => c.i && LIBRES.test(c.i.extmetadata?.LicenseShortName?.value ?? '') && c.i.width >= 1200)
      .filter((c) => DE_LA_REGION.test(`${c.titulo} ${c.i.extmetadata?.ImageDescription?.value ?? ''} ${c.i.extmetadata?.Categories?.value ?? ''}`))
      .map((c) => ({
        titulo: c.titulo,
        ancho: c.i.width,
        alto: c.i.height,
        licencia: c.i.extmetadata.LicenseShortName.value,
        autor: (c.i.extmetadata.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(),
        descripcion: (c.i.extmetadata.ImageDescription?.value ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 120),
      }));
    await espera(1500);
    if (candidatas.length) break;
  }
  salida[id] = { nombre: datos.nombre, candidatas };
  console.log(`${id.padEnd(36)} ${candidatas.length ? candidatas.slice(0, 2).map((c) => `${c.titulo.slice(5, 60)} [${c.licencia}]`).join(' | ') : '—'}`);
}
await writeFile(process.argv[2] ?? 'candidatas.json', JSON.stringify(salida, null, 2));
