"use client";

import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const ATHLETE_CHAT_ROUTE = "/athlete/chat";

type AthletePageReadyContextValue = {
  isPageReady: boolean;
  markPageReady: () => void;
};

const AthletePageReadyContext = createContext<AthletePageReadyContextValue | null>(null);

export function AthletePageReadyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { accessGateReady } = useAthleteInvitationGate();
  const [isPageReady, setIsPageReady] = useState(false);

  const markPageReady = useCallback(() => {
    setIsPageReady(true);
  }, []);

  useEffect(() => {
    setIsPageReady(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === ATHLETE_CHAT_ROUTE) return;
    if (!accessGateReady) return;
    setIsPageReady(true);
  }, [accessGateReady, pathname]);

  const value = useMemo(
    () => ({
      isPageReady,
      markPageReady,
    }),
    [isPageReady, markPageReady],
  );

  return (
    <AthletePageReadyContext.Provider value={value}>
      {children}
    </AthletePageReadyContext.Provider>
  );
}

export function useAthletePageReady(): AthletePageReadyContextValue {
  const context = useContext(AthletePageReadyContext);
  if (!context) {
    throw new Error("useAthletePageReady must be used within AthletePageReadyProvider");
  }
  return context;
}
