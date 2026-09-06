import { useCallback, useEffect, useRef, useState } from "react";
import { preparePhoto } from "../utils/girlsDay/imageUtils";

export function useLocalPhoto() {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const operation = useRef(0);

  useEffect(() => () => { operation.current += 1; }, []);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const select = useCallback(async (file) => {
    if (!file) return false;
    const id = ++operation.current;
    setLoading(true);
    setError(null);
    try {
      const next = await preparePhoto(file);
      if (id !== operation.current) { URL.revokeObjectURL(next.url); return false; }
      setPhoto(next);
      return true;
    } catch (issue) {
      if (id === operation.current) setError(issue.message);
      return false;
    } finally { if (id === operation.current) setLoading(false); }
  }, []);

  const remove = useCallback(() => {
    operation.current += 1;
    setPhoto(null);
    setLoading(false);
    setError(null);
  }, []);

  return { photo, loading, error, select, remove };
}
