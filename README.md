
# n8n-error-report-generator

Gerador automático de relatórios de erros. Padrão para n8n execution data. Gera HTML consolidado a partir de execuções, pronto para uso em automações, APIs ou dashboards.

Separado em módulos para facilitar debug, manutenção e execução local.

## Como executar localmente

1. Ajuste o arquivo `sample-input.json` com os dados desejados.
2. Rode o script:

```powershell
node run.js
```

Isso gera `out.html` na raiz do projeto.


## Uso no n8n (Code Node)

Você pode usar o conteúdo de `relatorio.js` ou, para blocos nos javascript via n8n, utilize `n8n.js`.

- `n8n.js`: versão única, pronta para colar no Code Node do n8n (JavaScript). Não depende de módulos externos.
- `relatorio.js`: versão modular, para projetos que aceitam múltiplos arquivos.

Ambas retornam:

- `json.html`
- `json.total`
- `json.erros`

## Estrutura

- `relatorio.js`: entrada usada no n8n
- `lib/`: helpers, normalização, resumo e renderização
- `run.js`: runner local
- `sample-input.json`: payload de teste
