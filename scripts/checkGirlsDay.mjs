import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const { chromium } = await import(process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : "playwright");
const origin = process.argv[3] || "http://127.0.0.1:5173";
const output = resolve("artifacts/girls-day.local");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
const writes = [];
const photo = resolve("public/moment-brand/campaign-ruby.webp");

function track(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) || new URL(request.url()).pathname.startsWith("/api/")) writes.push(`${request.method()} ${request.url()}`);
  });
}

async function upload(page) {
  await page.locator('input[type="file"]').setInputFiles(photo);
  await page.locator(".gdCanvas canvas").first().waitFor();
  await page.waitForFunction(() => !document.querySelector(".gdCreateBar button")?.disabled);
}

async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "horizontal overflow");
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", acceptDownloads: true });
  const page = await desktop.newPage();
  track(page);
  await page.goto(`${origin}/matcha-day`);
  await page.getByRole("heading", { name: "Girls Day, your way." }).waitFor();
  await page.screenshot({ path: resolve(output, "desktop-landing.png"), fullPage: true });
  await noOverflow(page);
  await upload(page);
  await page.getByLabel("What's your name?").fill("Layan");
  await page.locator(".gdDrinkChoice").filter({ hasText: "Matcha Strawberry" }).click();
  await page.getByLabel("Photo zoom", { exact: true }).press("Home");
  for (let i = 0; i < 80; i++) await page.getByLabel("Photo zoom", { exact: true }).press("ArrowRight");
  const gesture = page.getByRole("group", { name: /^Story photo/ });
  const box = await gesture.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 22, box.y + box.height / 2 - 20, { steps: 5 });
  await page.mouse.up();
  await page.locator(".gdTemplate").filter({ hasText: "Classic Matcha Girl" }).click();
  assert.equal(await page.getByLabel("Photo zoom", { exact: true }).inputValue(), "1.8");
  assert.equal(await page.getByLabel("What's your name?").inputValue(), "Layan");
  assert.ok(await page.getByRole("radio", { name: "Matcha Strawberry", exact: true }).isChecked());
  await page.screenshot({ path: resolve(output, "desktop-editor.png"), fullPage: true });
  await page.getByRole("button", { name: "Create My Story", exact: true }).click();
  await page.getByRole("heading", { name: "Your Girls Day Story is Ready!" }).waitFor();
  const result = page.getByRole("img", { name: "Your personalized MOM8NT Girls Day story" });
  await result.evaluate((img) => img.decode());
  assert.deepEqual(await result.evaluate((img) => [img.naturalWidth, img.naturalHeight]), [1080, 1920]);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save Image", exact: true }).click();
  const saved = await download;
  assert.equal(saved.suggestedFilename(), "MOM8NT-Girls-Day-Layan.png");
  await saved.saveAs(resolve(output, "story.png"));
  const metadata = await sharp(resolve(output, "story.png")).metadata();
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
  const stats = await sharp(resolve(output, "story.png")).stats();
  assert.ok(stats.channels.some((channel) => channel.stdev > 30), "Export must contain actual image pixels");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", { configurable: true, value: async ({ files }) => {
      window.__girlsDayShared = { count: files.length, type: files[0].type, size: files[0].size };
    } });
  });
  await page.getByRole("button", { name: "Share Story", exact: true }).click();
  await page.waitForFunction(() => window.__girlsDayShared?.size > 0);
  assert.deepEqual(await page.evaluate(() => [window.__girlsDayShared.count, window.__girlsDayShared.type]), [1, "image/png"]);
  await page.evaluate(() => Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false }));
  const fallbackDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Share Story", exact: true }).click();
  await fallbackDownload;
  await page.getByText(/Image download started/).waitFor();
  await page.getByRole("button", { name: "Create Another" }).click();
  await page.getByLabel("What's your name?").waitFor();
  assert.equal(await page.getByLabel("What's your name?").inputValue(), "Layan");
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  assert.ok(await page.getByRole("button", { name: "Create My Story", exact: true }).isDisabled());
  await page.locator('input[type="file"]').setInputFiles({ name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await page.getByRole("alert").waitFor();
  await upload(page);
  console.log("Desktop: crop, retained selections, PNG dimensions, download, share, fallback, replace/remove, bad image passed.");

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const phone = await mobile.newPage();
  track(phone);
  await phone.goto(`${origin}/matcha-day`);
  await phone.getByRole("heading", { name: "Girls Day, your way." }).waitFor();
  await phone.screenshot({ path: resolve(output, "phone-landing.png"), fullPage: true });
  await upload(phone);
  await phone.getByLabel("What's your name?").fill("ليان");
  await phone.locator(".gdTemplate").filter({ hasText: "Pink Matcha Girl" }).click();
  await phone.screenshot({ path: resolve(output, "phone-editor.png"), fullPage: true });
  await phone.getByRole("group", { name: /^Story photo/ }).scrollIntoViewIfNeeded();
  const frame = await phone.locator(".gdPhotoGesture").boundingBox();
  const cdp = await mobile.newCDPSession(phone);
  const x = frame.x + frame.width / 2, y = frame.y + frame.height / 2;
  const touches = (spread) => [{ x: x - spread, y, id: 1 }, { x: x + spread, y, id: 2 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touches(18) });
  for (const spread of [24, 30, 38, 45]) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touches(spread) });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.ok(Number(await phone.getByLabel("Photo zoom", { exact: true }).inputValue()) > 1.5, "pinch should zoom photo");
  assert.equal(await phone.evaluate(() => window.visualViewport.scale), 1, "page must not pinch zoom");
  await phone.getByRole("button", { name: "Reset position", exact: true }).click();
  assert.equal(await phone.getByLabel("Photo zoom", { exact: true }).inputValue(), "1");
  for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024]]) {
    await phone.setViewportSize({ width, height });
    await noOverflow(phone);
  }
  await phone.setViewportSize({ width: 390, height: 844 });
  await phone.getByRole("button", { name: "Create My Story", exact: true }).click();
  await phone.getByRole("heading", { name: "Your Girls Day Story is Ready!" }).waitFor();
  await phone.screenshot({ path: resolve(output, "phone-result.png"), fullPage: true });
  await phone.goto(`${origin}/girls-day`);
  await phone.getByRole("heading", { name: "Girls Day, your way." }).waitFor();
  assert.deepEqual(errors, [], "browser errors");
  assert.deepEqual(writes, [], "campaign should never send photos or make backend requests");
  console.log("Phone: pinch, page zoom prevention, reset, 320–768px layout, Arabic name, export, alias, and local-only requests passed.");
  console.log(`Screenshots and exported PNG: ${output}`);
} finally { await browser.close(); }
