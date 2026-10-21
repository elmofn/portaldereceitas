import { jsPDF } from 'jspdf';
import { storage } from './recipes.js';
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
 const file=new File([doc.output('blob')],filename,{type:'application/pdf'});
 if(navigator.canShare?.({files:[file]})){
  try{await navigator.share({files:[file],title:recipe.name});return 'Compartilhamento aberto. Escolha o WhatsApp para enviar.';}catch(error){if(error.name==='AbortError')return 'Compartilhamento cancelado.';}
 }
 doc.save(filename);return 'PDF salvo! Abra o WhatsApp e anexe o arquivo à conversa.';
}
