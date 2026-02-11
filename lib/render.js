const { esc } = require("./helpers");

function renderHtml({ total, erros, modesSorted, msgsSorted, iso }) {
  const summaryHtml = `
  <div class="grid">
    <div class="card kpi">
      <div class="kpiTitle">Total de erros</div>
      <div class="kpiValue">${total}</div>
      <div class="kpiSub">Atualizado em ${esc(iso)}</div>
    </div>

    <div class="card">
      <div class="cardTitle">Por modo</div>
      <div class="chips">
        ${
          modesSorted.length
            ? modesSorted
                .map(([mode, count]) => `<span class="chip"><b>${esc(mode)}</b> <span class="muted">(${count})</span></span>`)
                .join("")
            : `<span class="muted">Sem dados</span>`
        }
      </div>
    </div>

    <div class="card">
      <div class="cardTitle">Top mensagens</div>
      <ol class="toplist">
        ${
          msgsSorted.length
            ? msgsSorted
                .map(([message, count]) => `<li><span class="msg">${esc(message)}</span> <span class="muted">(${count})</span></li>`)
                .join("")
            : `<li class="muted">Sem dados</li>`
        }
      </ol>
    </div>
  </div>
`;

  const listHtml = erros
    .map((erro) => {
      const link = erro.url
        ? `<a class="link" href="${esc(erro.url)}" target="_blank" rel="noreferrer">Abrir execução</a>`
        : `<span class="muted">Sem URL</span>`;
      const stackBlock = erro.stack
        ? `<details><summary>Stack trace</summary><pre>${esc(erro.stack)}</pre></details>`
        : `<div class="muted">Sem stack trace</div>`;

      return `
    <div class="card errorCard">
      <div class="row">
        <div>
          <div class="titleLine">
            <span class="badge">#${esc(erro.id)}</span>
            <span class="mode">${esc(erro.mode)}</span>
          </div>
          <div class="message">${esc(erro.message)}</div>
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
    })
    .join("");

  return `
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
      <div class="sub">${esc(iso)}</div>
    </header>

    ${summaryHtml}

    <section>
      ${total ? listHtml : `<div class="card"><span class="muted">Nenhum erro recebido.</span></div>`}
    </section>

    <footer>
      relatorio de erros n8n
    </footer>
  </div>
</body>
</html>
`.trim();
}

module.exports = {
  renderHtml,
};
