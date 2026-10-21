import { recipes } from './recipes.js';
export const PLAN_KEY = 'carinho-no-pote:cardapio:v1';
export const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
export const meals = ['Almoço', 'Jantar'];
export function weekStart(value = new Date()) {
 const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value);
 if (!Number.isFinite(date.getTime())) return weekStart(new Date());
 date.setHours(12, 0, 0, 0);
 date.setDate(date.getDate() - (date.getDay() + 6) % 7);
 return localDate(date);
}
export function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function dateAt(start, offset) { const date = new Date(`${start}T12:00:00`); date.setDate(date.getDate() + offset); return date; }
export function shiftWeek(start, direction) { return localDate(dateAt(start, direction * 7)); }
export function cleanPlan(value) {
 const plan = {};
 if (!value || typeof value !== 'object') return plan;
 for (let day = 0; day < 7; day++) for (let meal = 0; meal < 2; meal++) {
  const key = `${day}-${meal}`, entry = value[key];
  if (entry && recipes.some(r => r.id === entry.recipe) && Number.isInteger(entry.portions) && entry.portions >= 1 && entry.portions <= 12) plan[key] = { recipe: entry.recipe, portions: entry.portions };
 }
 return plan;
}
export function summarizePlan(value) {
 const plan = cleanPlan(value), selected = Object.values(plan);
 const preparation = recipes.map(recipe => {
  const portions = selected.filter(entry => entry.recipe === recipe.id).reduce((sum, entry) => sum + entry.portions, 0);
  return { recipe, portions, batches: Math.ceil(portions / recipe.portions) };
 }).filter(item => item.portions);
 return { filled: selected.length, portions: selected.reduce((sum, entry) => sum + entry.portions, 0), preparation };
}
export function fillEmpty(value) {
 const plan = cleanPlan(value);
 for (let day = 0; day < 7; day++) for (let meal = 0; meal < 2; meal++) {
  const key = `${day}-${meal}`;
  if (!plan[key]) plan[key] = { recipe: recipes[(day * 2 + meal) % recipes.length].id, portions: 1 };
 }
 return plan;
}
export function readPlans(storage) {
 try { const data = JSON.parse(storage.getItem(PLAN_KEY) || '{}'); return { weeks: data && typeof data.weeks === 'object' && data.weeks ? data.weeks : {}, available: true }; }
 catch { return { weeks: {}, available: false }; }
}
export function savePlans(storage, weeks) {
 try { storage.setItem(PLAN_KEY, JSON.stringify({ weeks })); return true; } catch { return false; }
}
