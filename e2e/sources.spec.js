import {test,expect} from '@playwright/test';
test('receitas mostram fontes e não inventam prazos de congelamento',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.recipe-card')).toHaveCount(4);
 await expect(page.locator('.recipe-source')).toHaveCount(4);
 await page.locator('#freezing-filter').selectOption('yes');
 await expect(page.locator('.recipe-card')).toHaveCount(1);
 await page.getByRole('link',{name:'Ver receita',exact:true}).click();
 await expect(page.locator('.source-panel')).toContainText('NHS Better Health');
 await expect(page.locator('.recipe-summary')).toContainText('35 min');
 await expect(page.locator('#armazenamento')).toContainText('Prazo de freezer: não informado');
 await expect(page.locator('#armazenamento')).toContainText('It also freezes well');
 await page.goto('/?receita=frango');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Receita retirada do catálogo');
});
test('consulta distingue forma crua, cozida, não recomendado e não reconhecido',async({page})=>{
 await page.goto('/');
 await page.getByText('Posso congelar este ingrediente?',{exact:true}).click();
 await page.locator('#ingredient-name').fill('arroz');
 await page.locator('#ingredient-state').selectOption('cooked');
 await page.getByRole('button',{name:'Consultar ingrediente'}).click();
 await expect(page.locator('#ingredient-result [data-status=yes]')).toContainText('Arroz');
 await page.locator('#ingredient-name').fill('ovo');
 await page.locator('#ingredient-state').selectOption('shell');
 await page.getByRole('button',{name:'Consultar ingrediente'}).click();
 await expect(page.locator('#ingredient-result [data-status=no]')).toContainText('não recomendado');
 await page.locator('#ingredient-name').fill('ingrediente desconhecido');
 await page.getByRole('button',{name:'Consultar ingrediente'}).click();
 await expect(page.locator('#ingredient-result [data-status=unknown]')).toBeVisible();
});
test('sugestões usam apenas receita com indicação e avisam sobre escolhas antigas',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('carinho-no-pote:cardapio:v1',JSON.stringify({weeks:{'2026-10-19':{'0-0':{recipe:'frango',portions:2}}}})));
 await page.goto('/?pagina=semana&semana=2026-10-19');
 await expect(page.locator('.catalog-notice')).toContainText('retiradas por falta de fonte');
 await expect(page.locator('#recipe-0-0')).toHaveValue('');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('carinho-no-pote:cardapio:v1')).weeks['2026-10-19']['0-0'].recipe)).toBe('frango');
 await page.getByRole('button',{name:'Preencher espaços vazios'}).click();
 expect(await page.locator('[data-slot]').evaluateAll(items=>items.every(item=>item.value==='nhs-chilli'))).toBe(true);
});
