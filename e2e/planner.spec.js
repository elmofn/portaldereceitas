import { test, expect } from '@playwright/test';

test('planeja refeições, guarda por semana, exporta e limpa com confirmação', async ({page}) => {
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?pagina=semana&semana=2026-10-19');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Minha semana');
 await expect(page.locator('.day-card')).toHaveCount(7);
 await expect(page.locator('[data-slot]')).toHaveCount(14);
 await expect(page.locator('#week-pdf')).toBeDisabled();
 await page.locator('#recipe-0-0').selectOption('nhs-chilli');
 await page.locator('#portions-0-0').selectOption('3');
 await expect(page.locator('.week-status')).toContainText('1 de 14 refeições');
 await expect(page.locator('.week-status')).toContainText('3 porções planejadas');
 await page.reload();
 await expect(page.locator('#recipe-0-0')).toHaveValue('nhs-chilli');
 await expect(page.locator('#portions-0-0')).toHaveValue('3');
 await page.getByRole('button',{name:'Próxima semana'}).click();
 await expect(page.locator('.week-status')).toContainText('0 de 14 refeições');
 await page.locator('#recipe-0-0').selectOption('panelinha-arroz-sirio');
 await page.getByRole('button',{name:'Semana anterior'}).click();
 await expect(page.locator('#recipe-0-0')).toHaveValue('nhs-chilli');
 await page.getByRole('button',{name:'Preencher espaços vazios'}).click();
 await expect(page.locator('.week-status')).toContainText('14 de 14 refeições');
 await expect(page.locator('#portions-0-0')).toHaveValue('3');
 const download=page.waitForEvent('download');await page.locator('#week-pdf').click();
 expect((await download).suggestedFilename()).toBe('carinho-no-pote-semana-2026-10-19.pdf');
 await page.getByRole('button',{name:'Limpar esta semana',exact:true}).click();
 await expect(page.locator('.week-status')).toContainText('14 de 14 refeições');
 await page.getByRole('button',{name:'Cancelar',exact:true}).click();
 await expect(page.locator('.week-status')).toContainText('14 de 14 refeições');
 await page.getByRole('button',{name:'Limpar esta semana',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar limpeza desta semana'}).click();
 await expect(page.locator('.week-status')).toContainText('0 de 14 refeições');
 await page.getByRole('button',{name:'Próxima semana'}).click();
 await expect(page.locator('#recipe-0-0')).toHaveValue('panelinha-arroz-sirio');
 await page.getByRole('button',{name:'Remover almoço de segunda-feira'}).click();
 await expect(page.locator('#recipe-0-0')).toHaveValue('');
 expect(errors).toEqual([]);
});

test('inclui receita pela página e permite escolher dia e refeição',async({page})=>{
 await page.goto('/?receita=nhs-chilli');
 await page.getByRole('link',{name:'Incluir no cardápio da semana',exact:false}).click();
 await expect(page.locator('.pending-recipe')).toContainText('Chilli');
 await page.locator('[data-add="2-1"]').click();
 await expect(page.locator('#recipe-2-1')).toHaveValue('nhs-chilli');
 await expect(page.locator('.pending-recipe')).toHaveCount(0);
 await expect(page).not.toHaveURL(/adicionar/);
 await page.locator('.planned-name').click();
 await expect(page).toHaveURL(/receita=nhs-chilli/);
});

test('funciona com armazenamento indisponível e dados corrompidos',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(Storage.prototype,'setItem',{value(){throw new Error('blocked');}});});
 await page.goto('/?pagina=semana');
 await page.locator('#recipe-0-0').selectOption('nhs-chilli');
 await expect(page.locator('.save-status')).toContainText('Não foi possível salvar');
 await expect(page.locator('#week-pdf')).toBeEnabled();
 await page.locator('#week-date').fill('2026-10-21');
 await expect(page.locator('#week-date')).toHaveValue('2026-10-19');
});

test('menu e planejador cabem no celular, tablet e desktop',async({page})=>{
 for(const width of [375,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/?pagina=semana');
  const fillButton=page.getByRole('button',{name:'Preencher espaços vazios'});
  if(await fillButton.isEnabled())await fillButton.click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow em ${width}`).toBe(true);
  for(const name of ['Minha semana','Receitas','Como congelar','Sobre'])await expect(page.getByRole('navigation',{name:'Menu principal'}).getByRole('link',{name,exact:true})).toBeInViewport();
 }
});
