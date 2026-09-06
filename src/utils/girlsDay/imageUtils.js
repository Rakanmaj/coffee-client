const MAX_FILE_SIZE = 32 * 1024 * 1024;
const MAX_EDGE = 2560;
const acceptedType = /^image\/(jpeg|png|webp|avif|gif|heic|heif|bmp)$/i;
const acceptedExtension = /\.(jpe?g|png|webp|avif|gif|heic|heif|bmp)$/i;

async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch { /* Safari may support the format through its native image decoder. */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

export function canvasBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("exportError")), type, quality);
  });
}

// The only output is a temporary browser URL. No network, storage, or telemetry.
export async function preparePhoto(file) {
  if (!file || (!acceptedType.test(file.type) && !(file.type === "" && acceptedExtension.test(file.name)))) {
    throw new Error("unsupportedImage");
  }
  if (file.size > MAX_FILE_SIZE) throw new Error("imageTooLarge");
  let source;
  let canvas;
  try {
    source = await decode(file);
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    if (!width || !height || width * height > 80_000_000) throw new Error("imageDimensionsError");
    const ratio = Math.min(1, MAX_EDGE / Math.max(width, height));
    canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("imageDecodeError");
    context.fillStyle = "#FFF9F2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await canvasBlob(canvas, "image/jpeg", 0.94);
    return { url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
  } catch (error) {
    if (error.message === "imageDimensionsError") throw error;
    throw new Error("imageDecodeError");
  } finally {
    source?.close?.();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}

export function storyFilename(name) {
  const safe = name.trim().normalize("NFKC").replace(/[^\p{L}\p{N}\p{M}_ -]/gu, "").replace(/\s+/g, "-").slice(0, 64);
  return `MOM8NT-Girls-Day${safe ? `-${safe}` : ""}.png`;
}
