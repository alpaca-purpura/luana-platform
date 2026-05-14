"use client";

// TODO T-fe-2 polish post-merge: wire real validation endpoint
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

interface ValidateUrlPayload {
  url: string;
}

interface ValidateUrlResult {
  valid: boolean;
  reachable: boolean;
  message?: string;
}

export function useAuthorityValidateUrl() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (payload: ValidateUrlPayload): Promise<ValidateUrlResult> => {
      const token = await getToken();
      const res = await fetch("/api/v1/authority/validate-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al validar URL");
      return res.json() as Promise<ValidateUrlResult>;
    },
  });
}
