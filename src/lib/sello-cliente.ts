/**
 * En el navegador: muestra los sellos ganados y anima el momento de sellar.
 * El sello cae desde arriba, un poco girado, y rebota una vez al tocar el papel: es un golpe, no una
 * transición, así que lleva algo de rebote. Con movimiento reducido solo aparece.
 */
import { animate } from 'motion';
import { leer, type Sello } from './pasaporte';

export const sellosGuardados = () => {
  try {
    return leer(localStorage);
  } catch {
    return {};
  }
};

/** "24.10.26", como la fecha de un sello de goma */
export const fechaDeSello = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(2, 4)}`;

/** "24 de octubre de 2026" */
export const fechaEnTexto = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/** Marca como ganado el contenedor de un sello y le pone la fecha */
export function mostrarGanado(contenedor: Element, sello: Sello) {
  contenedor.classList.add('sello-ganado');
  for (const f of contenedor.querySelectorAll('[data-sello-fecha]')) f.textContent = fechaDeSello(sello.fecha);
}

export function animarSello(dibujo: SVGElement | HTMLElement) {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieto) {
    animate(dibujo, { opacity: [0, 1] }, { duration: 0.2 });
    return;
  }
  animate(
    dibujo,
    { scale: [1.7, 1], rotate: [-18, 0], opacity: [0, 1] },
    { type: 'spring', bounce: 0.38, duration: 0.55 },
  );
  // El golpe se siente en la mano en el mismo instante en que el sello toca el papel
  setTimeout(() => navigator.vibrate?.(24), 160);
}
