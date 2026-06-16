"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type CoachPageReadyContextValue = {
  isPageReady: boolean;
  markPageReady: () => void;
};

const CoachPageReadyContext = createContext<CoachPageReadyContextValue | null>(null);

export function CoachPageReadyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <CoachPageReadyState key={pathname ?? ""}>{children}</CoachPageReadyState>;
}

function CoachPageReadyState({ children }: { children: React.ReactNode }) {
  const [isPageReady, setIsPageReady] = useState(false);

  const markPageReady = useCallback(() => {
    setIsPageReady(true);
  }, []);

  const value = useMemo(
    () => ({
      isPageReady,
      markPageReady,
    }),
    [isPageReady, markPageReady],
  );

  return (
    <CoachPageReadyContext.Provider value={value}>
      {children}
    </CoachPageReadyContext.Provider>
  );
}

export function useCoachPageReady(): CoachPageReadyContextValue {
  const context = useContext(CoachPageReadyContext);
  if (!context) {
    throw new Error("useCoachPageReady must be used within CoachPageReadyProvider");
  }
  return context;
}
