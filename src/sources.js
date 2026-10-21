export const reviewedAt = '2026-10-21';
export const recipeSnapshot = { publisher: 'recipe-scrapers (cópia técnica de páginas de receitas)', revision: 'b49b0ff0f2f69970f9579d0c5d086892c335011c', url: 'https://github.com/hhursev/recipe-scrapers/tree/b49b0ff0f2f69970f9579d0c5d086892c335011c/tests/test_data' };
export const foodkeeperSource = { publisher: 'USDA / FSIS — FoodKeeper', url: 'https://www.foodsafety.gov/keep-food-safe/foodkeeper-app', snapshot: 'https://github.com/jelera/food-shelflife-db/blob/a7bf41f2a07823039e9169b538f0c42a29336eb7/lib/seeds/ingredients.csv', revision: 'a7bf41f2a07823039e9169b538f0c42a29336eb7', note: 'Consulta indireta: cópia histórica de dados atribuídos ao USDA. A edição atual do FoodKeeper ainda não foi revalidada.' };
export const statusLabels = { yes: 'Congelamento indicado pela fonte', no: 'Congelamento não recomendado', conditional: 'Depende do preparo', unknown: 'Congelamento não verificado' };
export function freezerLabel(recipe) { return statusLabels[recipe.freezing.status] || statusLabels.unknown; }
export function timeLabel(recipe) { return recipe.time == null ? 'Tempo não informado' : `${recipe.time} min`; }
export const generalStorageSource = { publisher: 'USDA / FSIS', url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety', verification: 'pending' };
