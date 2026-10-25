import { test, expect } from '@playwright/test';

test.describe('Planificador', () => {
  test('el plan cambia con los días', async ({ page }) => {
    await page.goto('/planificador');
    await expect(page.locator('[data-dias] > li')).toHaveCount(2);
    await page.getByText('3 días').click();
    await expect(page.locator('[data-dias] > li')).toHaveCount(3);
    await page.getByText('1 día', { exact: true }).click();
    await expect(page.locator('[data-dias] > li')).toHaveCount(1);
    // La elección queda en la dirección, lista para compartir
    await expect(page).toHaveURL(/dias=1/);
  });

  test('con fecha y gusto por la cultura, Silvia va el martes', async ({ page }) => {
    // El 26 de octubre de 2027 es martes
    await page.goto('/planificador?dias=3&desde=2027-10-25&gustos=cultura');
    const martes = page.locator('[data-dias] > li').nth(1);
    await expect(martes.locator('.dia__titulo')).toContainText('martes 26 de octubre');
    await expect(martes).toContainText('Silvia y el mercado de los martes');
  });

  test('en Semana Santa, las noches traen la procesión', async ({ page }) => {
    await page.goto('/planificador?dias=2&desde=2027-03-25');
    await expect(page.locator('[data-dias] > li').first()).toContainText('Procesión del Santo Cristo de la Veracruz');
    await expect(page.locator('[data-dias] > li').nth(1)).toContainText('Procesión del Santo Entierro');
  });

  test('un enlace compartido abre el mismo plan', async ({ page }) => {
    await page.goto('/planificador?dias=3&carro=1&gustos=naturaleza');
    await expect(page.getByRole('switch')).toBeChecked();
    await expect(page.getByLabel('Naturaleza')).toBeChecked();
    await expect(page.locator('[data-dias]')).toContainText('Ruta de las haciendas');
  });

  test('recuerda lo último que eligió en este teléfono', async ({ page }) => {
    await page.goto('/planificador');
    await page.getByText('3 días').click();
    await page.getByText('Comida', { exact: true }).click();
    await page.goto('/planificador');
    await expect(page.locator('[data-dias] > li')).toHaveCount(3);
    await expect(page.getByLabel('Comida')).toBeChecked();
  });

  test('la excursión al Puracé muestra su aviso con fecha', async ({ page }) => {
    await page.goto('/excursiones/purace');
    await expect(page.locator('.aviso')).toContainText('volvió a amarilla');
    await expect(page.locator('.aviso__pie')).toContainText(/Revisado el \d+ de \w+ de \d{4}/);
  });
});
