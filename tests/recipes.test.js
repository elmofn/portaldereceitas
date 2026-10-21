import test from 'node:test';
import assert from 'node:assert/strict';
import {recipes,selectRecipes} from '../src/recipes.js';
import {createRecipePdf} from '../src/pdf.js';
test('busca combina ingrediente, acentos e categoria',()=>{
 assert.equal(selectRecipes('ABÓBORA').length,1);
 assert.equal(selectRecipes('abobora').length,1);
 assert.equal(selectRecipes('', 'Sem carne').length,3);
 assert.equal(selectRecipes('frango','Sem carne').length,0);
 assert.equal(selectRecipes('inexistente').length,0);
});
test('cada receita gera um PDF válido com ingredientes, preparo e armazenamento',()=>{
 for(const recipe of recipes){
  const doc=createRecipePdf(recipe);
  const output=doc.output();
  assert.ok(output.startsWith('%PDF-'));
  assert.ok(doc.getNumberOfPages()>=1);
  assert.ok(output.includes('Ingredientes'));
  assert.ok(output.includes('Modo de preparo'));
  assert.ok(output.includes('Para congelar com cuidado'));
  assert.ok(output.includes('Para aquecer'));
 }
});
