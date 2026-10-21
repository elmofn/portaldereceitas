# Lote piloto TudoGostoso — 12 receitas

Este diretório configura a coleta e a revisão; não contém receitas inventadas ou um lote já aprovado.

## Execução

```sh
python -m unittest discover -s tests/tudogostoso -p 'test_*.py'
python scripts/tudogostoso/collector.py --mode inspect
python scripts/tudogostoso/collector.py --mode collect --limit 12
```

Também existe o workflow manual **Revisar lote TudoGostoso**. Execute `inspect` primeiro. Os resultados ficam em um artefato de revisão por 7 dias; o workflow não altera arquivos nem publica conteúdo no site. Não há rotina agendada antes de validar as condições de uso.

A inspeção exige acesso válido ao robots e à página inicial permitida. Guarda o robots e indica links de termos para leitura. Ausência de robots reconhecível, erro de rede, 403, 429 e bloqueios interrompem a execução; não há tentativas repetidas, rotação de identidade ou contorno de CAPTCHA.

A etapa inicial coleta apenas metadados públicos para curadoria solicitada pelo usuário, respeitando robots. Os termos continuam marcados como pendentes quando não localizados; essa coleta não representa permissão para reutilizar texto ou fotos. Antes de republicar, registre a revisão dos termos e a autorização/licença aplicável. Adicione às `seeds` páginas reais de categorias ou receitas, conforme necessário. O coletor examina no máximo 30 páginas de receita e coleta até 12 candidatas com título, ingredientes, indicação de existência de preparo, autoria e endereço HTTPS de foto. Não armazena instruções de preparo completas nem HTML da receita. Rejeita categorias óbvias fora do foco, como sobremesas. Uma análise humana ainda deve confirmar adequação, ingredientes comuns em Porto Alegre e variedade. Se não encontrar 12, relata lote incompleto em vez de completar com receitas geradas.

Uma requisição por vez, intervalo mínimo de 3 segundos, `Crawl-delay` e `Request-rate` respeitados. Redirecionamentos ficam restritos aos domínios do TudoGostoso e não podem abrir caminhos vedados pelo robots. TLS é verificado normalmente. Cache de candidatos fica em `.local/`, ignorado pelo Git. Fotografias não são baixadas nem exibidas por hotlink: apenas a URL é registrada como candidata.

## Revisão antes da publicação

Para cada receita selecionada, verifique:

- Título, autoria, link canônico, quantidades e rendimento na publicação original.
- Adequação ao cardápio semanal, ingredientes acessíveis e variedade no lote.
- Permissão aplicável de reutilização do texto; ou autorização para publicar somente ficha resumida com link, conforme as regras verificadas.
- Foto com autorização ou licença aplicável, autor/crédito e evidência documentada; alternativamente, fotografia própria do prato preparado pela receita original.
- Congelamento com evidência específica e independente; sem ela, permanece `unknown`, sem prazo estimado.

`robots.txt` controla coleta, não concede licença de textos ou fotografias. Registrar a URL de uma foto também não autoriza copiá-la ou embuti-la. O portal atual permanece sem alterações até a conclusão dessas etapas.

## Estado inicial

A coleta local ficou bloqueada pela lista de domínios do ambiente em 21/10/2026. `www.tudogostoso.com.br` e `tudogostoso.com.br` foram solicitados nas configurações do ambiente. A inspeção no GitHub Actions conseguiu consultar robots e a página inicial. Nenhum link de termos foi encontrado nela. Essa ausência não implica licença para republicação. Se o site negar acesso em qualquer etapa, a execução deve parar.
