import { test, expect } from '@playwright/test';

const fondo = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('Modo claro y oscuro', () => {
  test('el botón cambia el tema y lo recuerda', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/agenda');
    expect(await fondo(page)).toBe('rgb(245, 245, 247)');
    await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'oscuro');
    await expect.poll(() => fondo(page)).toBe('rgb(0, 0, 0)');
    // Sigue oscuro al volver a abrir la página
    await page.reload();
    expect(await fondo(page)).toBe('rgb(0, 0, 0)');
    await expect(page.getByRole('button', { name: 'Cambiar a modo claro' })).toBeVisible();
  });

  test('volver al tema del teléfono es volver a automático', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/agenda');
    await page.getByRole('button', { name: 'Cambiar a modo claro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'claro');
    await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-tema', /.+/);
    expect(await page.evaluate(() => localStorage.getItem('tema'))).toBeNull();
  });

  test('en Semana Santa no hay botón: va siempre de noche', async ({ page }) => {
    await page.goto('/semana-santa');
    await expect(page.locator('[data-boton-tema]')).toHaveCount(0);
  });

  test('no choca con los controles de las fichas con foto', async ({ page }) => {
    await page.goto('/lugares/la-ermita');
    const boton = await page.locator('[data-boton-tema]').boundingBox();
    const compartir = await page.getByRole('button', { name: 'Compartir' }).boundingBox();
    expect(boton && compartir).toBeTruthy();
    const seCruzan =
      boton!.x < compartir!.x + compartir!.width &&
      compartir!.x < boton!.x + boton!.width &&
      boton!.y < compartir!.y + compartir!.height &&
      compartir!.y < boton!.y + boton!.height;
    expect(seCruzan).toBe(false);
  });
});
