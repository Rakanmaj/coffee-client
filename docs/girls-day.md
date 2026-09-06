# Girls Day Story Generator

Public route: `/matcha-day`. `/girls-day` is an alias. Both work independently of the drive-through feature flag and require no login. Point a printed QR at `https://YOUR-CLIENT-DOMAIN/matcha-day` after deploying the frontend.

## Privacy and operation

The campaign runs outside the staff session and live-order providers. Photos go directly from the file input to the browser image decoder and a local canvas. There are no photo network requests, backend changes, database changes, analytics calls, or persistent photo storage. Temporary object URLs are revoked when replaced or when the page unmounts. The page retains only one normalized photo and the latest generated story in memory.

The browser applies EXIF orientation. Photos are resized locally to a maximum edge of 2560 pixels. Files over 32 MB and decoded images over 80 megapixels are rejected. HEIC/HEIF works only when the browser can decode that format; a helpful JPG/PNG fallback message is shown otherwise. JPG, PNG, WebP, GIF (first frame), AVIF and BMP are also accepted.

The preview is scaled for the screen. Export uses the Konva stage, never a screenshot, and produces an exact 1080 x 1920 PNG. Preview rounding is normalized at export. The downloaded file is named `MOM8NT-Girls-Day-[name].png`; unsafe filename characters are removed, and Arabic names are preserved.

The story preview and PNG use a text-only footer, without the drink sticker or round logo. Drink selection still changes the story caption and result message. Illustrations remain on the campaign landing screen and drink selector; the round logo remains in the page header.

## Packages

Added `react-konva`, `konva`, and `use-image` for the editor. Added `lucide-react` for accessible, consistent control icons. Reused the existing React, React Router, Framer Motion, Manrope and IBM Plex Sans Arabic setup. The editor is lazy loaded after photo selection.

## Artwork

No additional assets are required to run the feature. Included files:

| File | Purpose |
| --- | --- |
| `public/girls-day/campaign.webp` | Optimized copy of the supplied Girls Day campaign poster |
| `public/girls-day/drinks/matcha-latte.webp` | Matcha Latte illustration on ivory paper |
| `public/girls-day/drinks/matcha-strawberry.webp` | Matcha Strawberry illustration on ivory paper |
| `public/girls-day/templates/pink/preview.svg` | Pink Matcha Girl selector thumbnail |
| `public/girls-day/templates/strawberry/preview.svg` | Strawberry Girl selector thumbnail |
| `public/girls-day/templates/classic/preview.svg` | Classic Matcha Girl selector thumbnail |
| `public/moment-brand/moment-round-logo.webp` | Existing approved logo, reused without alteration |

The two drink illustrations were prepared with the built-in imagegen tool from the supplied poster. Their final backgrounds are ivory, not transparent. The logo asset was not generated or redrawn. Final prompt for each drink: isolate the corresponding whole illustrated cup, preserve its existing drink and branding, remove surrounding campaign elements; replace only the background with flat ivory `#FFF9F2`, with no checkerboard, texture or gradients. Original generated files remain in the Codex generated-images folder. `scripts/prepareGirlsDayAssets.mjs` optimizes explicit source images into the project paths above.

Templates are finished vector canvas designs configured in `src/data/girlsDayTemplates.js`; they do not depend on missing PNG placeholders. To add your own designer-supplied layers later, place **1080 x 1920** files at:

- `public/girls-day/templates/<id>/background.png`
- `public/girls-day/templates/<id>/foreground.png` (transparent photo aperture)
- `public/girls-day/templates/<id>/preview.png`

Set that template's `backgroundImage`, `foregroundImage`, and `thumbnail` URLs in the config. Foreground PNGs render above all canvas content. Keep the photo aperture at x=100, y=410, width=880, height=1070 when keeping the existing design. Optional replacement drink PNGs/WebPs go in `public/girls-day/drinks/`; update their URLs in `src/data/girlsDayDrinks.js`. Current drink illustrations have an approximately 0.78 width/height ratio. Transparent versions can replace them later without changing the upload flow.

## Copy and Arabic

All customer-facing text is in `src/data/girlsDayCopy.js`. Reward copy is configurable there; `girlsDaySettings.rewardEnabled` controls visibility and makes no promise of a specific discount. Add an `ar` entry with `locale: "ar"`, `direction: "rtl"` and the same text keys, then use `girlsDaySettings.language` to select it. The current UI is English; it accepts Arabic names, uses automatic input direction and avoids appending an English possessive suffix to Arabic names. Existing menu item names are untouched.

## Phone checks

1. Open `/matcha-day` on iPhone Safari or Android Chrome. For a local preview on the same Wi-Fi, use the dev server's network address. Use the deployed **HTTPS** address to test native file sharing; an ordinary LAN HTTP address does not support the secure Web Share API.
2. Choose a portrait photo. Drag within the story photo, pinch with two fingers, and adjust the zoom slider. Only the photo should move or zoom; it should always fill its frame. Reset returns to the centered crop.
3. Change all three templates and both drinks. The photo, crop and name should remain. Try a long name, an Arabic name and a blank name. Replace with a landscape photo, then remove and upload again.
4. Tap Create My Story, then Save Image. The PNG should contain the complete artwork and be exactly 1080 x 1920. On iPhone, the visible result also supports touch-and-hold saving to Photos.
5. Tap Share Story. A supported browser opens its native share sheet. Which destination apps appear is controlled by the device. Cancelling is harmless. Unsupported file sharing falls back to a download with instructions for adding it to Instagram yourself. The site does not post to Instagram automatically.
6. Tap Create Another. Existing selections should be retained. Try reduced motion in the phone accessibility settings.

## Focused checks

`node --test tests/girlsDay.test.mjs` checks crop constraints, pinch anchoring, zoom bounds, safe filenames and upload rejection.

`node scripts/checkGirlsDay.mjs [path-to-playwright/index.mjs] [dev-origin]` exercises the real page in installed Microsoft Edge through Playwright, including native touch events via CDP, responsive layouts, local-only requests, PNG dimensions, downloads, and simulated Web Share capability/fallback. It saves screenshots and a sample PNG under the git-ignored `artifacts/girls-day.local/`. Mock sharing verifies the code path, not the operating system's real share destinations.
