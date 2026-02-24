// implementação em um unico arquivo ideal para no code javascript
const items = $input.all();

// 1) Remove placeholder vazio: [{json:{}}] ou [{ }], etc.
const nonEmptyItems = items.filter((it) => {
  const j = (it && typeof it === "object" && "json" in it) ? it.json : it;
  return j && typeof j === "object" && Object.keys(j).length > 0;
});

if (nonEmptyItems.length === 0) {
  const now = new Date();
  const iso = now.toISOString();

  const html = `
<!doctype html>
<html lang="pt-br">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Relatório de Ocorrências - n8n</title>
</head>
<body style="font-family:system-ui; padding:24px;">
  <h1 style="margin:0 0 8px;">Relatório de Ocorrências</h1>
  <div style="color:#6b7280; margin-bottom:16px;">Gerado em: ${now.toLocaleString("pt-BR")}</div>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:8px; background:#fff;">
    Nenhum erro recebido nesta execução.
  </div>
</body>
</html>`.trim();

  return [{
    json: {
      html,
      total: 0,
      erros: [],
      meta: { generatedAt: iso, note: "Sem registros (placeholder vazio do node anterior)" }
    }
  }];
}

const itensValidos = nonEmptyItems;

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
const erros = itensValidos.map((it, idx) => {
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
      <div class="kpiTitle">Total de ocorrências</div>
      <div class="kpiValue">${total}</div>
      <div class="kpiSub">Atualizado em ${esc(formatDate(iso))}</div>
    </div>

    <div class="card">
      <div class="cardTitle">Top Workflows</div>
      <div class="chips">
        ${
          workflowsNameSorted.length
            ? workflowsNameSorted.slice(0, 5).map(([m, c]) => `<span class="chip"><b>${esc(m)}</b> <span class="muted">(${c})</span></span>`).join("")
            : `<span class="muted">Sem dados</span>`
        }
      </div>
    </div>

    <div class="card">
      <div class="cardTitle">Top Níveis (Levels)</div>
      <div class="chips">
        ${
          levelsSorted.length
            ? levelsSorted.map(([m, c]) => {
                // Pinta os chips do resumo também
                let chipColor = "";
                const lvl = String(m).toLowerCase();
                if (lvl.includes("error") || lvl.includes("danger")) chipColor = "background:#fee2e2; color:#991b1b; border-color:#f87171;";
                else if (lvl.includes("warn")) chipColor = "background:#fef3c7; color:#92400e; border-color:#fbbf24;";
                return `<span class="chip" style="${chipColor}"><b>${esc(m)}</b> <span style="opacity:0.7;">(${c})</span></span>`
              }).join("")
            : `<span class="muted">Sem dados</span>`
        }
      </div>
    </div>
  </div>
`;

const listHtml = erros.slice().reverse().map(e => {
  const link = e.url ? `<a class="link" href="${esc(e.url)}" target="_blank" rel="noreferrer">Abrir execução no n8n</a>` : `<span class="muted">Sem URL</span>`;
  
  // Definição de cores baseada no Level
  let levelClass = "level-default";
  let borderClass = "";
  const lvl = String(e.level).toLowerCase();
  
  if (lvl.includes("error") || lvl.includes("danger") || lvl.includes("fatal")) {
    levelClass = "level-error";
    borderClass = "border-error";
  } else if (lvl.includes("warn")) {
    levelClass = "level-warning";
    borderClass = "border-warning";
  } else if (lvl.includes("info")) {
    levelClass = "level-info";
    borderClass = "border-info";
  }

  const detailsContent = `
    <div class="techDetails">
      <div><b>Tipo de Erro:</b> <span class="muted">${esc(e.error_name)}</span></div>
      <div><b>Nó que falhou:</b> <span class="muted">${esc(e.node_name)}</span> <span style="font-size:10px; opacity:0.6;">(${esc(e.node_type)})</span></div>
      <div><b>Gatilho:</b> <span class="muted">${esc(e.trigger_name)}</span></div>
    </div>
    ${e.stack ? `<pre>${esc(e.stack)}</pre>` : `<div class="muted" style="margin-top:10px;">Sem stack trace disponível.</div>`}
  `;
  
  const stackBlock = `<details><summary>Detalhes técnicos e Stack trace</summary>${detailsContent}</details>`;

  return `
    <div class="card errorCard ${borderClass}">
      <div class="row">
        <div>
          <div class="titleLine">
            <span class="badge ${levelClass}">${esc(e.level).toUpperCase()}</span>
            <span class="badge">#${esc(e.id)}</span>
            <span class="badge">${esc(e.date)}</span>
            <span class="mode">${esc(e.workflow_name)}</span>
          </div>
          <div class="message">${esc(e.message)}</div>
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
  <title>Relatório de Ocorrências - n8n</title>
  <style>
    :root{
      --bg: #f3f4f6;
      --card: #ffffff;
      --muted: #6b7280;
      --text: #111827;
      --border: #e5e7eb;
      --link: #2563eb;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background: var(--bg);
      color: var(--text);
      padding:24px;
    }
    .wrap{max-width:1100px;margin:0 auto}
    header{
      display:flex; align-items:flex-end; justify-content:space-between;
      gap:16px; margin-bottom:18px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    h1{margin:0;font-size:24px;letter-spacing:-0.5px; color:#111827;}
    .sub{color:var(--muted);font-size:13px}
    .grid{
      display:grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap:16px;
      margin:14px 0 24px;
    }
    @media (max-width: 900px){
      .grid{grid-template-columns:1fr}
    }
    .card{
      background: var(--card);
      border:1px solid var(--border);
      border-radius:8px;
      padding:16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .kpiTitle{color:var(--muted);font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;}
    .kpiValue{font-size:32px;font-weight:800;margin-top:4px; color:#111827;}
    .kpiSub{color:var(--muted);font-size:12px;margin-top:4px}
    .cardTitle{font-weight:600;margin-bottom:12px; font-size:14px; color:#374151;}
    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chip{
      border:1px solid var(--border);
      border-radius:6px;
      padding:4px 8px;
      font-size:12px;
      background: #f9fafb;
      color: #374151;
    }

    .chip-count {
      background: #e5e7eb;
      color: #374151;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }

    /* Cores Especiais para os Chips de Nível (Resumo) */
    .chip-error { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
    .chip-error .chip-count { background: #fee2e2; color: #991b1b; }
    
    .chip-warning { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
    .chip-warning .chip-count { background: #fef3c7; color: #92400e; }
    
    .chip-info { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
    .chip-info .chip-count { background: #dbeafe; color: #1e40af; }
    .muted{color:var(--muted)}

    .muted{color:var(--muted)}
    
    /* Cores Dinâmicas dos Cards */
    .errorCard{margin-bottom:16px; border-left-width: 4px;}
    .border-error { border-left-color: #ef4444; }
    .border-warning { border-left-color: #f59e0b; }
    .border-info { border-left-color: #3b82f6; }

    .row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .right{white-space:nowrap}
    .titleLine{display:flex;gap:8px;align-items:center;margin-bottom:10px; flex-wrap:wrap;}
    
    /* Badges base */
    .badge, .mode {
      color: #0f172a; 
      background: #e2e8f0; 
      font-size: 11px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 6px;
    }
    
    /* Cores dos Badges de Nível */
    .level-error { background: #fee2e2; color: #991b1b; border-color: #f87171; }
    .level-warning { background: #fef3c7; color: #92400e; border-color: #fbbf24; }
    .level-info { background: #dbeafe; color: #1e40af; border-color: #60a5fa; }
    .level-default { background: #f3f4f6; color: #374151; border-color: #d1d5db; }

    .mode{
      color: #0f172a; /* Texto quase preto para contraste máximo */
      background: #e2e8f0; /* Fundo cinza um pouco mais preenchido */
      font-size: 11px;
      font-weight: 600; /* Texto mais grosso */
      border: 1px solid #cbd5e1; /* Borda mais visível */
      padding: 3px 8px;
      border-radius: 6px;
    }
    .message{
      font-size:15px;
      line-height:1.5;
      font-weight: 500;
      color: #1f2937;
    }
    .link{
      color: var(--link);
      text-decoration:none;
      font-size:13px;
      font-weight:500;
    }
    .link:hover { text-decoration: underline; }
    
    details{
      margin-top:14px;
      border-top: 1px solid var(--border);
      padding-top:12px;
    }
    summary{
      cursor:pointer;
      color: #4b5563;
      font-size:13px;
      font-weight: 500;
    }
    summary:hover { color: #111827; }
    .techDetails {
      margin-top: 12px;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
    }
    pre{
      margin:10px 0 0;
      padding:12px;
      border-radius:6px;
      overflow:auto;
      background: #1e293b;
      border:1px solid #0f172a;
      font-size:12px;
      line-height:1.4;
      color: #f8fafc;
    }
    footer{margin-top:24px; text-align:center; color:var(--muted); font-size:12px;}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>Relatório de Ocorrências</h1>
        <div class="sub">Consolidado a partir de ${total} registro(s) do n8n.</div>
      </div>
      <div class="sub" style="text-align:right;">
        <b>Gerado em:</b><br>${esc(formatDate(iso))}
      </div>
    </header>

    ${summaryHtml}

    <section>
      ${total ? listHtml : `<div class="card"><span class="muted">Nenhum erro recebido nesta execução.</span></div>`}
    </section>

    <footer>
      Relatório automatizado • Gerado via n8n
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
