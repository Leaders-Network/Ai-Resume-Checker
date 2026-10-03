const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load, fakeDatabase } = require("./helpers.cjs");
function fixture() {
  const db = fakeDatabase({ billingAccounts: { u: { subscription: { activePlan: "Free", resumeLimit: 3, subscriptionDate: null, expirationDate: null, isActive: false } } } });
  const admin = { getAdminDatabase: () => db, getAdminAuth: () => ({ verifyIdToken: async token => { if (token !== "good") throw Error("invalid"); return { uid: "u" }; } }), getAdminFirestore: () => ({ collection: () => ({ doc: () => ({ collection: () => ({ where: () => ({ limit: () => ({ get: async () => ({ empty: true }) }) }) }) }) }) }) };
  const cache = new Map();
  const billing = load("lib/server/billing.ts", { "@/lib/firebase-admin": admin }, cache);
  let uploads = 0, deletes = 0;
  const cloudinary = { config() {}, uploader: {
    upload_stream(options, callback) {
      return { end(buffer) { uploads++; if (buffer.includes(Buffer.from("fail"))) callback(Error("storage failure")); else callback(null, { secure_url: "https://example.test/cv.pdf", public_id: options.folder + "/cv-" + uploads }); } };
    },
    destroy: async () => { deletes++; return { result: "ok" }; },
  } };
  const route = load("app/api/upload-pdf/route.ts", { "@/lib/server/billing": billing, "@/lib/firebase-admin": admin, cloudinary: { v2: cloudinary } }, cache);
  return { route, db, counts: () => ({ uploads, deletes }) };
}
function request(contents, token = "good") {
  const form = new FormData();
  contents.forEach((content, index) => form.append("files", new File([content], "cv-" + index + ".pdf", { type: "application/pdf" })));
  return new Request("https://example.test/api/upload-pdf", { method: "POST", headers: token ? { Authorization: "Bearer " + token } : {}, body: form });
}
test("upload authentication rejects before storage", async () => {
  const { route, counts } = fixture();
  assert.equal((await route.POST(request(["%PDF-1.4"], ""))).status, 401);
  assert.equal((await route.POST(request(["%PDF-1.4"], "bad"))).status, 401);
  assert.equal(counts().uploads, 0);
});
test("excess batches reject atomically before any upload", async () => {
  const { route, db, counts } = fixture();
  assert.equal((await route.POST(request(Array(4).fill("%PDF-1.4")))).status, 409);
  assert.equal(counts().uploads, 0); assert.equal(db.data.billingAccounts.u.subscription.resumeLimit, 3);
});
test("partial storage failure charges only successful PDFs", async () => {
  const { route, db } = fixture();
  const response = await route.POST(request(["%PDF-1.4 success", "%PDF-1.4 fail"]));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.files.length, 1); assert.equal(result.failures.length, 1); assert.equal(result.subscription.resumeLimit, 2);
  assert.equal(db.data.billingAccounts.u.subscription.resumeLimit, 2);
  assert.deepEqual(db.data.billingAccounts.u.reservations, {});
});
test("non-PDF contents do not consume credits", async () => {
  const { route, db, counts } = fixture();
  const result = await (await route.POST(request(["not a PDF"]))).json();
  assert.equal(result.failures.length, 1); assert.equal(result.files.length, 0);
  assert.equal(counts().uploads, 0); assert.equal(db.data.billingAccounts.u.subscription.resumeLimit, 3);
});
test("single-file response preserves previous upload response shape", async () => {
  const { route } = fixture();
  const result = await (await route.POST(request(["%PDF-1.4"]))).json();
  assert.equal(result.url, result.files[0].url); assert.match(result.public_id, /^resumes\/u\//);
});
test("CV deletion checks ownership before deleting another user's file", async () => {
  const { route, counts } = fixture();
  const response = await route.DELETE(new Request("https://example.test", { method: "DELETE", body: JSON.stringify({ token: "good", publicId: "resumes/other/cv" }) }));
  assert.equal(response.status, 404); assert.equal(counts().deletes, 0);
});
test("authenticated batch uploads cannot overspend concurrently", async () => {
  const { route, db, counts } = fixture();
  const results = await Promise.all([route.POST(request(["%PDF-1.4 a", "%PDF-1.4 b"])), route.POST(request(["%PDF-1.4 c", "%PDF-1.4 d"]))]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  assert.equal(counts().uploads, 2); assert.equal(db.data.billingAccounts.u.subscription.resumeLimit, 1);
});
