import { test, expect } from '@playwright/test';

test.describe('mapa', () => {
  test('abre un lugar desde la dirección', async ({ page }) => {
    await page.goto('/mapa?lugar=la-ermita');
    await expect(page.locator('[data-detalle-nombre]')).toHaveText('La Ermita de Jesús Nazareno');
    await expect(page.getByRole('link', { name: 'Ver la ficha' })).toHaveAttribute('href', '/lugares/la-ermita');
  });

  test('la búsqueda filtra la lista, sin importar las tildes', async ({ page }) => {
    await page.goto('/mapa');
    await page.locator('[data-buscar]').fill('belen');
    const visibles = page.locator('[data-lista] li:visible');
    await expect(visibles).toHaveCount(1);
    await expect(visibles.first()).toContainText('Santuario de Belén');
  });

  test('dibuja el mapa', async ({ page }) => {
    await page.goto('/mapa');
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15_000 });
  });
});

test('el mapa de una ruta se descarga solo al acercarse a él', async ({ page }) => {
  await page.goto('/rutas/templos');
  await page.waitForLoadState('networkidle');
  // En el celular el mapa queda debajo de la primera pantalla: todavía no debe existir
  if ((page.viewportSize()?.height ?? 0) < 900) await expect(page.locator('.maplibregl-canvas')).toHaveCount(0);
  await page.locator('[data-mapa-ruta]').scrollIntoViewIfNeeded();
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15_000 });
});

test('la ruta lista sus paradas en orden, con su ficha', async ({ page }) => {
  await page.goto('/rutas/templos');
  const paradas = page.locator('.paradas > li');
  await expect(paradas).toHaveCount(10);
  await expect(paradas.first()).toContainText('Santuario de Belén');
  await paradas.first().getByRole('link').click();
  await expect(page).toHaveURL(/\/lugares\/santuario-de-belen$/);
});

test('la agenda cuenta los días que faltan para lo próximo', async ({ page }) => {
  await page.goto('/agenda');
  await expect(page.locator('[data-proximo]')).toHaveText(/^(Faltan .+ para .+\.|Hoy: .+\.)$/);
});

test('compartir copia el enlace donde no hay menú del sistema', async ({ page, context, baseURL }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // Simula un navegador de escritorio sin Web Share
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined });
    Object.defineProperty(navigator, 'canShare', { value: undefined });
  });
  await page.goto('/lugares/la-ermita');
  await page.getByRole('button', { name: 'Compartir' }).click();
  await expect(page.locator('[data-aviso]')).toHaveText('Enlace copiado');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}/lugares/la-ermita`);
});

test('la tarjeta para compartir existe para cada ficha', async ({ request }) => {
  for (const ruta of ['/tarjetas/lugares/la-ermita.jpg', '/tarjetas/rutas/templos.jpg', '/tarjetas/og/inicio.jpg']) {
    const respuesta = await request.get(ruta);
    expect(respuesta.status(), ruta).toBe(200);
    expect(respuesta.headers()['content-type'], ruta).toContain('image/jpeg');
  }
});

test('sin conexión, las páginas siguen abriendo', async ({ page, context }) => {
  await page.goto('/');
  // Espera a que el service worker controle la página y termine de guardar el sitio
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
    }
  });
  await context.setOffline(true);
  for (const [ruta, titulo] of [
    ['/rutas/templos', 'Ruta de los templos'],
    ['/lugares/la-ermita', 'La Ermita de Jesús Nazareno'],
    ['/agenda', 'Agenda'],
    ['/informacion', 'Información útil'],
  ]) {
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 }), ruta).toContainText(titulo);
  }
});

test.describe('Semana Santa', () => {
  test('cuenta los días o marca la procesión de hoy', async ({ page }) => {
    await page.goto('/semana-santa');
    await expect(page.locator('[data-estado]')).toHaveText(/^(Faltan .+ para el Domingo de Ramos, el .+\.|Hoy: .+\.)$/);
    await expect(page.locator('.noches > li')).toHaveCount(8);
  });

  test('en la semana misma marca la noche de hoy', async ({ page }) => {
    // El Viernes Santo de 2027 es el 26 de marzo
    await page.clock.setFixedTime(new Date('2027-03-26T15:00:00-05:00'));
    await page.goto('/semana-santa');
    await expect(page.locator('[data-estado]')).toHaveText('Hoy: Procesión del Santo Entierro.');
    await expect(page.locator('.noche--hoy')).toHaveCount(1);
    await expect(page.locator('.noche--hoy')).toContainText('Viernes Santo');
  });

  test('recalcula las fechas si el sitio se compiló para otro año', async ({ page }) => {
    // En 2029 la Pascua es el 1 de abril: el Viernes Santo cae el 30 de marzo
    await page.clock.setFixedTime(new Date('2028-12-01T12:00:00-05:00'));
    await page.goto('/semana-santa');
    await expect(page.getByRole('heading', { name: 'Las procesiones de 2029' })).toBeVisible();
    await expect(page.locator('a[href="/semana-santa/viernes-santo"] [data-fecha]')).toHaveText('30 de marzo');
  });

  test('cada noche dibuja su recorrido y lista sus pasos', async ({ page }) => {
    await page.goto('/semana-santa/viernes-santo');
    await expect(page.locator('.paso')).toHaveCount(14);
    await expect(page.locator('.paso').first()).toContainText('La Muerte');
    await page.locator('[data-mapa-ruta]').scrollIntoViewIfNeeded();
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15_000 });
  });

  test('la portada lleva a Semana Santa', async ({ page }) => {
    await page.goto('/');
    await page.locator('.widget--noche').click();
    await expect(page).toHaveURL(/\/semana-santa$/);
  });
});
