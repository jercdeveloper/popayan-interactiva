import { test, expect } from '@playwright/test';
import { codigoDeSello } from '../../src/lib/codigo-sello';

const ERMITA = { latitude: 2.440168, longitude: -76.602645 };
// La Torre del Reloj queda a unos 450 m de La Ermita
const TORRE = { latitude: 2.441472, longitude: -76.606862 };

test.describe('Pasaporte', () => {
  test('se sella estando en el lugar', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ ...ERMITA, accuracy: 12 });
    await page.goto('/lugares/la-ermita');
    await page.getByRole('button', { name: 'Sellar mi pasaporte' }).click();
    await expect(page.locator('[data-sellar-estado]')).toHaveText(/^Sellado el \d+ de \w+ de \d{4}\.$/);
    await expect(page.locator('[data-sellar]')).toHaveClass(/sello-ganado/);
    await expect(page.getByRole('button', { name: 'Sellar mi pasaporte' })).toBeHidden();

    // El sello sigue ahí al volver, y aparece en el pasaporte
    await page.goto('/pasaporte');
    await expect(page.locator('[data-cuenta]')).toHaveText('1');
    await expect(page.locator('[data-hueco="la-ermita"]').first()).toHaveClass(/sello-ganado/);
  });

  test('lejos del lugar, dice cuánto falta y no sella', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ ...TORRE, accuracy: 10 });
    await page.goto('/lugares/la-ermita');
    await page.getByRole('button', { name: 'Sellar mi pasaporte' }).click();
    await expect(page.locator('[data-sellar-estado]')).toHaveText(/^Te faltan unos \d+ m\./);
    await expect(page.locator('[data-sellar]')).not.toHaveClass(/sello-ganado/);
  });

  test('el código QR del lugar sella', async ({ page }) => {
    await page.goto(`/sello/la-ermita?c=${codigoDeSello('la-ermita')}`);
    await expect(page.locator('[data-sello-estado]')).toHaveText('¡Sellado! Ya está en tu pasaporte.');
    // Volver a escanearlo no lo repite
    await page.reload();
    await expect(page.locator('[data-sello-estado]')).toHaveText(/^Ya tenías este sello desde el /);
  });

  test('el código de otro lugar no sella', async ({ page }) => {
    await page.goto(`/sello/la-ermita?c=${codigoDeSello('catedral')}`);
    await expect(page.locator('[data-sello-estado]')).toHaveText(/no corresponde a este lugar/);
    await page.goto('/pasaporte');
    await expect(page.locator('[data-cuenta]')).toHaveText('0');
  });

  test('la copia de seguridad devuelve los sellos', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/sello/torre-del-reloj?c=${codigoDeSello('torre-del-reloj')}`);
    await expect(page.locator('[data-sello-estado]')).toHaveText(/Sellado/);

    await page.goto('/pasaporte');
    await page.getByRole('button', { name: 'Copiar el código' }).click();
    await expect(page.locator('[data-copia-aviso]')).toHaveText(/Código copiado/);
    const codigo = await page.evaluate(() => navigator.clipboard.readText());
    expect(codigo).toMatch(/^PI1\./);

    // Teléfono nuevo: sin sellos
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('[data-cuenta]')).toHaveText('0');

    await page.getByLabel('Recuperar los sellos de una copia').fill(codigo);
    await page.getByRole('button', { name: 'Recuperar' }).click();
    await expect(page.locator('[data-copia-aviso]')).toHaveText('Listo: recuperaste 1 sello.');
    await expect(page.locator('[data-cuenta]')).toHaveText('1');
  });

  test('una ruta completa gana su insignia', async ({ page }) => {
    const PUENTES = ['chorrito-de-la-pamba', 'pueblito-patojo', 'museo-de-historia-natural', 'morro-de-tulcan', 'puente-del-humilladero'];
    const sembrar = (ids: string[]) =>
      page.addInitScript((lista) => {
        const hoy = { fecha: '2026-10-24', modo: 'ubicacion' };
        localStorage.setItem('pasaporte-v1', JSON.stringify(Object.fromEntries(lista.map((id) => [id, hoy]))));
      }, ids);

    // Con una parada sin sellar, todavía no
    await sembrar(PUENTES);
    await page.goto('/pasaporte');
    const puentes = page.locator('[data-coleccion="puentes-y-morro"]');
    await expect(puentes.locator('[data-coleccion-cuenta]')).toHaveText('5');
    await expect(puentes.locator('[data-coleccion-completa]')).toBeHidden();

    // Con la última, la colección queda completa y se puede compartir
    await sembrar([...PUENTES, 'puente-de-la-custodia']);
    await page.reload();
    await expect(puentes.locator('[data-coleccion-cuenta]')).toHaveText('6');
    await expect(puentes.locator('[data-coleccion-completa]')).toBeVisible();
    await expect(puentes.getByRole('button', { name: 'Compartir' })).toBeVisible();
  });

  test('la portada cuenta los sellos', async ({ page }) => {
    await page.goto(`/sello/catedral?c=${codigoDeSello('catedral')}`);
    await expect(page.locator('[data-sello-estado]')).toHaveText(/Sellado/);
    await page.goto('/');
    await expect(page.locator('[data-pasaporte-texto]')).toHaveText(/^Llevas 1 de \d+ sellos$/);
  });
});
