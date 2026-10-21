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
```

O conteúdo está em `src/recipes.js`; a geração de PDF, em `src/pdf.js`. O portal é estático e não precisa de servidor, banco de dados, conta de usuário ou chave de API. Fontes locais Lora e DM Sans (licenças OFL em `public/fonts`). Fotos ilustrativas via Unsplash, com ilustrações SVG locais como alternativa em caso de indisponibilidade. Os tempos de freezer são orientações de qualidade a −18 °C, não uma garantia independente das condições de manipulação.

## Publicação gratuita com GitHub Pages

1. Envie os arquivos para a branch `main` de `elmofn/portaldereceitas`.
2. Para GitHub Free, confirme que o repositório está público (Settings → General → Danger Zone → Change repository visibility). Essa ação torna todo o conteúdo do repositório público.
3. Em Settings → Pages → Build and deployment → Source, selecione **GitHub Actions**.
4. Acompanhe o workflow **Publicar portal** na aba Actions. Se ele já tiver executado antes de habilitar Pages, execute-o novamente por **Run workflow**.
5. Depois do deploy bem-sucedido, o endereço esperado é `https://elmofn.github.io/portaldereceitas/`.

O workflow faz instalação com lockfile, testes, build e deploy. Atualizações enviadas a `main` são publicadas automaticamente. O caminho relativo do Vite permite servir o projeto no subdiretório do GitHub Pages. Não se deve afirmar que a URL está disponível antes de confirmar o deploy.

## Validação realizada

Testes Node: busca por ingrediente/acentos/categoria e geração de PDFs de todas as receitas. Navegador Chromium: busca, filtros, estado vazio, modal e fechamento por Escape, download real de PDF e ausência de overflow horizontal em larguras de 375, 390, 768 e 1440 pixels. O compartilhamento via WhatsApp depende do navegador/aplicativo do aparelho e não foi testado em um celular físico.
