// La agenda se ajusta al día de hoy de quien la mira: retira lo que ya pasó y cuenta los días que
// faltan para lo próximo. Se carga sin "defer", justo después de la lista, para que corra antes de
// pintar y la página no salte. Va como archivo aparte porque la CSP no admite scripts en línea.
{
  const DIA = 86_400_000;
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const aFecha = (iso) => Date.parse(`${iso}T00:00:00Z`);

  const eventos = [...document.querySelectorAll('[data-evento]')];
  for (const el of eventos) {
    if (aFecha(el.dataset.fin) < hoyUTC) el.hidden = true;
  }
  for (const mes of document.querySelectorAll('[data-mes]')) {
    mes.hidden = !mes.querySelector('[data-evento]:not([hidden])');
  }

  const siguiente = eventos.find((el) => !el.hidden);
  const proximo = document.querySelector('[data-proximo]');
  if (siguiente && proximo) {
    const frase = siguiente.dataset.frase;
    const dias = Math.round((aFecha(siguiente.dataset.inicio) - hoyUTC) / DIA);
    const aprox = siguiente.dataset.confirmada === 'true' ? '' : 'unos ';
    const cifra = document.createElement('strong');
    if (dias <= 0) {
      cifra.textContent = 'Hoy';
      proximo.append(cifra, `: ${frase}.`);
    } else {
      cifra.textContent = `${aprox}${dias} ${dias === 1 ? 'día' : 'días'}`;
      proximo.append('Faltan ', cifra, ` para ${frase}.`);
    }
  } else if (proximo) {
    // Sin nada por delante, el espacio reservado se retira
    proximo.hidden = true;
  }
}
