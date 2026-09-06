import test from "node:test";
import assert from "node:assert/strict";
import { boundPosition, photoSize, zoomAt } from "../src/utils/girlsDay/photoGeometry.js";
import { storyFilename, preparePhoto } from "../src/utils/girlsDay/imageUtils.js";
import { PHOTO_FRAME, STORY } from "../src/data/girlsDayTemplates.js";

test("portrait, landscape, and square photos always cover the story aperture", () => {
  for (const photo of [{ width: 3024, height: 4032 }, { width: 4032, height: 3024 }, { width: 2000, height: 2000 }]) {
    for (const zoom of [1, 1.5, 3, 4]) {
      const size = photoSize(photo, PHOTO_FRAME, zoom);
      const position = boundPosition({ zoom, x: 100000, y: -100000 }, photo, PHOTO_FRAME);
      assert.ok(size.width >= PHOTO_FRAME.width && size.height >= PHOTO_FRAME.height);
      assert.ok((PHOTO_FRAME.width - size.width) / 2 + position.x <= 0.001);
      assert.ok((PHOTO_FRAME.height - size.height) / 2 + position.y + size.height >= PHOTO_FRAME.height - 0.001);
    }
  }
});

test("zoom stays within its limits and reset covers the frame", () => {
  const photo = { width: 3000, height: 4000 };
  assert.equal(boundPosition({ zoom: 50, x: 0, y: 0 }, photo, PHOTO_FRAME).zoom, 4);
  assert.equal(boundPosition({ zoom: -2, x: 1000, y: 1000 }, photo, PHOTO_FRAME).zoom, 1);
  assert.deepEqual(boundPosition({ zoom: 1, x: 0, y: 0 }, photo, PHOTO_FRAME), { zoom: 1, x: 0, y: 0 });
});

test("pinch keeps a point under the fingers when zooming away from the center", () => {
  const photo = { width: 3000, height: 4000 };
  const origin = { x: 0, y: 0, zoom: 2 };
  const anchor = { x: PHOTO_FRAME.width / 2 + 50, y: PHOTO_FRAME.height / 2 - 40 };
  const next = zoomAt(origin, 3, anchor, photo, PHOTO_FRAME);
  assert.equal(next.x, -25);
  assert.equal(next.y, 20);
});

test("filenames retain Arabic and discard path and control characters", () => {
  assert.equal(storyFilename(" ../Layan <3> "), "MOM8NT-Girls-Day-Layan-3.png");
  assert.equal(storyFilename("ليان"), "MOM8NT-Girls-Day-ليان.png");
  assert.equal(storyFilename("   "), "MOM8NT-Girls-Day.png");
  assert.equal(STORY.width, 1080);
  assert.equal(STORY.height, 1920);
});

test("unsupported and oversized photos are rejected before decoding", async () => {
  await assert.rejects(preparePhoto({ type: "image/svg+xml", name: "image.svg", size: 1 }), { message: "unsupportedImage" });
  await assert.rejects(preparePhoto({ type: "image/jpeg", name: "photo.jpg", size: 33 * 1024 * 1024 }), { message: "imageTooLarge" });
});
