import { useEffect, useState } from "react";
import type { AutomationAction } from "../api/mockApi";
import { getAutomations } from "../api/mockApi";

export const useAutomations = () => {
  const [data, setData] = useState<AutomationAction[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getAutomations();
        if (mounted) setData(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading };
};
