import { jsPDF } from 'jspdf';
import { storage, recipes } from './recipes.js';
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
 line(`${recipe.time} min | ${recipe.portions} porções | Freezer: até ${recipe.freezer} dias`);
 line('Ingredientes',15);recipe.ingredients.forEach(i=>line('- '+i));
 line('Modo de preparo',15);recipe.steps.forEach((s,i)=>line(`${i+1}. ${s}`));
 line('Dica da cozinha',15);line(recipe.tip);
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
 line('As porções do cardápio indicam quantas serão consumidas. As quantidades dos ingredientes e os rendimentos das receitas originais não foram alterados. Reserve as porções extras para outra semana.');
 line('Para congelar com cuidado', 15); line(storage);
 line('Este cardápio organiza suas escolhas e não substitui orientação nutricional individual.', 10);
 return doc;
}
export async function downloadWeekly(plan, start) {
 return sharePdf(createWeeklyPdf(plan, start), `carinho-no-pote-semana-${start}.pdf`, 'Meu cardápio da semana');
}
