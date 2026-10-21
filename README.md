# Carinho no Pote 🌿

Portal estático em português com receitas de autoria identificada, páginas individuais, planejamento semanal, consulta de ingredientes e exportação em PDF. Hospedagem no GitHub Pages, sem banco de dados, chave de API ou custo de serviço externo.

## Desenvolvimento

Node.js 24.19 ou superior.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
npm run sources:verify
npm run preview
```

Os testes de navegador usam Chromium em `/usr/bin/chromium`. Em outra máquina, indique o executável com `CHROMIUM_PATH`. `sources:verify` consulta referências externas por HTTPS, respeitando o proxy do ambiente e verificando hashes SHA-256 dos arquivos de origem fixados por commit. Essa conferência não atualiza dados automaticamente e não prova que uma página original permanece atual.

## Base de dados e proveniência

As seis receitas iniciais sem referências foram **retiradas**, assim como seus prazos de freezer. Seus IDs não foram reutilizados e URLs antigas mostram um aviso. O catálogo inicial atual tem quatro receitas: NHS Better Health (chilli e peixe com batatas), Panelinha (arroz sírio com frango) e MyPlate/USDA (salada de frango, arroz, aspargos e tangerina).

Não são receitas criadas pelo portal. Os ingredientes preservam quantidades e produtos; quando necessário, há tradução para português, mantendo unidades originais. O preparo é uma síntese da autoria com link obrigatório para as instruções completas. Não substituímos ingredientes para simular uma adaptação local. Fotos externas foram removidas; as imagens atuais são ilustrações locais.

**Limitação de acesso em 21/10/2026:** as páginas originais estavam bloqueadas pela rede deste ambiente. As referências foram consultadas indiretamente em cópias técnicas do projeto `hhursev/recipe-scrapers`, no commit `b49b0ff0f2f69970f9579d0c5d086892c335011c`. Não alegamos revalidação direta ou atual do conteúdo. Essa condição é mostrada no catálogo, na receita, nos PDFs e em **Fontes e critérios** (`?pagina=fontes`).

A base de ingredientes usa uma seleção de registros de uma cópia histórica da tabela FoodKeeper, atribuída ao USDA/FSIS, disponível em `jelera/food-shelflife-db`, commit `a7bf41f2a07823039e9169b538f0c42a29336eb7`. Os registros originais e a proveniência são auditáveis. A edição atual do FoodKeeper não foi revalidada. A tabela trata de apresentações e qualidade de conservação; os resultados não são garantias de segurança sanitária.

Arquivos:

- `src/data/recipe-snapshots.json`: campos de referência das receitas, sem transcrição integral do preparo.
- `src/data/foodkeeper-snapshot.json`: registros selecionados com campos originais preservados.
- `src/data/provenance.json`: URLs fixadas e hashes dos arquivos externos consultados.
- `src/recipes.js`: seleção editorial, ingredientes e sínteses em português.
- `src/ingredients.js`: aliases, apresentações e regras conservadoras.
- `src/sources.js`: fontes, revisões e textos de classificação.
- `scripts/verify-sources.mjs`: verifica a integridade e a correspondência dos dados locais com as referências versionadas.

Para ampliar o catálogo, consulte uma receita efetivamente publicada, registre autoria e URL canônica, preserve os ingredientes e o rendimento e adicione a referência auditável antes de publicar. Verifique separadamente a orientação de freezer. Uma nova versão de referência exige revisão explícita dos dados e dos hashes. Não use conteúdo sem autoria, receitas geradas ou prazos estimados.

## Congelamento

Existem quatro resultados: indicado pela fonte, não recomendado, depende do preparo e não verificado. A forma do produto importa: arroz cru não herda a regra de arroz cozido; ovo com casca, claras/gemas sem casca e ovo cozido têm regras distintas. Ingredientes não reconhecidos ou apresentações ausentes permanecem sem conclusão. Correspondências por nome não validam automaticamente um prato pronto.

Uma única receita inicial, o chilli do NHS, possui indicação expressa de congelamento no trecho consultado. A fonte não informa prazo nem detalha o congelamento do arroz servido como acompanhamento; não atribuimos prazo. As três outras receitas têm congelamento não verificado. O preenchimento automático do planejador usa somente receitas com indicação expressa; portanto, atualmente repete o chilli. A pessoa pode planejar outros pratos para consumo sem presumir que possam ser congelados.

## Cardápio e navegação

A entrada mostra receitas, busca, categorias, filtro de congelamento e uma consulta expansível de ingredientes. O menu abre Minha semana, Receitas, Como congelar e Sobre. Há links para fontes em cada receita e no rodapé.

Receitas possuem URLs próprias (`?receita=nhs-chilli`) compatíveis com recarga no GitHub Pages. Busca e filtros são preservados no retorno à lista.

Em `?pagina=semana`, cada semana começa na segunda-feira, com almoço e jantar dos sete dias e 1 a 12 porções por refeição. Planos ficam no `localStorage`, separados por semana, sem sincronização entre aparelhos. Se o armazenamento falhar, a interface avisa e o PDF continua disponível. Limpar uma semana exige confirmação.

Receitas retiradas do catálogo não são trocadas por outras silenciosamente. O plano antigo permanece armazenado até a edição da semana; essas escolhas aparecem vazias com aviso. PDFs e resumo do preparo mostram a classificação e a fonte de cada receita. Ingredientes não são redimensionados automaticamente.

## Publicação gratuita

Envie a `main` e configure **Settings → Pages → Source → GitHub Actions**. O workflow `Publicar portal` executa instalação com lockfile, testes, build e deploy de `dist`. Evite a origem por branch, que pode publicar o código-fonte em vez do build.

Endereço: `https://elmofn.github.io/portaldereceitas/`.

Fontes locais Lora e DM Sans com licenças OFL em `public/fonts`. O compartilhamento nativo de arquivos depende do aparelho/navegador; nos demais casos, o PDF é baixado para anexar ao WhatsApp.
