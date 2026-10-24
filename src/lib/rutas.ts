import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import { medirRecorrido } from './recorrido';

export { distanciaMetros, formatearDuracion, formatearDistancia } from './recorrido';

export interface ResumenRuta {
  ruta: CollectionEntry<'rutas'>;
  paradas: CollectionEntry<'lugares'>[];
  metros: number;
  minutos: number;
}

/** Distancia y duración aproximadas, calculadas a partir de las coordenadas de las paradas. */
export async function resumirRuta(ruta: CollectionEntry<'rutas'>): Promise<ResumenRuta> {
  const paradas = await getEntries(ruta.data.paradas);
  const { metros, minutos } = medirRecorrido(
    paradas.map((p) => p.data.coordenadas),
    ruta.data.modo,
  );
  return { ruta, paradas, metros, minutos };
}

export async function rutasOrdenadas() {
  const rutas = await getCollection('rutas');
  rutas.sort((a, b) => a.data.orden - b.data.orden);
  return Promise.all(rutas.map(resumirRuta));
}
