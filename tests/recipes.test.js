import test from 'node:test';
import assert from 'node:assert/strict';
import {recipes,selectRecipes,retiredRecipeIds} from '../src/recipes.js';
import {createRecipePdf} from '../src/pdf.js';
import snapshots from '../src/data/recipe-snapshots.json' with {type:'json'};
test('busca combina ingrediente, acentos, categoria e congelamento',()=>{
 assert.equal(selectRecipes('SÍRIO').length,1);
 assert.equal(selectRecipes('sirio').length,1);
 assert.equal(selectRecipes('', 'Com frango').length,2);
 assert.equal(selectRecipes('frango','Com peixe').length,0);
 assert.equal(selectRecipes('inexistente').length,0);
 assert.equal(selectRecipes('','Todas','yes').length,1);
});
test('toda receita publicada corresponde a registro com autoria e sem prazo inventado',()=>{
 for(const recipe of recipes){
  const original=snapshots[recipe.snapshot];
  assert.equal(recipe.source.publisher,original.author);
  assert.equal(recipe.source.originalTitle,original.title);
  assert.equal(recipe.portions,Number(original.yields.match(/\d+/)[0]));
  assert.equal(recipe.freezing.days,null);
  assert.equal(recipe.source.access,'snapshot');
  assert.match(recipe.source.snapshotUrl,/b49b0ff0f2f69970f9579d0c5d086892c335011c/);
  if(recipe.freezing.status==='yes')assert.ok(original.description.includes(recipe.freezing.evidence));
  assert.ok(!retiredRecipeIds.includes(recipe.id));
 }
});
test('cada PDF mantém fonte, limites da consulta e classificação de congelamento',()=>{
 for(const recipe of recipes){
  const doc=createRecipePdf(recipe), output=doc.output();
  assert.ok(output.startsWith('%PDF-'));
  assert.ok(doc.getNumberOfPages()>=1);
  for(const term of ['Ingredientes','Modo de preparo','Para congelar com cuidado','Para aquecer',recipe.source.url,'Fonte:'])assert.ok(output.includes(term),term);
  assert.ok(!output.includes('undefined'));assert.ok(!output.includes('null min'));
 }
});
