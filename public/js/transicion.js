// La foto de una ruta viaja de su tarjeta a la cabecera de la ruta, y de vuelta (transición entre páginas).
// Va en un archivo aparte porque los guiones en línea no pasan la CSP, y en la cabeza para no perder "pagereveal".
(function () {
  var RUTA = /^\/rutas\/([^\/]+)\/?$/;
  function idDe(desde, hacia) {
    var m = RUTA.exec(hacia) || RUTA.exec(desde);
    return m ? m[1] : null;
  }
  function nombrar(id) {
    var foto = id && document.querySelector('[data-transicion="foto-ruta-' + id + '"]');
    if (foto) foto.style.viewTransitionName = 'foto-ruta';
    return foto;
  }
  addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    var foto = nombrar(idDe(location.pathname, new URL(e.activation.entry.url).pathname));
    // Si la página vuelve desde el historial, que la foto no quede nombrada
    if (foto) e.viewTransition.finished.finally(function () { foto.style.viewTransitionName = ''; });
  });
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
    var foto = nombrar(idDe(new URL(navigation.activation.from.url).pathname, location.pathname));
    if (foto) e.viewTransition.finished.finally(function () { foto.style.viewTransitionName = ''; });
  });
})();
