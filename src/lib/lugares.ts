import type { CollectionEntry } from 'astro:content';

/** Lo que un mapa necesita saber de cada lugar. */
export interface LugarMapa {
  id: string;
  nombre: string;
  categoria: string;
  epoca: string;
  resumen: string;
  coordenadas: [number, number];
}

export const CATEGORIAS: Record<
  CollectionEntry<'lugares'>['data']['categoria'],
  { singular: string; plural: string; icono: string }
> = {
  templo: { singular: 'Templo', plural: 'Templos', icono: 'church' },
  museo: { singular: 'Museo', plural: 'Museos', icono: 'bank' },
  puente: { singular: 'Puente', plural: 'Puentes', icono: 'bridge' },
  monumento: { singular: 'Monumento', plural: 'Monumentos', icono: 'map-pin' },
  plaza: { singular: 'Plaza', plural: 'Plazas', icono: 'park' },
  teatro: { singular: 'Teatro', plural: 'Teatros', icono: 'mask-happy' },
  gobierno: { singular: 'Sede de gobierno', plural: 'Gobierno', icono: 'buildings' },
  casa: { singular: 'Casa histórica', plural: 'Casas históricas', icono: 'house-line' },
  cocina: { singular: 'Cocina', plural: 'Cocinas', icono: 'fork-knife' },
  hacienda: { singular: 'Hacienda', plural: 'Haciendas', icono: 'barn' },
  desaparecido: { singular: 'Lugar desaparecido', plural: 'Lugares desaparecidos', icono: 'hourglass-simple' },
};

export function aMapa(lugar: CollectionEntry<'lugares'>): LugarMapa {
  return {
    id: lugar.id,
    nombre: lugar.data.nombre,
    categoria: lugar.data.categoria,
    epoca: lugar.data.epoca,
    resumen: lugar.data.resumen,
    coordenadas: lugar.data.coordenadas,
  };
}
