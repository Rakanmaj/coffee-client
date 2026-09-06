import { useCallback, useEffect, useRef, useState } from "react";
import { STORY } from "../data/girlsDayTemplates";
import { canvasBlob, storyFilename } from "../utils/girlsDay/imageUtils";

export function useStoryExport(stageRef) {
  const [story, setStory] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const operation = useRef(0);
  const busy = useRef(false);
  useEffect(() => () => { operation.current += 1; }, []);
  useEffect(() => () => { if (story) URL.revokeObjectURL(story.url); }, [story]);

  const generate = useCallback(async (name, drinkId) => {
    if (busy.current || !stageRef.current) return false;
    busy.current = true;
    const id = ++operation.current;
    setExporting(true);
    setError(null);
    let canvas;
    try {
      await document.fonts.ready;
      if (id !== operation.current || !stageRef.current) return false;
      const stage = stageRef.current;
      stage.draw();
      canvas = stage.toCanvas({ pixelRatio: STORY.width / stage.width() });
      // Fractional phone scales can truncate a canvas edge by one pixel.
      if (canvas.width !== STORY.width || canvas.height !== STORY.height) {
        const exact = document.createElement("canvas");
        exact.width = STORY.width;
        exact.height = STORY.height;
        const context = exact.getContext("2d");
        if (!context) throw new Error("exportError");
        context.drawImage(canvas, 0, 0, STORY.width, STORY.height);
        canvas.width = 0;
        canvas.height = 0;
        canvas = exact;
      }
      const blob = await canvasBlob(canvas);
      if (id !== operation.current) return false;
      const file = new File([blob], storyFilename(name), { type: "image/png" });
      setStory({ url: URL.createObjectURL(blob), file, drinkId });
      return true;
    } catch {
      if (id === operation.current) setError("exportError");
      return false;
    } finally {
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      busy.current = false;
      if (id === operation.current) setExporting(false);
    }
  }, [stageRef]);

  return { story, exporting, error, generate };
}
