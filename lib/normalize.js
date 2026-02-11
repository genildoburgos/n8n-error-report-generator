const { pick } = require("./helpers");

function normalizeErrors(items) {
  return items.map((item, index) => {
    const raw = item.json ?? item;
    const execution = raw.execution_data ?? raw;

    const id = pick(execution, "id", pick(raw, "id", `#${index + 1}`));
    const url = pick(execution, "url", "");
    const mode = pick(execution, "mode", "desconhecido");

    const message = pick(execution, "error.message", pick(execution, "error", "Erro sem mensagem"));
    const stack = pick(execution, "error.stack", "");

    return {
      idx: index + 1,
      id,
      url,
      mode,
      message,
      stack,
      raw,
    };
  });
}

module.exports = {
  normalizeErrors,
};
