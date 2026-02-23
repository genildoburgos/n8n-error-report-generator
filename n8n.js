// implementação em um unico arquivo ideal para no code javascript
const items = $input.all();

// ---------- helpers ----------
function esc(s) {
  // escape básico para HTML
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(d) {
  if (!d || d === "desconhecido") return "desconhecido";
  
  const parsed = new Date(d);
  // Se a data for inválida (ex: uma string aleatória), retorna o valor original
  if (isNaN(parsed.getTime())) return d;
  
  // Retorna no formato DD/MM/AAAA, HH:MM:SS
  return parsed.toLocaleString('pt-BR');
}

function pick(obj, path, fallback = "") {
  // pega caminho tipo "execution_data.error.message"
  try {
    return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
}

// ---------- normalize ----------
const erros = items.map((it, idx) => {
  const raw = it.json ?? it; // por segurança
  const ex = raw; // se já vier "flat"
  const id = pick(ex, "id", pick(raw, "id", `#${idx + 1}`));
  const url = pick(ex, "execution_url", "");
  const mode = pick(ex, "execution_mode", "desconhecido");
  const date = formatDate(pick(ex, "created_at", "desconhecido"));
  const workflow_name = pick(ex, "workflow_data.name", "Não encontrado");
  const workflow_id = pick(ex, "workflow_data.id", "Não encontrado");
  const message = pick(ex, "error_message", pick(ex, "error", "Erro sem mensagem"));
  const stack = pick(ex, "execution_data.error.stack", "");
  const level = pick(ex, "execution_data.error.level", "Sem level");

  const error_name = pick(ex, "execution_data.error.name", "Erro Desconhecido");
  const node_name = pick(ex, "execution_data.error.node.name", pick(ex, "execution_data.lastNodeExecuted", "Nó Desconhecido"));
  const node_type = pick(ex, "execution_data.error.node.type", "-");
  const trigger_name = pick(ex, "execution_data.executionContext.triggerNode.name", "-");

  return {
    idx: idx + 1,
    id,
    url,
    mode,
    workflow_name,
    workflow_id,
    date,
    level,
    message,
    stack,
    error_name,
    node_name,
    node_type,
    trigger_name,
    raw, // opcional p/ debug
  };
});

// ---------- summary ----------
const total = erros.length;
const byMsg = new Map();
const byWorkflowName = new Map();
const byLevel = new Map();

for (const e of erros) {
  byWorkflowName.set(e.workflow_name, (byWorkflowName.get(e.workflow_name) ?? 0) + 1);
  byLevel.set(e.level, (byLevel.get(e.level) ?? 0) + 1);
}

const workflowsNameSorted = [...byWorkflowName.entries()].sort((a, b) => b[1] - a[1]);
const levelsSorted = [...byLevel.entries()].sort((a, b) => b[1] - a[1]);

// ---------- html ----------
const now = new Date();
const iso = now.toISOString();

const summaryHtml = `
  <div class="grid">
    <div class="card kpi">
      <div class="kpiTitle">Total de erros</div>
      <div class="kpiValue">${total}</div>
      <div class="kpiSub">Atualizado em ${esc(formatDate(iso))}</div>
    </div>

    <div class="card">
      <div class="cardTitle">Top WorkFlow</div>
      <div class="chips">
        ${
          workflowsNameSorted.length
            ? workflowsNameSorted.slice(0, 10).map(([m, c]) => `<span class="chip"><b>${esc(m)}</b> <span class="muted">(${c})</span></span>`).join("")
            : `<span class="muted">Sem dados</span>`
        }
      </div>
    </div>

    <div class="card">
      <div class="cardTitle">Top Level</div>
      <div class="chips">
        ${
          levelsSorted.length
            ? levelsSorted.map(([m, c]) => `<span class="chip"><b>${esc(m)}</b> <span class="muted">(${c})</span></span>`).join("")
            : `<span class="muted">Sem dados</span>`
        }
      </div>
    </div>
  </div>
`;

const listHtml = erros.slice().reverse().map(e => {
  const link = e.url ? `<a class="link" href="${esc(e.url)}" target="_blank" rel="noreferrer">Abrir execução</a>` : `<span class="muted">Sem URL</span>`;
  const detailsContent = `
    <div class="techDetails">
      <div>Tipo de Erro: <span class="muted">${esc(e.error_name)}</span></div>
      <div>Nó que falhou: <span class="muted">${esc(e.node_name)}</span> <span style="font-size:10px; opacity:0.6;">(${esc(e.node_type)})</span></div>
      <div>Gatilho: <span class="muted">${esc(e.trigger_name)}</span></div>
    </div>
    ${e.stack ? `<pre>${esc(e.stack)}</pre>` : `<div class="muted" style="margin-top:10px;">Sem stack trace disponível.</div>`}
  `;
  const stackBlock = `<details><summary>Detalhes técnicos e Stack trace</summary>${detailsContent}</details>`;

  return `
    <div class="card errorCard">
      <div class="row">
        <div>
          <div class="titleLine">
            <span class="badge">#${esc(e.id)}</span>
            <span class="badge">${esc(e.date)}</span>
            <span class="mode">${esc(e.mode)}</span>
            <span class="mode">${esc(e.workflow_name)}</span>
            <span class="mode">${esc(e.workflow_id)}</span>
          </div>
          <div class="message">${esc(e.message)} - ${esc(e.level)}</div>
        </div>
        <div class="right">
          ${link}
        </div>
      </div>
      <div class="stack">
        ${stackBlock}
      </div>
    </div>
  `;
}).join("");

const html = `
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Relatório de erros (n8n)</title>
  <style>
    :root{
      --bg:#0b1020;
      --card:#121a33;
      --muted:#a8b3cf;
      --text:#e9eeff;
      --accent:#7aa2ff;
      --danger:#ff6b6b;
      --border:rgba(255,255,255,.08);
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background: radial-gradient(1200px 600px at 20% 0%, rgba(122,162,255,.25), transparent 55%),
                  radial-gradient(900px 500px at 90% 10%, rgba(255,107,107,.18), transparent 60%),
                  var(--bg);
      color:var(--text);
      padding:24px;
    }
    .wrap{max-width:1100px;margin:0 auto}
    header{
      display:flex; align-items:flex-end; justify-content:space-between;
      gap:16px; margin-bottom:18px;
    }
    h1{margin:0;font-size:22px;letter-spacing:.2px}
    .sub{color:var(--muted);font-size:13px}
    .grid{
      display:grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap:12px;
      margin:14px 0 18px;
    }
    @media (max-width: 900px){
      .grid{grid-template-columns:1fr}
    }
    .card{
      background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
      border:1px solid var(--border);
      border-radius:14px;
      padding:14px;
      box-shadow: 0 8px 30px rgba(0,0,0,.25);
    }
    .kpiTitle{color:var(--muted);font-size:12px}
    .kpiValue{font-size:34px;font-weight:800;margin-top:6px}
    .kpiSub{color:var(--muted);font-size:12px;margin-top:4px}
    .cardTitle{font-weight:700;margin-bottom:10px}
    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chip{
      border:1px solid var(--border);
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      background: rgba(255,255,255,.02);
    }
    .toplist{margin:0;padding-left:18px;color:var(--text)}
    .toplist li{margin:6px 0}
    .msg{color:var(--text)}
    .muted{color:var(--muted)}
    .errorCard{margin-bottom:12px}
    .row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .right{white-space:nowrap}
    .titleLine{display:flex;gap:10px;align-items:center;margin-bottom:8px}
    .badge{
      background: rgba(255,255,255,.06);
      border:1px solid var(--border);
      padding:4px 8px;
      border-radius:10px;
      font-size:12px;
      font-weight:700;
    }
    .mode{
      color: var(--accent);
      font-size:12px;
      border:1px solid rgba(122,162,255,.35);
      background: rgba(122,162,255,.10);
      padding:3px 8px;
      border-radius:999px;
    }
    .message{
      font-size:14px;
      line-height:1.35;
    }
    .link{
      color: var(--text);
      text-decoration:none;
      border-bottom:1px dashed rgba(255,255,255,.35);
      font-size:12px;
    }
    details{
      margin-top:10px;
      border-top: 1px solid var(--border);
      padding-top:10px;
    }
    summary{
      cursor:pointer;
      color: var(--muted);
      font-size:12px;
    }
    pre{
      margin:10px 0 0;
      padding:12px;
      border-radius:12px;
      overflow:auto;
      background: rgba(0,0,0,.35);
      border:1px solid var(--border);
      font-size:12px;
      line-height:1.35;
      color: #e9eeff;
    }
    footer{margin-top:18px;color:var(--muted);font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>Relatório de erros (n8n)</h1>
        <div class="sub">Consolidado a partir de ${total} item(ns) recebidos no node Code.</div>
      </div>
      <div class="sub">${esc(formatDate(iso))}</div>
    </header>

    ${summaryHtml}

    <section>
      ${total ? listHtml : `<div class="card"><span class="muted">Nenhum erro recebido.</span></div>`}
    </section>

    <footer>
      Dica: envie este HTML por e-mail/Telegram ou salve em arquivo. (Gerado no n8n)
    </footer>
  </div>
</body>
</html>
`.trim();

// Retorna como campo "html" (e opcionalmente os objetos normalizados)
return [{
  json: {
    html,
    total,
    erros,
  }
}];
