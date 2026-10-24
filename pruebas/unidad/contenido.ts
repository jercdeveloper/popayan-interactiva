// Lee el contenido del sitio directamente de los archivos, sin Astro, para cruzar colecciones.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const RAIZ = join(import.meta.dirname, '..', '..');
const ruta = (...partes: string[]) => join(RAIZ, ...partes);

export interface Fuente {
  titulo: string;
  url: string;
}

function leerMarkdown<T>(carpeta: string) {
  return readdirSync(ruta(carpeta))
    .filter((a) => a.endsWith('.md'))
    .map((a) => {
      const texto = readFileSync(ruta(carpeta, a), 'utf8');
      const [, frontmatter, ...resto] = texto.split('---');
      return { id: a.replace(/\.md$/, ''), cuerpo: resto.join('---'), ...(parse(frontmatter) as T) };
    });
}

export const lugares = leerMarkdown<{
  nombre: string;
  categoria: string;
  coordenadas: [number, number];
  epoca: string;
  resumen: string;
  dato?: string;
  fuentes: Fuente[];
}>('src/content/lugares');

export const rutas = leerMarkdown<{
  nombre: string;
  lema: string;
  orden: number;
  foto?: string;
  modo?: 'pie' | 'carro';
  paradas: string[];
}>('src/content/rutas');

export const eventos: {
  id: string;
  nombre: string;
  enFrase: string;
  cuando: string;
  inicio: string;
  fin?: string;
  resumen: string;
  lugar?: string;
  ruta?: string;
  jornadas?: { fecha: string; nombre: string; lugar?: string }[];
  fuentes: Fuente[];
}[] = JSON.parse(readFileSync(ruta('src/content/agenda.json'), 'utf8'));

export const hitos: { id: string; anio: number; titulo: string; texto: string; lugar?: string; fuente: Fuente }[] =
  JSON.parse(readFileSync(ruta('src/content/hitos.json'), 'utf8'));

export const creditos: Record<string, { titulo: string; autor: string; licencia: string; urlLicencia: string; fuente: string }> =
  JSON.parse(readFileSync(ruta('src/assets/fotos/creditos.json'), 'utf8'));

export const archivosDeFotos = readdirSync(ruta('src/assets/fotos'))
  .filter((a) => a.endsWith('.jpg'))
  .map((a) => a.replace(/\.jpg$/, ''));

/** Archivos de la interfaz (páginas y componentes) con su texto */
export function archivosDeInterfaz() {
  const salida: { archivo: string; texto: string }[] = [];
  const recorrer = (carpeta: string) => {
    for (const entrada of readdirSync(ruta(carpeta), { withFileTypes: true })) {
      const relativa = join(carpeta, entrada.name);
      if (entrada.isDirectory()) recorrer(relativa);
      else if (entrada.name.endsWith('.astro')) salida.push({ archivo: relativa, texto: readFileSync(ruta(relativa), 'utf8') });
    }
  };
  recorrer('src/pages');
  recorrer('src/components');
  recorrer('src/layouts');
  return salida;
}
