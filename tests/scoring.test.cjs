const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers.cjs");
const { scoreCV } = load("lib/scoring.ts");
test("sample scores reflect six of eight requirements and the supported categories", () => {
  const result = scoreCV("3 years remote javascript typescript react AWS certified", { skills: ["javascript", "typescript", "react", "docker"], experience: ["3-5 years"], location: ["remote"], certification: ["aws certified", "azure certified"] });
  assert.equal(result.score, 75); assert.deepEqual(result.missing, ["docker", "azure certified"]);
  assert.deepEqual(result.categoryScores, { skills: 75, experience: 100, location: 100, certification: 50 });
});
test("empty keywords, case insensitive matches, and dashboard experience patterns", () => {
  const empty = { skills: [], experience: [], location: [], certification: [] };
  assert.equal(scoreCV("text", empty).score, 0);
  for (const [keyword, content] of [["1-3 years", "two years"], ["3-5 years", "3+ years"], ["5+ years", "ten years"], ["0-1 years", "less than one year"]]) assert.equal(scoreCV(content, { ...empty, experience: [keyword] }).score, 100);
  assert.equal(scoreCV("REACT", { ...empty, skills: ["react"] }).score, 100);
});
test("duplicate keyword experience precedence matches existing dashboard", () => {
  const result = scoreCV("3 years", { skills: ["3-5 years"], experience: ["3-5 years"], location: [], certification: [] });
  assert.equal(result.score, 100); assert.equal(result.categoryScores.skills, 0); assert.equal(result.categoryScores.experience, 100);
});
