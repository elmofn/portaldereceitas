# Carinho no Pote 🌿

Portal em português de receitas caseiras para congelar, com ingredientes comuns em Porto Alegre. Layout responsivo, pesquisa por ingredientes sem distinção de acentos, filtros e seis receitas com PDF individual. Em celulares compatíveis, o PDF pode ser enviado pelo compartilhamento nativo; nos demais navegadores, é baixado para anexar ao WhatsApp.

## Desenvolvimento

Node.js 24 e npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run test:e2e
```

O conteúdo está em `src/recipes.js`; a geração de PDF, em `src/pdf.js`. O portal é estático e não precisa de servidor, banco de dados, conta de usuário ou chave de API. Fontes locais Lora e DM Sans (licenças OFL em `public/fonts`). Fotos ilustrativas via Unsplash, com ilustrações SVG locais como alternativa em caso de indisponibilidade. Os tempos de freezer são orientações de qualidade a −18 °C, não uma garantia independente das condições de manipulação.

## Navegação

A entrada mostra diretamente busca, filtros e receitas. O menu fixo abre Receitas, Como congelar e Sobre em telas separadas. Cada receita possui uma URL própria, por exemplo `?receita=frango`, com suporte a recarga e links compartilhados no GitHub Pages sem regras de redirecionamento. Busca e categoria são mantidas na URL e preservadas no link de retorno da receita.

## Cardápio semanal

O menu **Minha semana** abre `?pagina=semana`. Cada semana começa na segunda-feira e possui almoço e jantar de segunda a domingo. Selecione uma receita, informe de 1 a 12 porções por refeição e navegue entre semanas. Também é possível incluir uma receita diretamente de sua página e preencher os espaços vazios automaticamente, preservando as escolhas existentes.

Os planos ficam no `localStorage` deste navegador, separados por semana, sem conta ou sincronização entre aparelhos. Se o armazenamento estiver bloqueado, a interface avisa; o planejamento ainda funciona durante a sessão e pode ser salvo em PDF. Limpar uma semana exige confirmação e mantém as demais.

O PDF contém datas, refeições, porções planejadas, resumo do preparo e orientações de armazenamento. O resumo soma as porções por receita e indica quantos preparos completos são necessários. Ele não altera quantidades dos ingredientes; eventuais porções extras podem ser reservadas para outra semana.

## Publicação gratuita com GitHub Pages

1. Envie os arquivos para a branch `main` de `elmofn/portaldereceitas`.
2. Para GitHub Free, confirme que o repositório está público (Settings → General → Danger Zone → Change repository visibility). Essa ação torna todo o conteúdo do repositório público.
3. Em Settings → Pages → Build and deployment → Source, selecione **GitHub Actions**.
4. Acompanhe o workflow **Publicar portal** na aba Actions. Se ele já tiver executado antes de habilitar Pages, execute-o novamente por **Run workflow**.
5. Depois do deploy bem-sucedido, o endereço esperado é `https://elmofn.github.io/portaldereceitas/`.

O workflow faz instalação com lockfile, testes, build e deploy. Atualizações enviadas a `main` são publicadas automaticamente. O caminho relativo do Vite permite servir o projeto no subdiretório do GitHub Pages. Não se deve afirmar que a URL está disponível antes de confirmar o deploy.

## Validação realizada

Testes Node: busca por ingrediente/acentos/categoria, geração de PDFs individuais e semanal, datas de início da semana, preservação de escolhas no preenchimento, sanitização de dados, armazenamento e resumo de porções. Navegador Chromium: menu e páginas separadas, links diretos de receitas, recarga, histórico do navegador, busca/filtros preservados ao voltar, estado vazio, receita inexistente, download real de PDF e ausência de overflow horizontal em larguras de 375, 390, 768 e 1440 pixels. Validado também com arquivos estáticos no subdiretório `/portaldereceitas/`. Os testes estão em `e2e/navigation.spec.js`; execute `npm run build && npm run test:e2e`. O Chromium é encontrado em `/usr/bin/chromium`; em outra máquina, informe o executável com a variável `CHROMIUM_PATH`. O compartilhamento via WhatsApp depende do navegador/aplicativo do aparelho e não foi testado em um celular físico.
