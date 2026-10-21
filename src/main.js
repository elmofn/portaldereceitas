import './style.css';
import { recipes, selectRecipes, storage, retiredRecipeIds } from './recipes.js';
import { downloadRecipe, downloadWeekly } from './pdf.js';
import { weekStart, shiftWeek, dateAt, days, meals, cleanPlan, summarizePlan, fillEmpty, readPlans, savePlans, retiredPlanEntries } from './planner.js';

import { freezerLabel, timeLabel, statusLabels, foodkeeperSource, recipeSnapshot } from './sources.js';
import { ingredientGuidance, ingredientForms } from './ingredients.js';

const leaf = '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M31 7C12 5 5 17 13 26c10 9 22-3 18-19Z" stroke="currentColor" stroke-width="2"/><path d="m8 34 17-20M14 26l-1-9m6 4 8 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const download = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>';
const clock = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 5v5l3 2"/></svg>';
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.search);
const categories = ['Todas', ...new Set(recipes.map(r => r.category))];
let freezingFilter = ['yes', 'no', 'unknown'].includes(params.get('congelamento')) ? params.get('congelamento') : 'all';
let category = categories.includes(params.get('categoria')) ? params.get('categoria') : 'Todas';
let query = params.get('busca') || '';
const recipeId = params.get('receita');
const section = recipeId ? 'receitas' : (['semana', 'congelar', 'sobre', 'fontes'].includes(params.get('pagina')) ? params.get('pagina') : 'receitas');
function listParams() {
 const result = new URLSearchParams();
 if (query) result.set('busca', query);
 if (category !== 'Todas') result.set('categoria', category);
 if (freezingFilter !== 'all') result.set('congelamento', freezingFilter);
 return result;
}
function listUrl() { const value = listParams().toString(); return value ? `?${value}` : location.pathname; }
function recipeUrl(id) { const result = listParams(); result.set('receita', id); return `?${result}`; }
function recipeImage(r, className = '') {
 return `<img class="${className}" src="${import.meta.env.BASE_URL}images/${r.illustration}.svg" data-image="${r.id}" alt="Ilustração de ${r.name.toLowerCase()}" ${className ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}
document.addEventListener('error', event => {
 const img = event.target;
 if (img instanceof HTMLImageElement && img.dataset.image && !img.dataset.fallback) {
  img.dataset.fallback = 'true';
  img.src = `${import.meta.env.BASE_URL}images/${recipes.find(r => r.id === img.dataset.image)?.illustration || 'lentilha'}.svg`;
 }
}, true);
const navigation = [['semana', '?pagina=semana', 'Minha semana'], ['receitas', location.pathname, 'Receitas'], ['congelar', '?pagina=congelar', 'Como congelar'], ['sobre', '?pagina=sobre', 'Sobre']];
document.querySelector('#app').innerHTML = `
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<header class="header"><div class="header-inner"><a class="brand" href="${location.pathname}" aria-label="Carinho no Pote, receitas">${leaf}<span>carinho <i>no</i> pote<small>COMIDA DE CASA, VIDA MAIS LEVE</small></span></a><nav aria-label="Menu principal">${navigation.map(([id, url, name]) => `<a href="${url}" ${section === id ? 'aria-current="page"' : ''}>${name}</a>`).join('')}</nav></div></header>
<main id="conteudo" tabindex="-1"></main>
<footer><a class="footer-brand" href="${location.pathname}">${leaf} carinho <i>no</i> pote</a><p>Receitas de casa para uma semana mais leve.</p><a class="sources-link" href="?pagina=fontes">Fontes e critérios</a><span>Porto Alegre, RS ♡</span></footer>
<div id="toast" role="status" aria-live="polite"></div>`;
const main = document.querySelector('main');
function renderList() {
 document.title = 'Receitas com fonte · Carinho no Pote';
 main.innerHTML = `<section class="recipes-section"><div class="page-heading"><span class="eyebrow">SEU CADERNINHO DA SEMANA</span><h1>Receitas com fonte</h1><p>Receitas de autoria identificada, com ingredientes e orientações para consultar antes de congelar.</p><details class="source-disclosure"><summary>Fontes consultadas em cópias de referência</summary><p>O catálogo anterior sem referências foi retirado. Esta base inicial usa cópias técnicas das fontes; as páginas originais ainda precisam de revalidação direta. <a href="?pagina=fontes">Entenda os critérios.</a></p></details></div>
<div class="recipe-tools"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><span class="sr-only">Buscar receita ou ingrediente</span><input id="search" type="search" value="${escapeHtml(query)}" placeholder="Busque uma receita ou ingrediente"></label><div class="filters" role="group" aria-label="Filtrar receitas">${categories.map(c => `<button class="filter ${category === c ? 'active' : ''}" data-category="${c}" aria-pressed="${category === c}">${c === 'Todas' ? 'Todas as receitas' : c}</button>`).join('')}</div></div>
<label class="freezing-filter">Congelamento da receita<select id="freezing-filter"><option value="all">Todas as orientações</option><option value="yes">Indicado pela autoria</option><option value="unknown">Não verificado</option><option value="no">Não recomendado</option></select></label>
<p id="result-count" class="result-count" aria-live="polite"></p><div class="grid" id="recipe-grid"></div><p class="image-note">Imagens ilustrativas. Os tempos de preparo não incluem o resfriamento para congelar.</p>
${ingredientChecker()}<a class="guide-link" href="?pagina=congelar"><span>❄</span><span><strong>Primeira vez preparando para congelar?</strong><span>Veja como resfriar, guardar e descongelar com cuidado.</span></span><span aria-hidden="true">→</span></a></section>`;
 renderCards();
 document.querySelector('#freezing-filter').value = freezingFilter;
 document.querySelector('#freezing-filter').addEventListener('change', e => { freezingFilter = e.target.value; updateList(); });
 document.querySelector('#search').addEventListener('input', e => { query = e.target.value; updateList(); });
 document.querySelector('.filters').addEventListener('click', e => {
  const button = e.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  document.querySelectorAll('.filter').forEach(filter => { filter.classList.toggle('active', filter === button); filter.setAttribute('aria-pressed', String(filter === button)); });
  updateList();
 });
}
function updateList() { history.replaceState(null, '', listUrl()); renderCards(); }
function renderCards() {
 const filtered = selectRecipes(query, category, freezingFilter);
 document.querySelector('#result-count').textContent = `${filtered.length} receita${filtered.length === 1 ? '' : 's'} ${category !== 'Todas' ? '· ' + category.toLowerCase() : 'para sua semana'}`;
 document.querySelector('#recipe-grid').innerHTML = filtered.length ? filtered.map(r => `<article class="recipe-card"><a class="card-image" href="${escapeHtml(recipeUrl(r.id))}" aria-label="Ver receita: ${r.name}" style="background:${r.color}">${recipeImage(r)}<span class="category-tag">${r.category}</span><span class="freezer-tag">${freezerLabel(r)}</span></a><div class="card-body"><div class="card-meta"><span>${clock} ${timeLabel(r)}</span><span>${r.portions} porções</span></div><h2><a href="${escapeHtml(recipeUrl(r.id))}">${r.name}</a></h2><p>${r.desc}</p><a class="recipe-source" href="${r.source.url}" target="_blank" rel="noopener noreferrer">Fonte: ${r.source.publisher} ↗</a><div class="card-actions"><a class="recipe-link" href="${escapeHtml(recipeUrl(r.id))}">Ver receita <span aria-hidden="true">→</span></a><button class="pdf-button" data-pdf="${r.id}" aria-label="Salvar PDF: ${r.name}">${download} Salvar PDF</button></div></div></article>`).join('') : `<div class="empty"><span aria-hidden="true">🌿</span><h2>Nenhuma receita encontrada</h2><p>Tente outro ingrediente ou remova os filtros.</p><button id="reset" class="primary">Ver todas as receitas</button></div>`;
}
function renderRecipe(r) {
 if (!r) {
  document.title = 'Receita não encontrada · Carinho no Pote';
  main.innerHTML = `<section class="text-page"><h1>${retiredRecipeIds.includes(recipeId) ? 'Receita retirada do catálogo' : 'Receita não encontrada'}</h1><p>${retiredRecipeIds.includes(recipeId) ? 'Esta receita não possuía fonte verificável e foi retirada. Seu endereço não foi associado a outra receita.' : 'Esse endereço não corresponde a uma receita do nosso caderninho.'}</p><a class="primary" href="${location.pathname}">Ver todas as receitas</a></section>`;
  return;
 }
 document.title = `${r.name} · Carinho no Pote`;
 main.innerHTML = `<article class="recipe-page"><nav class="breadcrumb" aria-label="Caminho da página"><a href="${escapeHtml(listUrl())}">← Voltar às receitas</a><span aria-hidden="true">/</span><span>${r.category}</span></nav>
 <div class="source-panel"><strong>Fonte: ${r.source.publisher}</strong><p>Título original: ${r.source.originalTitle}. Ingredientes sem substituições. Preparo resumido em português; unidades originais preservadas.</p><a href="${r.source.url}" target="_blank" rel="noopener noreferrer">Abrir receita original ↗</a><p class="small">Consulta indireta em cópia técnica identificada, em 21/10/2026. A página original ainda não foi revalidada. <a href="${r.source.snapshotUrl}" target="_blank" rel="noopener noreferrer">Ver registro consultado</a>.</p></div><header class="recipe-heading"><span class="eyebrow">${r.category.toUpperCase()} · FEITO PARA SUA SEMANA</span><h1>${r.name}</h1><p>${r.desc}</p><div class="recipe-summary"><span>${clock} ${timeLabel(r)}</span><span>${r.portions} porções</span><span>${freezerLabel(r)}</span></div></header>
 <div class="recipe-layout"><aside class="recipe-sidebar"><div class="recipe-photo">${recipeImage(r, 'detail-image')}</div><p class="image-note">Imagem ilustrativa.</p><div class="save-panel"><h2>Leve a receita com você</h2><p>Salve o PDF para consultar na cozinha ou compartilhar no WhatsApp.</p><button class="primary" data-pdf="${r.id}">${download} Salvar ou compartilhar PDF</button><p class="small">No celular compatível, escolha o WhatsApp no menu de compartilhamento. No computador, baixe e anexe o arquivo.</p></div><a class="plan-recipe-link" href="?pagina=semana&adicionar=${r.id}">+ Incluir no cardápio da semana</a><nav class="recipe-index" aria-label="Nesta receita"><strong>Nesta receita</strong><a href="#ingredientes">Ingredientes</a><a href="#preparo">Modo de preparo</a><a href="#armazenamento">Congelar e aquecer</a></nav></aside>
 <div class="recipe-content"><section id="ingredientes"><h2>Ingredientes</h2><ul class="ingredients">${r.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></section><section id="preparo"><h2>Modo de preparo</h2><p class="small">Síntese das instruções da autoria. Confira todos os detalhes no <a href="${r.source.url}" target="_blank" rel="noopener noreferrer">preparo original</a>.</p><ol class="preparation">${r.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol></section><aside class="recipe-tip"><strong>Sobre esta transcrição</strong><p>${r.tip}</p></aside><section id="armazenamento"><h2>Congelamento da receita pronta</h2><p><strong>${freezerLabel(r)}</strong></p><p>${r.freezing.note}</p>${r.freezing.evidence ? `<blockquote>${r.freezing.evidence}</blockquote>` : ''}<p class="small">Prazo de freezer: não informado na fonte consultada. Não calculamos o prazo a partir dos ingredientes.</p><a class="recipe-link" href="${r.source.url}" target="_blank" rel="noopener noreferrer">Conferir a fonte ↗</a><h2>Ingredientes reconhecidos</h2><p class="small">Reconhecer um ingrediente não confirma a receita pronta. A apresentação precisa corresponder ao registro da fonte.</p><ul class="ingredient-audit">${r.ingredients.map(i => `<li><strong>${escapeHtml(i)}</strong>${ingredientGuidance(i).map(result => `<span>${result.name}: ${statusLabels[result.status]}</span>`).join('')}</li>`).join('')}</ul>${ingredientChecker()}<p>${storage}</p><h2>Na hora de aquecer</h2><p>${r.reheat}</p><a class="recipe-link" href="?pagina=congelar">Ver o guia de congelamento <span aria-hidden="true">→</span></a></section></div></div>
 <div class="recipe-bottom"><a class="back-link" href="${escapeHtml(listUrl())}">← Escolher outra receita</a><button class="pdf-button" data-pdf="${r.id}">${download} Salvar PDF</button></div></article>`;
}
function renderFreezing() {
 document.title = 'Como congelar · Carinho no Pote';
 main.innerHTML = `<section class="text-page"><div class="page-heading"><span class="eyebrow">CONFIRA A FONTE ANTES DE CONGELAR</span><h1>Como congelar com cuidado</h1><p>Ingrediente, apresentação e receita pronta são avaliações diferentes.</p></div><h2>O que a base permite concluir</h2><p>${storage}</p><h2>Onde consultar</h2><p>O FoodKeeper, do USDA/FSIS, reúne orientações por produto. Nossa consulta usa uma cópia histórica identificada e não substitui a edição atual.</p><a class="recipe-link" href="${foodkeeperSource.url}" target="_blank" rel="noopener noreferrer">Consultar FoodKeeper oficial ↗</a><p><a href="${foodkeeperSource.snapshot}" target="_blank" rel="noopener noreferrer">Ver cópia de dados consultada</a></p><h2>Orientação geral de segurança</h2><p>Para resfriamento, descongelamento e reaquecimento, consulte diretamente as orientações oficiais do USDA. Essa página está indicada para consulta; seu conteúdo atual ainda não foi revalidado pelo portal.</p><a class="recipe-link" href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety" target="_blank" rel="noopener noreferrer">Freezing and Food Safety — USDA ↗</a>${ingredientChecker()}<a class="primary" href="${location.pathname}">Escolher receitas</a></section>`;
}
function renderAbout() {
 document.title = 'Sobre · Carinho no Pote';
 main.innerHTML = `<section class="text-page about-page"><div class="page-heading"><span class="eyebrow">FEITO COM CARINHO EM PORTO ALEGRE</span><h1>Comida simples.<br>Mais tempo para viver.</h1><p>Um caderninho de receitas para cuidar da alimentação sem complicar a rotina.</p></div><h2>Ingredientes que já fazem parte da sua mesa</h2><p>O catálogo reúne receitas de autoria identificada. Os ingredientes são mantidos como publicados, sem trocar produtos por conta própria. A disponibilidade em Porto Alegre pode variar; confira a lista antes de planejar.</p><h2>Praticidade que acolhe</h2><p>Encontre uma receita pelo ingrediente que tem em casa, confira como preparar e guarde o PDF. Assim, fica fácil levar as instruções para a cozinha ou compartilhar uma ideia gostosa com alguém querido.</p><aside class="recipe-tip"><strong>Cada pessoa tem suas necessidades</strong><p>As receitas são sugestões para o dia a dia e não substituem orientação nutricional individual. Confira os ingredientes em caso de alergias ou restrições alimentares.</p></aside><a class="primary" href="${location.pathname}">Encontrar uma receita <span aria-hidden="true">→</span></a></section>`;
}
let activeWeek = weekStart(params.get('semana') || new Date());
let planStorage;
try { planStorage = localStorage; } catch { planStorage = null; }
const savedPlans = readPlans(planStorage);
const weeks = savedPlans.weeks;
let canSave = savedPlans.available;
let pendingRecipe = recipes.find(r => r.id === params.get('adicionar'));
let confirmingClear = false;
if (recipeId) renderRecipe(recipes.find(r => r.id === recipeId));
else if (section === 'semana') renderPlanner();
else if (section === 'congelar') renderFreezing();
else if (section === 'sobre') renderAbout();
else if (section === 'fontes') renderSources();
else renderList();
let toastTimeout;
function toast(message) { const element = document.querySelector('#toast'); element.textContent = message; element.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => element.classList.remove('visible'), 6500); }
document.addEventListener('click', async e => {
 const pdf = e.target.closest('[data-pdf]');
 if (pdf) {
  pdf.disabled = true;
  try { toast(await downloadRecipe(recipes.find(r => r.id === pdf.dataset.pdf))); }
  catch { toast('Não foi possível gerar o PDF. Tente novamente.'); }
  finally { pdf.disabled = false; }
 }
 if (e.target.closest('#reset')) { query = ''; category = 'Todas'; freezingFilter = 'all'; history.replaceState(null, '', listUrl()); renderList(); }
});

function currentPlan() { return cleanPlan(weeks[activeWeek]); }
function persistPlan(plan) {
 weeks[activeWeek] = cleanPlan(plan);
 canSave = savePlans(planStorage, weeks);
 renderPlanner();
}
function formatDate(date) { return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
function renderPlanner() {
 document.title = 'Minha semana · Carinho no Pote';
 const plan = currentPlan(), summary = summarizePlan(plan);
 main.innerHTML = `<section class="planner-page"><div class="page-heading"><span class="eyebrow">UM POTINHO PARA CADA DIA</span><h1>Minha semana</h1><p>Escolha o almoço e o jantar de cada dia. Repita suas favoritas e prepare tudo com calma.</p></div>
 ${retiredPlanEntries(weeks) ? '<p class="catalog-notice" role="status">Há escolhas antigas retiradas por falta de fonte. Elas não foram substituídas automaticamente e aparecem vazias. O registro antigo permanece salvo até você editar esta semana.</p>' : ''}<div class="week-toolbar"><div class="week-picker"><button class="week-arrow" data-week="-1" aria-label="Semana anterior">←</button><label>Semana de<input id="week-date" type="date" value="${activeWeek}"></label><span class="week-range">a ${formatDate(dateAt(activeWeek, 6))}</span><button class="week-arrow" data-week="1" aria-label="Próxima semana">→</button></div><button class="pdf-button" id="week-pdf" ${summary.filled ? '' : 'disabled'}>${download} Salvar cardápio em PDF</button></div>
 <div class="week-status"><div><strong>${summary.filled} de 14 refeições</strong><span> · ${summary.portions} ${summary.portions === 1 ? 'porção planejada' : 'porções planejadas'}</span></div><span class="save-status">${canSave ? 'Salvo neste navegador' : 'Não foi possível salvar neste navegador. Baixe o PDF antes de sair.'}</span></div><progress class="week-progress" value="${summary.filled}" max="14" aria-label="Refeições planejadas">${summary.filled} de 14</progress>
 ${pendingRecipe ? `<div class="pending-recipe" role="status"><span>Onde vamos incluir <strong>${pendingRecipe.name}</strong>? Escolha um espaço vazio abaixo.</span><button id="cancel-add" class="text-button">Cancelar</button></div>` : ''}
 <div class="week-grid">${days.map((day, dayIndex) => `<section class="day-card" aria-label="${day}"><header><h2>${day}</h2><span>${formatDate(dateAt(activeWeek, dayIndex))}</span></header>${meals.map((meal, mealIndex) => {
  const key = `${dayIndex}-${mealIndex}`, entry = plan[key], recipe = recipes.find(r => r.id === entry?.recipe);
  return `<div class="meal-slot ${recipe ? 'planned' : ''}"><label class="meal-label" for="recipe-${key}">${meal}</label><select id="recipe-${key}" data-slot="${key}" aria-label="Receita de ${meal.toLowerCase()} de ${day.toLowerCase()}"><option value="">Escolher receita…</option>${recipes.map(r => `<option value="${r.id}" ${recipe?.id === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select>${recipe ? `<a class="planned-name" href="?receita=${recipe.id}">${recipe.name} <span aria-hidden="true">↗</span></a><span class="planned-freezing">${freezerLabel(recipe)}</span><div class="portion-row"><label for="portions-${key}">Porções</label><select id="portions-${key}" data-portions="${key}" aria-label="Porções de ${meal.toLowerCase()} de ${day.toLowerCase()}">${Array.from({length:12}, (_, i) => `<option value="${i + 1}" ${entry.portions === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select><button class="remove-meal" data-remove="${key}" aria-label="Remover ${meal.toLowerCase()} de ${day.toLowerCase()}">Remover</button></div>` : `<p class="empty-meal">Um espaço para cuidar de você.</p>${pendingRecipe ? `<button class="add-pending" data-add="${key}">+ Incluir esta receita</button>` : ''}`}</div>`;
 }).join('')}</section>`).join('')}</div>
 <div class="week-actions"><button class="pdf-button" id="suggest-week" ${summary.filled === 14 ? 'disabled' : ''}>Preencher espaços vazios</button>${summary.filled ? `<div class="clear-actions"><button class="text-button" id="clear-week">${confirmingClear ? 'Confirmar limpeza desta semana' : 'Limpar esta semana'}</button>${confirmingClear ? '<button class="text-button" id="cancel-clear">Cancelar</button>' : ''}</div>` : ''}</div><p class="small">O preenchimento automático usa apenas receitas com indicação expressa de congelamento da autoria e mantém suas escolhas. A base inicial possui uma receita nessa condição; ela será repetida. As demais podem ser planejadas para consumo sem presumir congelamento. Você pode trocar qualquer refeição. O cardápio fica salvo apenas neste navegador e não é sincronizado entre aparelhos.</p>
 <section class="prep-summary"><div><span class="eyebrow">DO PLANEJAMENTO AOS POTINHOS</span><h2>Organize o preparo</h2><p>As porções acima são as que você vai consumir. Confira quantas receitas completas preparar.</p></div>${summary.preparation.length ? `<div class="prep-list">${summary.preparation.map(({recipe, portions, batches}) => `<article><a href="?receita=${recipe.id}">${recipe.name}</a><span>${freezerLabel(recipe)}</span><span>${portions} ${portions === 1 ? 'porção planejada' : 'porções planejadas'}</span><p>Prepare <strong>${batches} ${batches === 1 ? 'receita completa' : 'receitas completas'}</strong> · rende ${batches * recipe.portions} porções.</p></article>`).join('')}</div><p class="small">As quantidades de ingredientes das receitas originais não são alteradas. Não congele porções extras sem confirmar a orientação específica da receita. Prazos não informados permanecem sem prazo.</p>` : '<p class="prep-empty">Ao escolher suas refeições, a organização do preparo aparece aqui.</p>'}</section><a class="recipe-link" href="?pagina=congelar">Confira os cuidados para congelar <span aria-hidden="true">→</span></a><p class="small">Este planejador organiza suas escolhas e não substitui orientação nutricional individual.</p></section>`;
}
function changeWeek(value) {
 activeWeek = value; confirmingClear = false;
 const url = new URL(location.href); url.searchParams.set('semana', value);
 history.replaceState(null, '', url); renderPlanner();
}
document.addEventListener('change', event => {
 const target = event.target;
 if (target.id === 'week-date') { if (target.value) { changeWeek(weekStart(target.value)); document.querySelector('#week-date')?.focus(); } return; }
 if (target.matches('[data-slot]')) {
  const plan = currentPlan(), key = target.dataset.slot;
  if (recipes.some(r => r.id === target.value)) plan[key] = { recipe: target.value, portions: plan[key]?.portions || 1 };
  else delete plan[key];
  persistPlan(plan); document.querySelector(`#recipe-${key}`)?.focus();
 }
 if (target.matches('[data-portions]')) {
  const plan = currentPlan(), key = target.dataset.portions;
  if (plan[key]) plan[key].portions = Number(target.value);
  persistPlan(plan); document.querySelector(`#portions-${key}`)?.focus();
 }
});
document.addEventListener('click', async event => {
 const target = event.target.closest('button'); if (!target) return;
 if (target.dataset.week) { const direction = target.dataset.week; changeWeek(shiftWeek(activeWeek, Number(direction))); document.querySelector(`[data-week="${direction}"]`)?.focus(); }
 if (target.id === 'suggest-week') { persistPlan(fillEmpty(currentPlan())); toast('Espaços vazios preenchidos. Ajuste as receitas e porções como preferir.'); }
 if (target.dataset.remove) { const plan = currentPlan(); delete plan[target.dataset.remove]; persistPlan(plan); document.querySelector(`#recipe-${target.dataset.remove}`)?.focus(); }
 if (target.id === 'clear-week') {
  if (confirmingClear) { confirmingClear = false; persistPlan({}); toast('Cardápio desta semana limpo. As outras semanas foram mantidas.'); }
  else { confirmingClear = true; renderPlanner(); document.querySelector('#clear-week').focus(); }
 }
 if (target.id === 'cancel-clear') { confirmingClear = false; renderPlanner(); }
 if (target.id === 'cancel-add') { pendingRecipe = null; const url = new URL(location.href); url.searchParams.delete('adicionar'); history.replaceState(null, '', url); renderPlanner(); }
 if (target.dataset.add && pendingRecipe) {
  const plan = currentPlan(); plan[target.dataset.add] = { recipe: pendingRecipe.id, portions: 1 };
  pendingRecipe = null; const url = new URL(location.href); url.searchParams.delete('adicionar'); history.replaceState(null, '', url);
  persistPlan(plan); toast('Receita incluída no cardápio.');
 }
 if (target.id === 'week-pdf') {
  target.disabled = true;
  try { toast(await downloadWeekly(currentPlan(), activeWeek)); } catch { toast('Não foi possível gerar o PDF. Tente novamente.'); }
  finally { target.disabled = false; }
 }
});

function ingredientChecker() {
 return `<details class="ingredient-checker"><summary>Posso congelar este ingrediente?</summary><p>Consulte o produto isolado na apresentação correta. Só os nomes reconhecidos recebem uma análise; termos não identificados continuam sem orientação. Um campo desconhecido não é tratado como autorização para congelar.</p><form id="ingredient-form"><label for="ingredient-name">Ingrediente<input id="ingredient-name" name="ingredient" required maxlength="200" placeholder="Ex.: arroz, ovo, alface ou moranga"></label><label for="ingredient-state">Como está o ingrediente?<select id="ingredient-state" name="state">${ingredientForms.map(([id,label]) => `<option value="${id}">${label}</option>`).join('')}</select></label><button class="primary" type="submit">Consultar ingrediente</button></form><div id="ingredient-result" aria-live="polite"></div><p class="small">Dados: FoodKeeper / USDA, em cópia histórica. A indicação é específica à apresentação e não garante segurança nem valida o prato pronto. <a href="?pagina=fontes">Fontes e limites</a>.</p></details>`;
}
function renderSources() {
 document.title = 'Fontes e critérios · Carinho no Pote';
 main.innerHTML = `<section class="text-page"><span class="eyebrow">DE ONDE VEM CADA INFORMAÇÃO</span><h1>Fontes e critérios</h1><h2>Receitas com autoria</h2><p>Esta base inicial contém quatro receitas de NHS Better Health, Panelinha e MyPlate/USDA. Nenhuma foi criada pelo portal. Os ingredientes foram preservados ou traduzidos sem substituições; o preparo é uma síntese e sempre aponta ao original.</p><p>As consultas de 21/10/2026 usaram cópias técnicas versionadas no projeto recipe-scrapers. As páginas originais não puderam ser revalidadas diretamente por bloqueio de rede. A consulta indireta é informada em cada receita, sem alegar validação atual da autoria.</p><a href="${recipeSnapshot.url}" target="_blank" rel="noopener noreferrer">Ver registros de receitas consultados ↗</a><h2>Congelamento de ingredientes</h2><p>Utilizamos registros da base FoodKeeper, atribuída ao USDA/FSIS, preservados numa cópia histórica. O nome e a apresentação do produto precisam corresponder à regra. Não inventamos prazos e não extrapolamos a validade de um ingrediente para uma refeição.</p><p><a href="${foodkeeperSource.url}" target="_blank" rel="noopener noreferrer">FoodKeeper oficial ↗</a></p><p><a href="${foodkeeperSource.snapshot}" target="_blank" rel="noopener noreferrer">Cópia histórica usada e registros auditáveis ↗</a></p><h2>Quatro resultados possíveis</h2><ul class="source-criteria"><li><strong>Indicado pela fonte:</strong> existe orientação expressa para aquele produto ou receita.</li><li><strong>Não recomendado:</strong> a fonte não recomenda congelamento daquela apresentação por qualidade; não significa automaticamente risco sanitário.</li><li><strong>Depende do preparo:</strong> a base indica freezer, mas a forma de preparar precisa ser confirmada.</li><li><strong>Não verificado:</strong> ingrediente, apresentação ou receita sem evidência suficiente.</li></ul><h2>Catálogo anterior</h2><p>As seis receitas iniciais sem referências e seus prazos foram retirados. Links e cardápios antigos não são redirecionados para receitas diferentes. As escolhas retiradas aparecem vazias com aviso; seus dados antigos não são apagados sem uma edição da semana.</p><h2>Atualização da base</h2><p>A importação é revisada antes da publicação. Conteúdo externo não é importado no aparelho de quem usa o portal, e a disponibilidade do site de origem não altera automaticamente uma receita publicada.</p><a class="primary" href="${location.pathname}">Consultar receitas</a></section>`;
}
document.addEventListener('submit', event => {
 if(event.target.id !== 'ingredient-form')return;
 event.preventDefault();
 const name = document.querySelector('#ingredient-name').value;
 const form = document.querySelector('#ingredient-state').value;
 const guidance = ingredientGuidance(name, form);
 document.querySelector('#ingredient-result').innerHTML = guidance.map(result => `<article class="ingredient-verdict" data-status="${result.status}"><h3>${escapeHtml(result.name)}</h3><strong>${statusLabels[result.status]}</strong><p>${result.note}</p>${result.source ? `<p class="small">Registro: ${escapeHtml(result.source.record)}. <a href="${result.source.snapshot}" target="_blank" rel="noopener noreferrer">Ver evidência na base FoodKeeper</a>.</p>` : ''}</article>`).join('');
});
