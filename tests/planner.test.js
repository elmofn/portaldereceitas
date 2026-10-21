import test from 'node:test';
import assert from 'node:assert/strict';
import { weekStart, shiftWeek, cleanPlan, summarizePlan, fillEmpty, readPlans, savePlans, PLAN_KEY } from '../src/planner.js';
import { createWeeklyPdf } from '../src/pdf.js';
test('semana começa na segunda, inclusive domingo e virada de ano', () => {
 assert.equal(weekStart('2026-10-21'), '2026-10-19');
 assert.equal(weekStart('2026-10-25'), '2026-10-19');
 assert.equal(weekStart('2026-01-01'), '2025-12-29');
 assert.equal(shiftWeek('2025-12-29', 1), '2026-01-05');
});
test('dados inválidos não entram no cardápio ou PDF', () => {
 assert.deepEqual(cleanPlan({'0-0':{recipe:'nhs-chilli',portions:2},'0-1':{recipe:'inexistente',portions:1},'1-0':{recipe:'panelinha-arroz-sirio',portions:0},'1-1':{recipe:'panelinha-arroz-sirio',portions:1.5},'7-0':{recipe:'panelinha-arroz-sirio',portions:1}}), {'0-0':{recipe:'nhs-chilli',portions:2}});
 assert.equal(readPlans({getItem:()=>'{invalid'}).available,false);
 assert.equal(readPlans(null).available,false);
 assert.equal(savePlans({setItem:()=>{throw new Error('quota');}},{}),false);
});
test('preenchimento mantém escolhas e resume preparos sem alterar rendimento', () => {
 const original = {'0-0':{recipe:'nhs-chilli',portions:5},'0-1':{recipe:'nhs-chilli',portions:2}};
 const summary = summarizePlan(original);
 assert.equal(summary.filled,2);assert.equal(summary.portions,7);
 assert.equal(summary.preparation[0].portions,7);assert.equal(summary.preparation[0].batches,2);assert.equal(summary.preparation[0].recipe.portions,4);
 const filled=fillEmpty(original);assert.equal(Object.keys(filled).length,14);assert.deepEqual(filled['0-0'],original['0-0']);assert.equal(Object.keys(original).length,2);
});
test('grava semanas separadas e PDF inclui plano parcial e preparo', () => {
 const weeks={'2026-10-19':{'0-0':{recipe:'nhs-chilli',portions:2}},'2026-10-26':{'0-0':{recipe:'panelinha-arroz-sirio',portions:1}}};
 let saved;assert.equal(savePlans({setItem:(key,value)=>{assert.equal(key,PLAN_KEY);saved=value;}},weeks),true);
 assert.deepEqual(readPlans({getItem:()=>saved}).weeks,weeks);
 const output=createWeeklyPdf(weeks['2026-10-19'],'2026-10-19').output();
 assert.ok(output.startsWith('%PDF-'));assert.ok(output.includes('Chilli'));assert.ok(output.includes('A definir'));assert.ok(output.includes('Organize o preparo'));assert.ok(output.includes('19/10/2026'));
});
