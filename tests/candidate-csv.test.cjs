const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function loadCsvUtility() {
  const fileName = path.join(__dirname, "..", "lib", "candidate-csv.ts")
  const source = fs.readFileSync(fileName, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const loadedModule = { exports: {} }
  const execute = new Function("exports", "require", "module", "__filename", "__dirname", compiled)
  execute(loadedModule.exports, require, loadedModule, fileName, path.dirname(fileName))
  return loadedModule.exports
}

const { createCandidateCsv } = loadCsvUtility()

test("CSV candidate name comes from the resume header instead of the filename", () => {
  const csv = createCandidateCsv([{
    fileName: "incorrect-document-name.pdf",
    content: "Ombolaji Ibrahim Software Engineer +234 801 234 5678 ombolaji@example.com",
    matches: ["javascript"],
    score: 82,
  }])

  assert.match(csv, /\r\n"Ombolaji Ibrahim","Software Engineer"/)
  assert.doesNotMatch(csv, /incorrect document name/)
})

test("CSV candidate name supports a labelled name in flattened PDF text", () => {
  const csv = createCandidateCsv([{
    fileName: "resume.pdf",
    content: "Full Name: Ada Lovelace Email: ada@example.com Product Manager",
    matches: [],
    score: 75,
  }])

  assert.match(csv, /\r\n"Ada Lovelace","Product Manager"/)
})
