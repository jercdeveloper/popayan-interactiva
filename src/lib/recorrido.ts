/**
 * Distancia y duración de un recorrido a partir de las coordenadas de sus paradas.
 * No depende de Astro: lo usan las páginas y también el generador de tarjetas.
 */
const RADIO_TIERRA_M = 6_371_000;

/**
 * Cómo se calcula cada modo:
 * - factor: de distancia en línea recta a distancia real (calles en damero, o carreteras de montaña)
 * - velocidad: en m/min. A pie, unos 4 km/h con pendientes y aceras estrechas; en carro, unos 30 km/h
 *   por vías rurales y destapadas.
 * - visita: minutos estimados en cada parada
 */
export const MODOS = {
  pie: { factor: 1.3, velocidad: 67, visita: 12 },
  carro: { factor: 1.5, velocidad: 500, visita: 20 },
} as const;

export function distanciaMetros([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a));
}

export function medirRecorrido(coordenadas: [number, number][], modo: keyof typeof MODOS) {
  let recta = 0;
  for (let i = 1; i < coordenadas.length; i++) recta += distanciaMetros(coordenadas[i - 1], coordenadas[i]);
  const { factor, velocidad, visita } = MODOS[modo];
  const metros = Math.round((recta * factor) / 50) * 50;
  const minutos = Math.round((metros / velocidad + coordenadas.length * visita) / 5) * 5;
  return { metros, minutos };
}

export function formatearDuracion(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

export function formatearDistancia(metros: number) {
  return metros < 1000 ? `${metros} m` : `${(metros / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`;
}
