import { jsPDF } from 'jspdf';
import { storage, recipes } from './recipes.js';
import { freezerLabel, timeLabel } from './sources.js';
import { ingredientGuidance } from './ingredients.js';
import { statusLabels } from './sources.js';
import { days, meals, cleanPlan, summarizePlan, dateAt } from './planner.js';
export function createRecipePdf(recipe) {
 const doc=new jsPDF(); let y=22;
 const line=(text,size=11,color='#3b493e')=>{
  doc.setFontSize(size);doc.setTextColor(color);
  const rows=doc.splitTextToSize(text,170);
  for(const row of rows){if(y>277){doc.addPage();y=22;}doc.text(row,20,y);y+=size*0.48+2;}
  y+=3;
 };
 line('CARINHO NO POTE',12,'#56715a');
 doc.setFont('helvetica','bold');line(recipe.name,21);doc.setFont('helvetica','normal');
 line(`${timeLabel(recipe)} | ${recipe.portions} porções | ${freezerLabel(recipe)}`);
 line(`Fonte: ${recipe.source.publisher}`,12);
 line(recipe.source.url,10);
 line(`Título original: ${recipe.source.originalTitle}`,10);
 line('Consulta indireta em cópia técnica versionada. Página original ainda não revalidada.',10);
 line(recipe.source.snapshotUrl,9);
 line('Ingredientes',15);recipe.ingredients.forEach(i=>line('- '+i));
 line('Modo de preparo - síntese da autoria',15);recipe.steps.forEach((s,i)=>line(`${i+1}. ${s}`));
 line('Sobre esta transcrição',15);line(recipe.tip);
 line('Congelamento da receita pronta',15);line(freezerLabel(recipe));line(recipe.freezing.note);
 line('Prazo de freezer não informado na fonte consultada.');
 line('Ingredientes reconhecidos',15);
 recipe.ingredients.forEach(i=>{line(i);ingredientGuidance(i).forEach(result=>line(`${result.name}: ${statusLabels[result.status]}`,10));});
 line('Para congelar com cuidado',15);line(storage);
 line('Para aquecer',15);line(recipe.reheat);
 line('Comida de casa. Cuidado para a semana inteira.',10,'#56715a');
 return doc;
}
export async function downloadRecipe(recipe){
 const doc=createRecipePdf(recipe);
 const filename=`carinho-no-pote-${recipe.id}.pdf`;
 return sharePdf(doc, filename, recipe.name);
}
async function sharePdf(doc, filename, title) {
 const file=new File([doc.output('blob')],filename,{type:'application/pdf'});
 if(navigator.canShare?.({files:[file]})){
  try{await navigator.share({files:[file],title});return 'Compartilhamento aberto. Escolha o WhatsApp para enviar.';}catch(error){if(error.name==='AbortError')return 'Compartilhamento cancelado.';}
 }
 doc.save(filename);return 'PDF salvo! Abra o WhatsApp e anexe o arquivo à conversa.';
}

export function createWeeklyPdf(plan, start) {
 const summary = summarizePlan(plan);
 const doc = new jsPDF(); let y = 22;
 const line = (text, size = 11) => {
  doc.setFontSize(size); doc.setTextColor('#354535');
  for (const row of doc.splitTextToSize(text, 170)) {
   if (y > 277) { doc.addPage(); y = 22; }
   doc.text(row, 20, y); y += size * 0.48 + 2;
  }
  y += 3;
 };
 line('CARINHO NO POTE', 12);
 line('Meu cardápio da semana', 21);
 const format = date => date.toLocaleDateString('pt-BR');
 line(`${format(dateAt(start, 0))} a ${format(dateAt(start, 6))}`);
 line(`${summary.filled} de 14 refeições | ${summary.portions} porções planejadas`);
 for (let day = 0; day < 7; day++) {
  line(`${days[day]} - ${format(dateAt(start, day))}`, 14);
  meals.forEach((meal, index) => {
   const entry = cleanPlan(plan)[`${day}-${index}`];
   const recipe = recipes.find(r => r.id === entry?.recipe);
   line(`${meal}: ${recipe ? `${recipe.name} (${entry.portions} ${entry.portions === 1 ? 'porção' : 'porções'})` : 'A definir'}`);
  });
 }
 line('Organize o preparo', 15);
 summary.preparation.forEach(({ recipe, portions, batches }) => line(`${recipe.name}: ${portions} porções planejadas. Prepare ${batches} receita(s) completa(s), com rendimento total de ${batches * recipe.portions} porções.`));
 line('As porções do cardápio indicam quantas serão consumidas. As quantidades dos ingredientes e os rendimentos das receitas originais não foram alterados. Não congele as porções extras sem confirmar a orientação específica da receita.');
 line('Fontes e congelamento das receitas',15);
 summary.preparation.forEach(({recipe})=>{line(recipe.name,13);line(freezerLabel(recipe));line(recipe.freezing.note);line(`Fonte: ${recipe.source.publisher}`,10);line(recipe.source.url,10);});
 line('Receitas consultadas em cópias técnicas versionadas; páginas originais ainda não revalidadas. Não atribuímos prazos de freezer por analogia.',10);
 line('Para congelar com cuidado', 15); line(storage);
 line('Este cardápio organiza suas escolhas e não substitui orientação nutricional individual.', 10);
 return doc;
}
export async function downloadWeekly(plan, start) {
 return sharePdf(createWeeklyPdf(plan, start), `carinho-no-pote-semana-${start}.pdf`, 'Meu cardápio da semana');
}
