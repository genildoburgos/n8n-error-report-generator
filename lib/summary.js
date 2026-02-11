const { shorten } = require("./helpers");

function buildSummary(erros) {
  const total = erros.length;
  const byMode = new Map();
  const byMsg = new Map();

  for (const erro of erros) {
    byMode.set(erro.mode, (byMode.get(erro.mode) ?? 0) + 1);

    const key = shorten(erro.message, 160);
    byMsg.set(key, (byMsg.get(key) ?? 0) + 1);
  }

  const modesSorted = [...byMode.entries()].sort((a, b) => b[1] - a[1]);
  const msgsSorted = [...byMsg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return {
    total,
    modesSorted,
    msgsSorted,
  };
}

module.exports = {
  buildSummary,
};
