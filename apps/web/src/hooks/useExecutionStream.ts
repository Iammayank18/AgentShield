"use client";
import { useEffect } from "react";
import { useExecutionStore } from "@/stores/execution.store";

export function useExecutionStream(executionId: string | null) {
  const processEvent = useExecutionStore((s) => s.processEvent);
  const setStreamStatus = useExecutionStore((s) => s.setStreamStatus);

  useEffect(() => {
    if (!executionId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const es = new EventSource(`${apiUrl}/agent/stream/${executionId}`);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        processEvent(event);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setStreamStatus("error");
      es.close();
    };

    return () => es.close();
  }, [executionId, processEvent, setStreamStatus]);
}
