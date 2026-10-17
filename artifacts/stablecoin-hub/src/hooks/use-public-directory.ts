import { useEffect, useState } from "react";
import { fetchDirectory, type QueryState } from "@/data/academic-directory";
export function usePublicDirectory<T>(kind: "resources" | "researchers") {
  const [result, setResult] = useState<QueryState<T>>({ state: "loading" });
  const [revision, retry] = useState(0);
  useEffect(() => {
    let active = true;
    setResult({ state: "loading" });
    fetchDirectory<T>(kind)
      .then((data) => {
        if (active) setResult({ state: "success", data });
      })
      .catch(() => {
        if (active) setResult({ state: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [kind, revision]);
  return { result, retry: () => retry((n) => n + 1) };
}
