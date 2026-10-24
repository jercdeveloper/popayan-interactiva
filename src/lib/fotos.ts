import type { ImageMetadata } from 'astro';
import creditos from '../assets/fotos/creditos.json';

/**
 * Fotos de los lugares: un archivo por lugar en src/assets/fotos/<id>.jpg, todas de Wikimedia Commons con
 * licencia libre. Su crédito (autor, licencia y página de origen) vive en creditos.json y se muestra
 * siempre junto a la foto o en la página de créditos.
 */
export interface Credito {
  titulo: string;
  autor: string;
  licencia: string;
  urlLicencia: string | null;
  fuente: string;
}

const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.jpg', { eager: true });

const FOTOS: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(archivos).map(([ruta, modulo]) => [ruta.split('/').pop()!.replace(/\.jpg$/, ''), modulo.default]),
);

export const CREDITOS = creditos as Record<string, Credito>;

export interface Foto {
  id: string;
  src: ImageMetadata;
  credito: Credito;
}

export function fotoDe(id: string | undefined): Foto | null {
  if (!id || !FOTOS[id] || !CREDITOS[id]) return null;
  return { id, src: FOTOS[id], credito: CREDITOS[id] };
}

/** "Bernard Gagnon · CC BY-SA 4.0" */
export const lineaCredito = (c: Credito) => `${c.autor} · ${c.licencia}`;
