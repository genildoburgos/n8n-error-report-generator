const { buildReport } = require("./lib/report");

const items = $input.all();
const result = buildReport(items);

return [{
  json: result,
}];
