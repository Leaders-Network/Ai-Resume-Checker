const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function loadPdfTextUtility() {
  const fileName = path.join(__dirname, "..", "lib", "pdf-text.ts")
  const source = fs.readFileSync(fileName, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const loadedModule = { exports: {} }
  const execute = new Function("exports", "require", "module", "__filename", "__dirname", compiled)
  execute(loadedModule.exports, require, loadedModule, fileName, path.dirname(fileName))
  return loadedModule.exports
}

const { formatPdfTextItems } = loadPdfTextUtility()

test("PDF text extraction preserves explicit and visual line boundaries", () => {
  const text = formatPdfTextItems([
    { str: "Ada", transform: [1, 0, 0, 1, 10, 700] },
    { str: "Lovelace", transform: [1, 0, 0, 1, 45, 700], hasEOL: true },
    { str: "Software", transform: [1, 0, 0, 1, 10, 680] },
    { str: "Engineer", transform: [1, 0, 0, 1, 70, 680] },
    { str: "Email:", transform: [1, 0, 0, 1, 10, 660] },
    { str: "ada@example.com", transform: [1, 0, 0, 1, 50, 660] },
  ])

  assert.equal(text, "Ada Lovelace\nSoftware Engineer\nEmail: ada@example.com")
})
