// src/components/providers/AuthProvider.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const setIsLoading = useAuthStore((s) => s.setIsLoading);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [setUser, setIsLoading]);

  return <>{children}</>;
}
