const { normalizeErrors } = require("./normalize");
const { buildSummary } = require("./summary");
const { renderHtml } = require("./render");

function buildReport(items) {
  const erros = normalizeErrors(items);
  const { total, modesSorted, msgsSorted } = buildSummary(erros);
  const iso = new Date().toISOString();
  const html = renderHtml({ total, erros, modesSorted, msgsSorted, iso });

  return {
    html,
    total,
    erros,
  };
}

module.exports = {
  buildReport,
};
