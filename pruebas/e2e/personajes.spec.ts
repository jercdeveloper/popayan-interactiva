import { test, expect } from '@playwright/test';

test.describe('Personajes', () => {
  test('van en el orden en que nacieron', async ({ page }) => {
    await page.goto('/personajes');
    const nombres = await page.locator('.persona__nombre').allTextContents();
    expect(nombres[0]).toBe('Sebastián de Belalcázar');
    expect(nombres.at(-1)).toBe('Edgar Negret');
  });

  test('la persona lleva a su lugar, y el lugar a la persona', async ({ page }) => {
    await page.goto('/personajes/mosquera');
    await page.getByRole('link', { name: /Casa Museo Mosquera/ }).click();
    await expect(page).toHaveURL(/\/lugares\/casa-museo-mosquera$/);
    await page.getByRole('link', { name: /Tomás Cipriano de Mosquera/ }).click();
    await expect(page).toHaveURL(/\/personajes\/mosquera$/);
  });

  test('la historia lleva a los personajes', async ({ page }) => {
    await page.goto('/historia');
    await page.getByRole('link', { name: /Personajes/ }).click();
    await expect(page).toHaveURL(/\/personajes$/);
  });
});
