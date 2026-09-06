export function downloadStory(story) {
  const anchor = document.createElement("a");
  anchor.href = story.url;
  anchor.download = story.file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function shareStory(story, copy) {
  let canShare = false;
  try { canShare = !!navigator.share && !!navigator.canShare?.({ files: [story.file] }); }
  catch { /* Unsupported file sharing falls back to the same local PNG. */ }
  if (!canShare) {
    downloadStory(story);
    return "fallback";
  }
  try {
    // Called directly from the user's click; no conversion before opening the sheet.
    await navigator.share({ files: [story.file], title: copy.shareTitle, text: copy.shareText });
    return "shared";
  } catch (error) {
    if (error.name === "AbortError") return "cancelled";
    throw error;
  }
}
