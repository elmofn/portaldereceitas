import { test, expect } from '@playwright/test';

test('a entrada prioriza receitas e o menu separa as páginas', async ({ page }) => {
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('heading', { level: 1 })).toHaveText('Receitas com fonte');
 await expect(page.locator('.recipe-card')).toHaveCount(4);
 await expect(page.locator('.hero, dialog')).toHaveCount(0);
 await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Receitas', exact: true })).toHaveAttribute('aria-current', 'page');
 await page.getByRole('link', { name: 'Como congelar', exact: true }).click();
 await expect(page).toHaveURL(/pagina=congelar/);
 await expect(page.getByRole('heading', { level: 1 })).toHaveText('Como congelar com cuidado');
 await expect(page.locator('.recipe-card')).toHaveCount(0);
 await page.getByRole('link', { name: 'Sobre', exact: true }).click();
 await expect(page).toHaveURL(/pagina=sobre/);
 await expect(page.getByRole('heading', { level: 1 })).toContainText('Comida simples.');
 expect(errors).toEqual([]);
});

test('receita tem URL própria, recarrega, baixa PDF e preserva a busca na volta', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('button', { name: 'Com frango', exact: true }).click();
 await expect(page.locator('.recipe-card')).toHaveCount(2);
 await page.getByRole('searchbox').fill('aspargos');
 await expect(page.locator('.recipe-card')).toHaveCount(1);
 await page.getByRole('link', { name: 'Ver receita', exact: true }).click();
 await expect(page).toHaveURL(/receita=myplate-salada/);
 await expect(page.getByRole('heading', { level: 1 })).toHaveText('Salada de frango, arroz, aspargos e tangerina');
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Ingredientes', exact: true })).toBeVisible();
 await page.getByRole('navigation', { name: 'Nesta receita' }).getByRole('link', { name: 'Modo de preparo' }).click();
 await expect(page).toHaveURL(/#preparo$/);
 const downloaded = page.waitForEvent('download');
 await page.getByRole('button', { name: 'Salvar ou compartilhar PDF', exact: true }).click();
 expect((await downloaded).suggestedFilename()).toBe('carinho-no-pote-myplate-salada.pdf');
 await page.getByRole('link', { name: 'Voltar às receitas', exact: false }).click();
 await expect(page.getByRole('searchbox')).toHaveValue('aspargos');
 await expect(page.getByRole('button', { name: 'Com frango', exact: true })).toHaveAttribute('aria-pressed', 'true');
 await expect(page.locator('.recipe-card')).toHaveCount(1);
 await page.getByRole('searchbox').fill('inexistente');
 await expect(page.getByRole('heading', { name: 'Nenhuma receita encontrada' })).toBeVisible();
 await page.getByRole('button', { name: 'Ver todas as receitas' }).click();
 await expect(page.locator('.recipe-card')).toHaveCount(4);
});

test('links diretos, histórico do navegador e receita inexistente', async ({ page }) => {
 await page.goto('/?receita=panelinha-arroz-sirio');
 await expect(page).toHaveTitle(/Arroz sírio/);
 await expect(page.getByRole('heading', { name: 'Modo de preparo', exact: true })).toBeVisible();
 await page.getByRole('link', { name: 'Sobre', exact: true }).click();
 await page.goBack();
 await expect(page).toHaveURL(/receita=panelinha-arroz-sirio/);
 await expect(page.getByRole('heading', { level: 1 })).toContainText('Arroz sírio');
 await page.goto('/?receita=nao-existe');
 await expect(page.getByRole('heading', { level: 1 })).toHaveText('Receita não encontrada');
 await page.getByRole('link', { name: 'Ver todas as receitas' }).click();
 await expect(page.locator('.recipe-card')).toHaveCount(4);
});

test('menu visível e conteúdo sem overflow no celular e desktop', async ({ page }) => {
 for (const width of [375, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const path of ['/', '/?receita=nhs-chilli', '/?pagina=congelar', '/?pagina=sobre']) {
   await page.goto(path);
   const nav = page.getByRole('navigation', { name: 'Menu principal' });
   for (const name of ['Receitas', 'Como congelar', 'Sobre']) await expect(nav.getByRole('link', { name, exact: true })).toBeInViewport();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: ${path}`).toBe(true);
  }
 }
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('/');
 await expect(page.getByRole('searchbox')).toBeInViewport();
 await expect(page.locator('.recipe-card').first()).toBeInViewport();
});
