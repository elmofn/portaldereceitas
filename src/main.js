import './style.css';
import { recipes, selectRecipes, storage } from './recipes.js';
import { downloadRecipe } from './pdf.js';

const leaf = '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M31 7C12 5 5 17 13 26c10 9 22-3 18-19Z" stroke="currentColor" stroke-width="2"/><path d="m8 34 17-20M14 26l-1-9m6 4 8 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const download = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>';
const clock = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 5v5l3 2"/></svg>';
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.search);
const categories = ['Todas', 'Sem carne', 'Com frango', 'Com carne'];
let category = categories.includes(params.get('categoria')) ? params.get('categoria') : 'Todas';
let query = params.get('busca') || '';
const recipeId = params.get('receita');
const section = recipeId ? 'receitas' : (['congelar', 'sobre'].includes(params.get('pagina')) ? params.get('pagina') : 'receitas');
function listParams() {
 const result = new URLSearchParams();
 if (query) result.set('busca', query);
 if (category !== 'Todas') result.set('categoria', category);
 return result;
}
function listUrl() { const value = listParams().toString(); return value ? `?${value}` : location.pathname; }
function recipeUrl(id) { const result = listParams(); result.set('receita', id); return `?${result}`; }
function recipeImage(r, className = '') {
 return `<img class="${className}" src="https://images.unsplash.com/${r.image}?auto=format&fit=crop&w=900&q=80" data-image="${r.id}" alt="Ilustração de ${r.name.toLowerCase()}" ${className ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}
document.addEventListener('error', event => {
 const img = event.target;
 if (img instanceof HTMLImageElement && img.dataset.image && !img.dataset.fallback) {
  img.dataset.fallback = 'true';
  img.src = `${import.meta.env.BASE_URL}images/${img.dataset.image}.svg`;
 }
}, true);
const navigation = [['receitas', location.pathname, 'Receitas'], ['congelar', '?pagina=congelar', 'Como congelar'], ['sobre', '?pagina=sobre', 'Sobre']];
document.querySelector('#app').innerHTML = `
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<header class="header"><div class="header-inner"><a class="brand" href="${location.pathname}" aria-label="Carinho no Pote, receitas">${leaf}<span>carinho <i>no</i> pote<small>COMIDA DE CASA, VIDA MAIS LEVE</small></span></a><nav aria-label="Menu principal">${navigation.map(([id, url, name]) => `<a href="${url}" ${section === id ? 'aria-current="page"' : ''}>${name}</a>`).join('')}</nav></div></header>
<main id="conteudo" tabindex="-1"></main>
<footer><a class="footer-brand" href="${location.pathname}">${leaf} carinho <i>no</i> pote</a><p>Receitas de casa para uma semana mais leve.</p><span>Porto Alegre, RS ♡</span></footer>
<div id="toast" role="status" aria-live="polite"></div>`;
const main = document.querySelector('main');
function renderList() {
 document.title = 'Receitas para congelar · Carinho no Pote';
 main.innerHTML = `<section class="recipes-section"><div class="page-heading"><span class="eyebrow">SEU CADERNINHO DA SEMANA</span><h1>Receitas para congelar</h1><p>Comida caseira, ingredientes de pertinho e praticidade para a sua semana.</p></div>
<div class="recipe-tools"><label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><span class="sr-only">Buscar receita ou ingrediente</span><input id="search" type="search" value="${escapeHtml(query)}" placeholder="Busque uma receita ou ingrediente"></label><div class="filters" role="group" aria-label="Filtrar receitas">${categories.map(c => `<button class="filter ${category === c ? 'active' : ''}" data-category="${c}" aria-pressed="${category === c}">${c === 'Todas' ? 'Todas as receitas' : c}</button>`).join('')}</div></div>
<p id="result-count" class="result-count" aria-live="polite"></p><div class="grid" id="recipe-grid"></div><p class="image-note">Imagens ilustrativas. Os tempos de preparo não incluem o resfriamento para congelar.</p>
<a class="guide-link" href="?pagina=congelar"><span>❄</span><span><strong>Primeira vez preparando para congelar?</strong><span>Veja como resfriar, guardar e descongelar com cuidado.</span></span><span aria-hidden="true">→</span></a></section>`;
 renderCards();
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
 const filtered = selectRecipes(query, category);
 document.querySelector('#result-count').textContent = `${filtered.length} receita${filtered.length === 1 ? '' : 's'} ${category !== 'Todas' ? '· ' + category.toLowerCase() : 'para sua semana'}`;
 document.querySelector('#recipe-grid').innerHTML = filtered.length ? filtered.map(r => `<article class="recipe-card"><a class="card-image" href="${escapeHtml(recipeUrl(r.id))}" aria-label="Ver receita: ${r.name}" style="background:${r.color}">${recipeImage(r)}<span class="category-tag">${r.category}</span><span class="freezer-tag">❄ Até ${r.freezer} dias no freezer</span></a><div class="card-body"><div class="card-meta"><span>${clock} ${r.time} min</span><span>${r.portions} porções</span></div><h2><a href="${escapeHtml(recipeUrl(r.id))}">${r.name}</a></h2><p>${r.desc}</p><div class="card-actions"><a class="recipe-link" href="${escapeHtml(recipeUrl(r.id))}">Ver receita <span aria-hidden="true">→</span></a><button class="pdf-button" data-pdf="${r.id}" aria-label="Salvar PDF: ${r.name}">${download} Salvar PDF</button></div></div></article>`).join('') : `<div class="empty"><span aria-hidden="true">🌿</span><h2>Nenhuma receita encontrada</h2><p>Tente outro ingrediente ou remova os filtros.</p><button id="reset" class="primary">Ver todas as receitas</button></div>`;
}
function renderRecipe(r) {
 if (!r) {
  document.title = 'Receita não encontrada · Carinho no Pote';
  main.innerHTML = `<section class="text-page"><h1>Receita não encontrada</h1><p>Esse endereço não corresponde a uma receita do nosso caderninho.</p><a class="primary" href="${location.pathname}">Ver todas as receitas</a></section>`;
  return;
 }
 document.title = `${r.name} · Carinho no Pote`;
 main.innerHTML = `<article class="recipe-page"><nav class="breadcrumb" aria-label="Caminho da página"><a href="${escapeHtml(listUrl())}">← Voltar às receitas</a><span aria-hidden="true">/</span><span>${r.category}</span></nav>
 <header class="recipe-heading"><span class="eyebrow">${r.category.toUpperCase()} · FEITO PARA SUA SEMANA</span><h1>${r.name}</h1><p>${r.desc}</p><div class="recipe-summary"><span>${clock} ${r.time} minutos</span><span>${r.portions} porções</span><span>❄ Até ${r.freezer} dias no freezer</span></div></header>
 <div class="recipe-layout"><aside class="recipe-sidebar"><div class="recipe-photo">${recipeImage(r, 'detail-image')}</div><p class="image-note">Imagem ilustrativa.</p><div class="save-panel"><h2>Leve a receita com você</h2><p>Salve o PDF para consultar na cozinha ou compartilhar no WhatsApp.</p><button class="primary" data-pdf="${r.id}">${download} Salvar ou compartilhar PDF</button><p class="small">No celular compatível, escolha o WhatsApp no menu de compartilhamento. No computador, baixe e anexe o arquivo.</p></div><nav class="recipe-index" aria-label="Nesta receita"><strong>Nesta receita</strong><a href="#ingredientes">Ingredientes</a><a href="#preparo">Modo de preparo</a><a href="#armazenamento">Congelar e aquecer</a></nav></aside>
 <div class="recipe-content"><section id="ingredientes"><h2>Ingredientes</h2><ul class="ingredients">${r.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></section><section id="preparo"><h2>Modo de preparo</h2><ol class="preparation">${r.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol></section><aside class="recipe-tip"><strong>Um carinho a mais</strong><p>${r.tip}</p></aside><section id="armazenamento"><h2>Para congelar com cuidado</h2><p>${storage}</p><h2>Na hora de aquecer</h2><p>${r.reheat}</p><a class="recipe-link" href="?pagina=congelar">Ver o guia de congelamento <span aria-hidden="true">→</span></a></section></div></div>
 <div class="recipe-bottom"><a class="back-link" href="${escapeHtml(listUrl())}">← Escolher outra receita</a><button class="pdf-button" data-pdf="${r.id}">${download} Salvar PDF</button></div></article>`;
}
function renderFreezing() {
 document.title = 'Como congelar · Carinho no Pote';
 main.innerHTML = `<section class="text-page"><div class="page-heading"><span class="eyebrow">DA COZINHA PARA O FREEZER</span><h1>Como congelar com cuidado</h1><p>Um passo a passo simples para organizar as refeições da semana.</p></div><div class="guide-steps">${[
 ['Porcione e resfrie', 'Depois do preparo, distribua a comida em potes rasos e leve à geladeira prontamente, em no máximo 2 horas. Não espere esfriar totalmente na bancada. Recipientes menores ajudam a resfriar mais rápido.'],
 ['Tampe, identifique e congele', 'Quando a comida estiver resfriada, tampe e anote o nome, a data do preparo e o prazo da receita. Use recipientes próprios para freezer. Deixe um espaço livre em potes com caldos, pois eles se expandem ao congelar.'],
 ['Mantenha a temperatura', 'Congele a −18 °C. Os prazos sugeridos nas receitas se referem à qualidade e dependem da conservação contínua nessa temperatura. Organize os potes mais antigos na frente para consumir primeiro.'],
 ['Descongele na geladeira', 'Transfira apenas a porção que será consumida para a geladeira com antecedência. Não descongele na bancada. Consuma em até 24 horas após descongelar e não recongele.'],
 ['Aqueça toda a porção', 'Use recipiente próprio para o método de aquecimento. Mexa quando possível para aquecer por igual e confira se o centro está bem quente. Veja também a orientação específica de cada receita.']
 ].map(([title, text], i) => `<article><span class="step-number">0${i + 1}</span><div><h2>${title}</h2><p>${text}</p></div></article>`).join('')}</div><aside class="recipe-tip"><strong>Uma semana organizada começa na escolha</strong><p>Combine receitas com ingredientes em comum e separe os potinhos antes de cozinhar.</p></aside><a class="primary" href="${location.pathname}">Escolher receitas <span aria-hidden="true">→</span></a></section>`;
}
function renderAbout() {
 document.title = 'Sobre · Carinho no Pote';
 main.innerHTML = `<section class="text-page about-page"><div class="page-heading"><span class="eyebrow">FEITO COM CARINHO EM PORTO ALEGRE</span><h1>Comida simples.<br>Mais tempo para viver.</h1><p>Um caderninho de receitas para cuidar da alimentação sem complicar a rotina.</p></div><h2>Ingredientes que já fazem parte da sua mesa</h2><p>Moranga, feijão, couve, frango e legumes da feira do bairro. Nossas receitas usam ingredientes comuns em Porto Alegre e foram pensadas para preparar em porções e congelar.</p><h2>Praticidade que acolhe</h2><p>Encontre uma receita pelo ingrediente que tem em casa, confira como preparar e guarde o PDF. Assim, fica fácil levar as instruções para a cozinha ou compartilhar uma ideia gostosa com alguém querido.</p><aside class="recipe-tip"><strong>Cada pessoa tem suas necessidades</strong><p>As receitas são sugestões para o dia a dia e não substituem orientação nutricional individual. Confira os ingredientes em caso de alergias ou restrições alimentares.</p></aside><a class="primary" href="${location.pathname}">Encontrar uma receita <span aria-hidden="true">→</span></a></section>`;
}
if (recipeId) renderRecipe(recipes.find(r => r.id === recipeId));
else if (section === 'congelar') renderFreezing();
else if (section === 'sobre') renderAbout();
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
 if (e.target.closest('#reset')) { query = ''; category = 'Todas'; history.replaceState(null, '', listUrl()); renderList(); }
});
