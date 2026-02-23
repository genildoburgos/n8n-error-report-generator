
# n8n-error-report-generator

Gerador automático de relatórios de erros. Padrão para n8n execution data. Gera HTML consolidado a partir de execuções, pronto para uso em automações, APIs ou dashboards.

Separado em módulos para facilitar debug, manutenção e execução local.

## Como executar localmente

1. Crie um arquivo `sample-input.json` na raiz do projeto com o seguinte formato:

```json
[
  {
    "json": {
      "execution_data": {
        "id": "123",
        "url": "https://example.com/executions/123",
        "mode": "manual",
        "error": {
          "message": "Timeout ao consultar API",
          "stack": "Error: Timeout\n    at request (/app/index.js:10:5)"
        }
      }
    }
  },
  {
    "json": {
      "execution_data": {
        "id": "124",
        "url": "",
        "mode": "trigger",
        "error": {
          "message": "Token inválido",
          "stack": "Error: 401 Unauthorized\n    at auth (/app/auth.js:4:2)"
        }
      }
    }
  }
]
```

2. Rode o script:

```powershell
node run.js
```

Isso gera `out.html` na raiz do projeto.

### Estrutura do input

O arquivo de entrada deve ser um array de objetos seguindo o padrão de execuções do n8n:

- `json.execution_data.id`: ID da execução
- `json.execution_data.url`: URL da execução (opcional)
- `json.execution_data.mode`: Modo de execução (`manual`, `trigger`, etc.)
- `json.execution_data.error.message`: Mensagem de erro
- `json.execution_data.error.stack`: Stack trace do erro


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
