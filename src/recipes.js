import snapshots from './data/recipe-snapshots.json' with { type: 'json' };
import { recipeSnapshot } from './sources.js';
const definitions = [
 {id:'nhs-chilli',snapshot:'nhshealthierfamilies_1',name:'Chilli com carne e arroz',category:'Com carne',color:'#ead8ba',illustration:'feijao',time:35,url:'https://www.nhs.uk/healthier-families/recipes/chilli-con-carne/',
 ingredients:['300 g de carne bovina moída extramagra','1 cebola grande picada','2 dentes de alho picados','400 g de tomate picado','2 colheres (sopa) de extrato de tomate','2 colheres (chá) de chili em pó','1 colher (chá) de cominho em pó','1 pimentão vermelho sem sementes, picado','2 punhados de cogumelos fatiados','410 g de feijão vermelho escorrido','150 ml de caldo de legumes ou frango com teor reduzido de sal','300 g de arroz branco ou integral de cozimento fácil','1 pitada de pimenta-do-reino'],
 steps:['Doure a carne por partes; acrescente cebola e alho e cozinhe por mais 2 a 3 minutos.','Adicione tomate, extrato, temperos, pimentão, cogumelos, feijão e caldo. Ferva e cozinhe em fogo baixo por 15 a 20 minutos.','Cozinhe o arroz conforme a embalagem. Tempere o chilli com pimenta e sirva com o arroz.'],
 freezing:{status:'yes',evidence:'It also freezes well, so is perfect to batch-cook.',note:'O NHS indica congelamento do chilli. O trecho não informa prazo e não detalha o congelamento do arroz servido como acompanhamento.',days:null}},
 {id:'panelinha-arroz-sirio',snapshot:'panelinha_2',name:'Arroz sírio com frango',category:'Com frango',color:'#d8dfbd',illustration:'frango',time:null,url:'https://panelinha.com.br/receita/arroz-sirio-com-frango',
 ingredients:snapshots.panelinha_2.ingredients,
 steps:['Deixe a lentilha de molho em água fervente enquanto prepara os demais ingredientes.','Doure a cebola; reserve e doure as tiras de frango. Reúna cebola, alho, arroz, sal e pimenta síria.','Escorra a lentilha e adicione com a água. Cozinhe conforme as etapas e os tempos do original. Finalize com nozes e sirva com iogurte.'],
 freezing:{status:'unknown',evidence:null,note:'Não foi localizada orientação de congelamento no conteúdo consultado. A presença de ingredientes congeláveis não comprova o resultado da receita pronta.',days:null}},
 {id:'nhs-peixe',snapshot:'nhshealthierfamilies_2',name:'Peixe assado com batatas e ervilhas',category:'Com peixe',color:'#d5dfce',illustration:'frango',time:50,url:'https://www.nhs.uk/healthier-families/recipes/homemade-fish-and-chips/',
 ingredients:['4 batatas lavadas, cada uma cortada em 8 gomos','1 colher (sopa) de óleo vegetal','75 g de farinha de rosca branca ou integral','1 ovo batido com 2 colheres (sopa) de água fria','4 filés de peixe branco sem pele, como haddock, bacalhau ou pollock','300 g de purê de ervilhas','1 pitada de pimenta-do-reino (opcional)'],
 steps:['Aqueça o forno a 200 °C, ou 180 °C com ventilação. Unte uma assadeira. Asse as batatas com óleo por 35 a 40 minutos, virando após 20.','Passe o peixe no ovo e na farinha de rosca. Asse nos últimos 15 a 20 minutos, até lascar facilmente com um garfo.','Aqueça o purê de ervilhas e sirva com o peixe e as batatas.'],
 freezing:{status:'unknown',evidence:null,note:'O conteúdo consultado não confirma congelamento deste prato pronto.',days:null}},
 {id:'myplate-salada',snapshot:'usdamyplate_2',name:'Salada de frango, arroz, aspargos e tangerina',category:'Com frango',color:'#ebd4b1',illustration:'lentilha',time:null,url:'https://www.myplate.gov/recipes/asparagus-mandarin-orange-chicken-and-rice',
 ingredients:['2 colheres (sopa) de azeite extravirgem','2 colheres (sopa) de vinagre de arroz','3 colheres (sopa) do líquido da tangerina em conserva','1 colher (sopa) de molho de soja com teor reduzido de sódio','3⅓ xícaras de aspargos frescos aparados','2 latas de tangerina em conserva de 11 oz cada, escorridas; reserve o líquido','12 oz de peito de frango cozido em pedaços','3 xícaras de arroz integral instantâneo cozido'],
 steps:['Misture azeite, vinagre, líquido da tangerina e molho de soja para o molho. Cozinhe o arroz conforme a embalagem.','Cozinhe os aspargos em água por 2 a 5 minutos, enxágue com água fria e corte em pedaços.','Misture todos os ingredientes em uma tigela.'],
 freezing:{status:'unknown',evidence:null,note:'A fonte consultada não fornece orientação para congelar esta salada. Não classificamos o prato por analogia com outras saladas.',days:null}}
];
export const recipes = definitions.map(r => {
 const original=snapshots[r.snapshot];
 return {...r,portions:Number(original.yields.match(/\d+/)[0]),desc:`Receita de ${original.author}. Ingredientes preservados; veja o modo de preparo completo na fonte.`,source:{publisher:original.author,url:r.url,originalTitle:original.title,reviewedAt:'2026-10-21',access:'snapshot',snapshotUrl:`${recipeSnapshot.url}/${original.host}/${r.snapshot}.json`,revision:recipeSnapshot.revision},tip:'Esta é uma síntese do preparo, não uma adaptação. Confira as instruções completas no site da autoria.',reheat:'A fonte da receita consultada não detalha o reaquecimento; não atribuímos um tempo ou método específico.'};
});
export const retiredRecipeIds=['frango','lentilha','escondidinho','feijao','almondegas','sopa'];
export const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function selectRecipes(query='',category='Todas',freezing='all') {
 const term=normalize(query.trim());
 return recipes.filter(r=>(category==='Todas'||r.category===category)&&(freezing==='all'||r.freezing.status===freezing)&&normalize(r.name+' '+r.ingredients.join(' ')).includes(term));
}
export const storage='A aptidão de um ingrediente isolado não valida a receita pronta. Siga a orientação específica da autoria e as instruções oficiais de manipulação. Não atribuímos prazos de freezer sem evidência. As classificações da tabela FoodKeeper se referem à apresentação indicada do produto e à qualidade, não a uma garantia de segurança. Consulte a fonte antes de armazenar.';
