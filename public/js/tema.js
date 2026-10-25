// Aplica el tema elegido antes de pintar la página, para que no destelle el otro.
// Guardado: 'claro' u 'oscuro'; sin nada guardado, manda el tema del teléfono.
// Va como archivo aparte porque la CSP no admite scripts en línea.
try {
  var t = localStorage.getItem('tema');
  if (t === 'claro' || t === 'oscuro') {
    document.documentElement.dataset.tema = t;
    for (var m of document.querySelectorAll('meta[name="theme-color"]')) {
      m.setAttribute('content', t === 'oscuro' ? '#000000' : '#f5f5f7');
      m.removeAttribute('media');
    }
  }
} catch (e) {}
