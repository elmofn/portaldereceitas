import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { recipes } from '../src/recipes.js';
import { recipeSnapshot, foodkeeperSource } from '../src/sources.js';
const snapshots = JSON.parse(await readFile(new URL('../src/data/recipe-snapshots.json', import.meta.url)));
const manifest = JSON.parse(await readFile(new URL('../src/data/provenance.json', import.meta.url)));
for (const item of manifest.artifacts) {
 const response = await fetch(item.url, { signal: AbortSignal.timeout(30000) });
 assert.ok(response.ok, `${item.url}: HTTP ${response.status}`);
 const bytes = Buffer.from(await response.arrayBuffer());
 assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256, `Conteúdo inesperado: ${item.url}`);
 if (item.recipeKey) {
  const original = JSON.parse(bytes.toString()), local = snapshots[item.recipeKey];
  assert.deepEqual(Object.fromEntries(Object.keys(local).map(key => [key, original[key]])), local);
 }
 else {
  const selected = JSON.parse(await readFile(new URL('../src/data/foodkeeper-snapshot.json', import.meta.url)));
  const rows = parseCsv(bytes.toString()); const headers = rows.shift();
  for (const [number, record] of Object.entries(selected)) assert.deepEqual(Object.fromEntries(headers.map((header, index) => [header, rows[Number(number) - 2][index]])), record, `FoodKeeper: registro ${number}`);
 }
 console.log(`Verificado: ${item.label}`);
}
for (const recipe of recipes) {
 assert.ok(snapshots[recipe.snapshot]);
 assert.equal(recipe.source.revision, recipeSnapshot.revision);
 assert.equal(recipe.portions, Number(snapshots[recipe.snapshot].yields.match(/\d+/)[0]));
 assert.equal(recipe.source.publisher, snapshots[recipe.snapshot].author);
 assert.equal(recipe.freezing.days, null);
}
assert.ok(manifest.artifacts.some(item => item.url.includes(foodkeeperSource.revision)));
console.log('Catálogo e cópias de referência íntegros. Esta verificação não revalida páginas originais nem atualiza automaticamente conteúdo publicado.');

function parseCsv(text) {
 const rows = []; let row = [], value = '', quoted = false;
 for(let i = 0; i < text.length; i++) {
  const ch = text[i];
  if(ch === '"') {
   if(quoted && text[i+1] === '"') { value += '"'; i++; }
   else quoted = !quoted;
  } else if(ch === ',' && !quoted) { row.push(value); value = ''; }
  else if(ch === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
  else value += ch;
 }
 if(value || row.length) { row.push(value); rows.push(row); }
 return rows;
}
