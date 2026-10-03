// Uses an existing Chromium DevTools endpoint and its own isolated context.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const origin = process.argv[2] || "http://127.0.0.1:3000";
const debugOrigin = process.argv[3] || "http://127.0.0.1:9222";
class CDP {
  constructor(socket) {
    this.socket = socket; this.id = 0; this.pending = new Map();
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data), pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id); clearTimeout(pending.timer);
      if (message.error) pending.reject(Error(message.error.message)); else pending.resolve(message.result);
    });
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
    return new CDP(socket);
  }
  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error("Timed out: " + method)); }, 20000);
      this.pending.set(id, { resolve, reject, timer }); this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.call("Runtime.evaluate", { expression: typeof expression === "function" ? "(" + expression.toString() + ")()" : expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async key(key) {
    const windowsVirtualKeyCode = { Enter: 13, Escape: 27, ArrowRight: 39 }[key];
    await this.call("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode, ...(key === "Enter" ? { text: "\r" } : {}) });
    await this.call("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode });
  }
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitUntil(page, expression) {
  for (let i = 0; i < 80; i++) { if (await page.evaluate(expression)) return; await pause(100); }
  throw Error("Page state did not become ready: " + expression);
}
(async () => {
  const version = await (await fetch(debugOrigin + "/json/version")).json(), browser = await CDP.connect(version.webSocketDebuggerUrl);
  const { browserContextId } = await browser.call("Target.createBrowserContext");
  let page;
  try {
    const { targetId } = await browser.call("Target.createTarget", { url: "about:blank", browserContextId });
    page = await CDP.connect(debugOrigin.replace("http", "ws") + "/devtools/page/" + targetId);
    await page.call("Page.enable"); await page.call("Runtime.enable");
    const folder = path.join(".next", "verification"); fs.mkdirSync(folder, { recursive: true });
    const reports = [];
    for (const width of [360, 768, 1280]) {
      await page.call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 1024 });
      await page.call("Page.navigate", { url: origin });
      await waitUntil(page, "document.readyState === 'complete' && !!document.querySelector('.billing-options input') && !!document.querySelector('#mobile-links')");
      await page.evaluate("document.fonts.ready.then(() => true)");
      const report = await page.evaluate(() => {
        const visible = e => !!e.getClientRects().length;
        const rect = e => { const r = e.getBoundingClientRect(); return { x:r.x + scrollX, y:r.y + scrollY, width:r.width, height:r.height }; };
        const elements = Array.from(document.querySelectorAll(".plan-panel"));
        return {
          width: innerWidth, viewportAvailable: document.documentElement.clientWidth, documentWidth: document.documentElement.scrollWidth,
          h1Count: document.querySelectorAll("h1").length, title: document.title,
          imagesOrVideo: document.querySelectorAll("img,video").length,
          sampleLabel: document.querySelector(".report-header .section-label").textContent,
          headingOverflow: Array.from(document.querySelectorAll("h1,h2,h3")).filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent),
          smallTargets: Array.from(document.querySelectorAll("a,button,summary")).filter(visible).filter(e => e.getBoundingClientRect().height < 43.5).map(e=>e.textContent || e.getAttribute("aria-label")),
          links: Array.from(document.querySelectorAll("a")).map(e=>e.getAttribute("href")),
          panels: elements.map(rect), professionalFirst: document.querySelector(".plan-professional").getBoundingClientRect().y === Math.min(...elements.map(e=>e.getBoundingClientRect().y)),
          font: getComputedStyle(document.querySelector("h1")).fontFamily,
        };
      });
      assert.ok(report.documentWidth <= report.viewportAvailable, "Horizontal overflow"); assert.equal(report.h1Count, 1);
      const contrast = await page.evaluate(() => {
        const parse = color => { const values = color.match(/[\d.]+/g)?.map(Number) || [0,0,0,0]; if (values.length === 3) values.push(1); return values; };
        const blend = (foreground, background, alpha) => foreground.slice(0,3).map((v,i)=>v*alpha+background[i]*(1-alpha));
        const luminance = color => { const values=color.map(value=>{const s=value/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722; };
        const failures = []; let minimum = Infinity;
        const walker=document.createTreeWalker(document.querySelector(".landing"),NodeFilter.SHOW_TEXT);
        let node;
        while ((node=walker.nextNode())) {
          if (!node.textContent.trim()) continue;
          const element=node.parentElement;
          if (element.closest(".sr-only,script,style") || !element.getClientRects().length) continue;
          const style=getComputedStyle(element);
          if (style.visibility !== "visible") continue;
          const layers=[]; let opacity=1;
          for(let ancestor=element;ancestor;ancestor=ancestor.parentElement){const current=getComputedStyle(ancestor);layers.push(parse(current.backgroundColor));opacity*=Number(current.opacity);}
          let background=[255,255,255];
          for(const layer of layers.reverse())background=blend(layer,background,layer[3]);
          const foreground=parse(style.color), text=blend(foreground,background,foreground[3]*opacity);
          const a=luminance(text),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
          minimum=Math.min(minimum,ratio);
          if(ratio<4.5)failures.push({text:node.textContent.trim(),ratio});
        }
        return { minimum, failures };
      });
      assert.deepEqual(contrast.failures, [], "Text contrast below 4.5:1");
      report.minimumTextContrast = contrast.minimum;
      assert.equal(report.imagesOrVideo, 0); assert.match(report.title, /Leaders CV Checker/);
      assert.match(report.sampleLabel, /fictional example/);
      assert.deepEqual(report.headingOverflow, []); assert.deepEqual(report.smallTargets, []);
      if (width < 1024) assert.equal(report.professionalFirst, true);
      assert.deepEqual(await page.evaluate("Array.from(document.querySelectorAll('.plan-price strong')).map(e=>e.textContent)"), ["₦3,500", "₦7,500", "₦39,500"]);
      await page.evaluate("document.querySelector('.billing-options input[value=monthly]').focus()");
      await page.key("ArrowRight");
      await waitUntil(page, "document.querySelector('.billing-options input[value=annual]').checked && document.querySelector('.plan-price strong').textContent === '₦2,800'");
      const after = await page.evaluate(() => Array.from(document.querySelectorAll(".plan-panel")).map(e=>{const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}));
      assert.deepEqual(after, report.panels, "Pricing panels shifted");
      assert.deepEqual(await page.evaluate("Array.from(document.querySelectorAll('.plan-price strong')).map(e=>e.textContent)"), ["₦2,800", "₦6,000", "₦31,600"]);
      assert.equal(await page.evaluate("!!document.querySelector('a[href=\"/signup?plan=pro&billing=annual\"]')"), true);
      if (width < 1024) {
        await page.evaluate("document.querySelector('.mobile-nav > button').focus()");
        await page.key("Enter");
        await waitUntil(page, "document.querySelector('.mobile-nav > button').getAttribute('aria-expanded') === 'true'");
        await page.key("Escape");
        await waitUntil(page, "document.querySelector('.mobile-nav > button').getAttribute('aria-expanded') === 'false' && document.activeElement === document.querySelector('.mobile-nav > button')");
        await page.evaluate("document.querySelector('.mobile-nav > button').click()");
        await waitUntil(page, "document.querySelector('.mobile-nav > button').getAttribute('aria-expanded') === 'true'");
        await page.evaluate("document.querySelector('#mobile-links a').click()");
        await waitUntil(page, "document.querySelector('.mobile-nav > button').getAttribute('aria-expanded') === 'false'");
      }
      await page.evaluate("document.querySelector('#faq summary').focus()");
      await page.key("Enter");
      assert.equal(await page.evaluate("document.querySelector('#faq details').open"), true);
      await page.evaluate("document.querySelector('#faq details').open=false;window.scrollTo(0,0);document.activeElement.blur()");
      await page.call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      const layout = await page.call("Page.getLayoutMetrics");
      const png = await page.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 } });
      fs.writeFileSync(path.join(folder, "landing-" + width + ".png"), Buffer.from(png.data, "base64"));
      const crops = [{ name: "top", y: 0, height: 900 }, { name: "sample", ...(await page.evaluate(() => { const r=document.querySelector("#sample-report").getBoundingClientRect();return {y:r.y+scrollY,height:Math.min(1100,r.height)}; })) }, { name: "pricing", ...(await page.evaluate(() => { const r=document.querySelector(".pricing-plans").getBoundingClientRect();return {y:r.y+scrollY-30,height:Math.min(1100,r.height+60)}; })) }];
      for (const crop of crops) {
        const screenshot = await page.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x:0, y:crop.y, width, height:crop.height, scale:1 } });
        fs.writeFileSync(path.join(folder, "landing-" + width + "-" + crop.name + ".png"), Buffer.from(screenshot.data, "base64"));
      }
      reports.push({ ...report, annualToggleKeyboard: true, priceLayoutStable: true, faqKeyboard: true, mobileNavigation: width < 1024 ? "passed" : "desktop" });
      console.log("Verified landing at " + width + "px");
    }
    for (const pathname of ["/signup?plan=pro&billing=annual", "/signin?plan=basic&billing=annual"]) {
      await page.call("Page.navigate", { url: origin + pathname });
      await waitUntil(page, "Array.from(document.querySelectorAll('a')).some(e=>(e.getAttribute('href') || '').includes('billing=annual'))");
      console.log("Verified auth continuation: " + pathname);
    }
    const routes = new Set(reports[0].links.filter(href => href?.startsWith("/") && !href.startsWith("//")).map(href => href.split("?")[0]));
    for (const route of routes) assert.equal((await fetch(origin + route)).status, 200, "Broken route: " + route);
    fs.writeFileSync(path.join(folder, "landing-checks.json"), JSON.stringify(reports, null, 2));
  } finally {
    page?.socket.close(); await browser.call("Target.disposeBrowserContext", { browserContextId }).catch(error => console.error("Browser cleanup:", error.message)); browser.socket.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
