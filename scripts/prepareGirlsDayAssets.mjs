import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Explicit input paths keep campaign preparation separate from customer photos.
const [theme, latte, strawberry] = process.argv.slice(2);
if (!theme || !latte || !strawberry) throw new Error("Provide campaign, latte, and strawberry image paths.");
const output = resolve("public/girls-day");
await mkdir(resolve(output, "drinks"), { recursive: true });
await sharp(theme).resize({ width: 1055, withoutEnlargement: true }).webp({ quality: 85 }).toFile(resolve(output, "campaign.webp"));
await sharp(latte).resize({ width: 620, withoutEnlargement: true }).webp({ quality: 90 }).toFile(resolve(output, "drinks/matcha-latte.webp"));
await sharp(strawberry).resize({ width: 620, withoutEnlargement: true }).webp({ quality: 90 }).toFile(resolve(output, "drinks/matcha-strawberry.webp"));
console.log("Girls Day campaign assets prepared.");
