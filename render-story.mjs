import { chromium } from "playwright";
import { readFile, mkdir, readdir, access } from "node:fs/promises";

// Story renderer: 1080x1920 (9:16). Same look as feed slides, Instagram safe zones respected.
const CSS = "@import url('https://fonts.googleapis.com/css2?family=Anton&family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@500;700&display=swap');\n*{box-sizing:border-box;margin:0;padding:0}\nbody{width:1080px;height:1350px;overflow:hidden}\n.slide{position:relative;width:1080px;height:1350px;overflow:hidden}\n.dark{background:#0F0F0F;color:#F1E8D8}\n.light{background:#F1E8D8;color:#0F0F0F}\n.tag{position:absolute;left:90px;top:84px;font:700 24px/1 'Inter';letter-spacing:.22em;text-transform:uppercase}\n.dark .tag{color:#D8C7A8} .light .tag{color:#B0141C}\n.foot{position:absolute;left:90px;right:90px;bottom:70px;display:flex;justify-content:space-between;align-items:center;font:700 24px/1 'Inter';letter-spacing:.12em}\n.dark .foot{color:#D8C7A8} .light .foot{color:#5b5245}\n.main{position:absolute;left:90px;right:90px;top:190px;bottom:190px;display:flex;flex-direction:column;justify-content:center;gap:44px;z-index:2}\n.h{font-family:'Anton';font-weight:400;text-transform:uppercase;line-height:.98;letter-spacing:.005em}\n.red{color:#B0141C}\n.dark .red{color:#E0353D}\n.serif{font-family:'Playfair Display';font-weight:700;line-height:1.22}\n.body{font:500 42px/1.42 'Inter'}\n.small{font:500 26px/1.5 'Inter'}\n.circle{position:absolute;border-radius:50%;background:#B0141C;z-index:1}\n.rule{width:120px;height:10px;background:#B0141C}\n".replaceAll("1350px", "1920px");

const pageHtml = (s) => `<!doctype html><html><head><meta charset='utf-8'><style>${CSS}.tag{top:150px}.foot{bottom:200px}.main{top:260px;bottom:360px}.foot span:last-child{display:none}</style></head><body><div class='slide ${s.theme}' id='s'>${s.extra}<div class='tag'>${s.tag}</div><div class='main' id='main'>${s.main}</div><div class='foot'><span>@BRANDWITHAK</span><span></span></div></div></body></html>`;

const exists = (p) => access(p).then(() => true, () => false);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const f of (await readdir("stories")).filter((x) => x.endsWith(".json"))) {
  const name = f.replace(".json", "");
  const slides = JSON.parse(await readFile(`stories/${f}`, "utf8"));
  await mkdir(`images/stories/${name}`, { recursive: true });
  for (const s of slides) {
    const out = `images/stories/${name}/${String(s.n).padStart(2, "0")}.jpg`;
    if (await exists(out)) continue;
    await page.setContent(pageHtml(s), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out, type: "jpeg", quality: 92 });
  }
}
await browser.close();
