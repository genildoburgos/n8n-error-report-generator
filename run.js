const fs = require("fs");
const path = require("path");
const { buildReport } = require("./lib/report");

const inputPath = path.join(__dirname, "sample-input.json");
const outputPath = path.join(__dirname, "out.html");

const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const result = buildReport(items);

fs.writeFileSync(outputPath, result.html, "utf8");

console.log(`Gerado ${path.basename(outputPath)} com ${result.total} erro(s).`);
