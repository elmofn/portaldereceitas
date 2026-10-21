import snapshot from './data/foodkeeper-snapshot.json' with { type: 'json' };
import { foodkeeperSource } from './sources.js';
import { normalize } from './recipes.js';
// A rule applies only to the exact form supported by the source. No timeline is inferred.
const definitions=[
 ['arroz','Arroz',['arroz integral','arroz branco','arroz'],{'cooked':'166'}],
 ['frango','Frango',['peito de frango','frango'],{'raw':'110'}],
 ['carne','Carne bovina moída',['carne bovina moida','carne moida'],{'raw':'42'}],
 ['batata','Batata',['batatas','batata'],{'mashed':'279'}],
 ['ovo','Ovo',['ovos','ovo'],{'shell':'20','beaten':'21','boiled':'22'}],
 ['alface','Alface',['alface'],{'raw':'272'}],
 ['pepino','Pepino',['pepinos','pepino'],{'raw':'265'}],
 ['iogurte','Iogurte',['iogurte natural','iogurte'],{'product':'32'}],
 ['tomate','Tomate',['tomates','tomate'],{'raw':'288'}],
 ['extrato','Extrato de tomate',['extrato de tomate','pure de tomate'],{'product':'480'}],
 ['cebola','Cebola',['cebolas','cebola'],{'raw':'276'}],
 ['alho','Alho',['dentes de alho','dente de alho','alho'],{'raw':'267'}],
 ['cenoura','Cenoura',['cenouras','cenoura'],{'raw':'261'}],
 ['moranga','Moranga / abóbora',['abobora cabotia','abobora','moranga'],{'raw':'285'}],
 ['aspargo','Aspargos',['aspargos','aspargo'],{'raw':'253'}],
 ['cogumelo','Cogumelos',['cogumelos','cogumelo','champignon'],{'raw':'274'}],
 ['pimentao','Pimentão',['pimentao','pimentoes'],{'raw':'278'}],
 ['salsinha','Salsinha',['salsinha','salsa'],{'raw':'589'}],
 ['creamcheese','Cream cheese',['cream cheese'],{'product':'11'}],
 ['feijao','Feijão',['feijao vermelho','feijao preto','feijao'],{}],
 ['lentilha','Lentilha',['lentilhas','lentilha'],{}],
 ['azeite','Azeite',['azeite extravirgem','azeite'],{}],
 ['pimenta','Pimenta-do-reino',['pimenta-do-reino','pimenta do reino'],{}],
 ['nozes','Nozes',['nozes'],{}],
 ['ervilha','Ervilha',['ervilhas','ervilha'],{}],
 ['peixe','Peixe',['file de peixe','files de peixe','peixe'],{}]
];
export const ingredientForms=[['unspecified','Não informado'],['raw','Cru / fresco'],['cooked','Cozido'],['mashed','Cozido e amassado (purê)'],['shell','Ovo com casca'],['beaten','Claras e gemas cruas sem casca'],['boiled','Ovo cozido duro'],['product','Produto como vendido']];
export function recognizeIngredients(text) {
 const value=normalize(text).replace(/\bsem (?:ovos?|leite|frango|carne|iogurte|alface|pepino)\b/g, '');
 const found=[], occupied=[];
 const candidates=definitions.flatMap(([id,name,aliases,forms])=>aliases.map(alias=>({id,name,forms,alias}))).sort((a,b)=>b.alias.length-a.alias.length);
 for(const candidate of candidates){
  let offset=0;
  while(offset<value.length){
   const index=value.indexOf(candidate.alias,offset);
   if(index<0)break;
   const end=index+candidate.alias.length;
   const boundary=(index===0||!/[a-z]/.test(value[index-1]))&&(end===value.length||!/[a-z]/.test(value[end]));
   if(boundary&&!occupied.some(([start,stop])=>index<stop&&end>start)){
    occupied.push([index,end]);
    if(!found.some(item=>item.id===candidate.id))found.push({id:candidate.id,name:candidate.name,forms:candidate.forms});
   }
   offset=end;
  }
 }
 return definitions.map(([id])=>found.find(item=>item.id===id)).filter(Boolean);
}
export function ingredientGuidance(text,form='unspecified') {
 const recognized=recognizeIngredients(text);
 if(!recognized.length)return [{name:text.trim()||'Ingrediente',status:'unknown',note:'Ingrediente não reconhecido na base. Não há conclusão automática.',source:null}];
 return recognized.map(ingredient=>{
  const effectiveForm = form === 'unspecified' ? (recognized.length === 1 ? inferForm(text, ingredient.id) : 'unspecified') : form;
  const row=ingredient.forms[effectiveForm], record=snapshot[row];
  if(!record)return {...ingredient,status:'unknown',note:'Sem orientação verificada para esta apresentação. Escolha a forma exata ou consulte a fonte.',source:null};
  const metric=record.Freeze_Metric||record.DOP_Freeze_Metric;
  const notRecommended=metric==='Not Recommended'||/not recommended/i.test(record.Freeze_Tips+' '+record.DOP_Freeze_Tips);
  const evidence=notRecommended?'Not Recommended':metric;
  if(!notRecommended&&!['Months','Weeks','Days'].includes(metric))return {...ingredient,status:'unknown',note:'Registro sem indicação de congelamento nesta apresentação.',source:null};
  const needsPreparation = !notRecommended && effectiveForm === 'raw' && !['frango','carne'].includes(ingredient.id);
  return {...ingredient,status:notRecommended?'no':needsPreparation?'conditional':'yes',note:needsPreparation?'A tabela indica freezer para este produto, mas esta cópia não detalha o preparo necessário. Consulte a orientação específica antes de congelar.':notRecommended?'A tabela não recomenda congelar esta apresentação por qualidade. Isso não significa que o ingrediente seja perigoso.':'A tabela apresenta orientação de freezer para esta forma. Não extrapole para outra apresentação ou para o prato pronto.',source:{...foodkeeperSource,row:Number(row),record:`${record.Name}${record.Name_subtitle?', '+record.Name_subtitle:''}`,evidence},sourceNote:record.Freeze_Tips||record.DOP_Freeze_Tips||null};
 });
}

function inferForm(text, id) {
 const value = normalize(text);
 if(/\bcru[ao]?s?\b|fresc[ao]/.test(value) && /cozid/.test(value))return 'unspecified';
 if(id === 'ovo' && /com casca/.test(value))return 'shell';
 if(id === 'ovo' && /cozid/.test(value))return 'boiled';
 if(id === 'ovo' && /sem casca|claras|gemas/.test(value))return 'beaten';
 if(id === 'batata' && /pure|amassad/.test(value))return 'mashed';
 if(/cozid/.test(value))return 'cooked';
 if(/\bcru[ao]?s?\b|fresc[ao]/.test(value))return 'raw';
 if(['iogurte','extrato','creamcheese'].includes(id))return 'product';
 return 'unspecified';
}
