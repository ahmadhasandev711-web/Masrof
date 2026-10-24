"use client";

import { useCallback, useEffect, useState } from "react";

function newKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function useIdempotencyKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(newKey());
  }, []);
  const regenerate = useCallback(() => {
    setKey(newKey());
  }, []);
  return { idempotencyKey: key, regenerateIdempotencyKey: regenerate };
}
