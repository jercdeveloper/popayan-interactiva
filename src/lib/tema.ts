/**
 * El tema claro u oscuro. Por defecto manda el del teléfono; el botón guarda una elección solo cuando
 * es distinta de la del teléfono, así que volver a la del sistema es volver a «automático».
 * Las páginas de Semana Santa van siempre de noche y no lo cambian.
 */
export type Tema = 'claro' | 'oscuro';
const CLAVE = 'tema';
const sistema = () => matchMedia('(prefers-color-scheme: dark)');

export function temaEfectivo(): Tema {
  const raiz = document.documentElement;
  if (raiz.hasAttribute('data-noche')) return 'oscuro';
  const elegido = raiz.dataset.tema;
  if (elegido === 'claro' || elegido === 'oscuro') return elegido;
  return sistema().matches ? 'oscuro' : 'claro';
}

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  const delSistema: Tema = sistema().matches ? 'oscuro' : 'claro';
  try {
    if (tema === delSistema) localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, tema);
  } catch {}
  if (tema === delSistema) delete raiz.dataset.tema;
  else raiz.dataset.tema = tema;
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
    m.setAttribute('content', tema === 'oscuro' ? '#000000' : '#f5f5f7');
    m.removeAttribute('media');
  }
  dispatchEvent(new CustomEvent('tema', { detail: tema }));
}

/** Cambia al otro tema. Con un origen (el botón), el nuevo tema se abre en círculo desde ahí. */
export function cambiarTema(origen?: { x: number; y: number }) {
  const nuevo: Tema = temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!origen || quieto || !('startViewTransition' in document)) {
    aplicar(nuevo);
    return;
  }
  const raiz = document.documentElement;
  raiz.classList.add('cambiando-tema');
  const transicion = document.startViewTransition(() => aplicar(nuevo));
  transicion.ready.then(() => {
    const radio = Math.hypot(Math.max(origen.x, innerWidth - origen.x), Math.max(origen.y, innerHeight - origen.y));
    raiz.animate(
      { clipPath: [`circle(0px at ${origen.x}px ${origen.y}px)`, `circle(${radio}px at ${origen.x}px ${origen.y}px)`] },
      { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  });
  transicion.finished.finally(() => raiz.classList.remove('cambiando-tema'));
}

/** Avisa cuando cambia el tema efectivo, por el botón o por el teléfono */
export function alCambiarTema(fn: (tema: Tema) => void) {
  addEventListener('tema', () => fn(temaEfectivo()));
  sistema().addEventListener('change', () => fn(temaEfectivo()));
}
