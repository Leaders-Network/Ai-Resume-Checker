const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
function load(relative, mocks = {}, cache = new Map()) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const fallback = createRequire(filename);
  const localRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      let resolved = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      if (!path.extname(resolved)) resolved += ".ts";
      return load(path.relative(root, resolved), mocks, cache);
    }
    return fallback(name);
  };
  new Function("require", "module", "exports", source)(localRequire, module, module.exports);
  return module.exports;
}
function fakeDatabase(initial = {}) {
  const data = structuredClone(initial), locks = new Map();
  const read = key => key.split("/").reduce((value, part) => value?.[part], data) ?? null;
  const write = (key, value) => {
    const parts = key.split("/"); let parent = data;
    for (const part of parts.slice(0, -1)) parent = parent[part] ??= {};
    parent[parts.at(-1)] = structuredClone(value);
  };
  const snapshot = value => ({ exists: () => value != null, val: () => structuredClone(value) });
  return { data, ref(key) {
    return { get: async () => snapshot(read(key)), set: async value => write(key, value),
      transaction(update) {
        const operation = (locks.get(key) ?? Promise.resolve()).then(() => {
          // Retry against the same committed snapshot, as the SDK may do.
          update(structuredClone(read(key)));
          const result = update(structuredClone(read(key)));
          if (result === undefined) return { committed: false, snapshot: snapshot(read(key)) };
          write(key, result); return { committed: true, snapshot: snapshot(result) };
        });
        locks.set(key, operation.catch(() => {})); return operation;
      } };
  } };
}
module.exports = { load, fakeDatabase };
