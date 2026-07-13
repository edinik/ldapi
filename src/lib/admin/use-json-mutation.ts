"use client";

import { useState } from "react";
import { requestJson } from "./json-mutation";

export function useJsonMutation() {
  const [pending, setPending] = useState(false);

  async function mutate(url: string, method: "POST" | "PUT", body: unknown) {
    setPending(true);
    try {
      return await requestJson(url, { method, body });
    } finally {
      setPending(false);
    }
  }

  return { pending, mutate };
}
