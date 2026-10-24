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
