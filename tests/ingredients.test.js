import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeIngredients,ingredientGuidance} from '../src/ingredients.js';
import {recipes} from '../src/recipes.js';
test('reconhece aliases e vários ingredientes sem reconhecer palavras por substring',()=>{
 assert.equal(recognizeIngredients('2 xícaras de MORANGA')[0].id,'moranga');
 assert.deepEqual(recognizeIngredients('cebola e alho').map(i=>i.id),['cebola','alho']);
 assert.equal(recognizeIngredients('salada de arroz sem ovo').some(i=>i.id==='ovo'),false);
 assert.equal(recognizeIngredients('extrato de tomate').some(i=>i.id==='tomate'),false);
 assert.equal(ingredientGuidance('graviola')[0].status,'unknown');
 assert.deepEqual(recognizeIngredients('tomate e extrato de tomate').map(i=>i.id),['tomate','extrato']);
 assert.ok(ingredientGuidance('arroz e ovo cozido').every(result=>result.status==='unknown'));
 assert.equal(ingredientGuidance('arroz cru ou cozido')[0].status,'unknown');
});
test('a forma do ingrediente muda a orientação; desconhecido nunca vira sim',()=>{
 assert.equal(ingredientGuidance('arroz cozido')[0].status,'yes');
 assert.equal(ingredientGuidance('arroz')[0].status,'unknown');
 assert.equal(ingredientGuidance('ovo com casca')[0].status,'no');
 assert.equal(ingredientGuidance('ovo cozido')[0].status,'no');
 assert.equal(ingredientGuidance('ovo sem casca')[0].status,'yes');
 assert.equal(ingredientGuidance('batata crua')[0].status,'unknown');
 assert.equal(ingredientGuidance('purê de batata')[0].status,'yes');
 assert.equal(ingredientGuidance('alface crua')[0].status,'no');
 assert.equal(ingredientGuidance('pepino','raw')[0].status,'no');
 assert.equal(ingredientGuidance('moranga','raw')[0].status,'conditional');
});
test('uma indicação de ingrediente não altera a aptidão da receita pronta',()=>{
 const before=recipes.map(r=>r.freezing.status);
 ingredientGuidance('arroz cozido');ingredientGuidance('frango','raw');
 assert.deepEqual(recipes.map(r=>r.freezing.status),before);
 assert.equal(recipes.find(r=>r.id==='myplate-salada').freezing.status,'unknown');
 for(const query of ['arroz cozido','ovo com casca','pepino cru','iogurte','cream cheese','carne moída crua']){
  const result=ingredientGuidance(query)[0];
  assert.ok(result.source,query);assert.ok(result.source.record);assert.ok(result.source.evidence);
 }
});
