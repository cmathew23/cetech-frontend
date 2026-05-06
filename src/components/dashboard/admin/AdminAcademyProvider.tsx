"use client";

import {
  fetchMyAcademy,
  type MyAcademyProfile,
} from "@/lib/api/academyAdmin";
import { fetchMyProfile, type ProfileMe } from "@/lib/api/profile";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function formatAdminApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") {
        return `Access denied. ${server}`;
      }
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export type AdminAcademyContextValue = {
  academyProfile: MyAcademyProfile | null;
  profileMe: ProfileMe | null;
  loading: boolean;
  error: string | null;
};

const AdminAcademyContext = createContext<AdminAcademyContextValue | null>(null);

export function AdminAcademyProvider({ children }: { children: ReactNode }) {
  const [academyProfile, setAcademyProfile] =
    useState<MyAcademyProfile | null>(null);
  const [profileMe, setProfileMe] = useState<ProfileMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ctx, profile] = await Promise.all([
          fetchMyAcademy(),
          fetchMyProfile().catch((): null => null),
        ]);
        if (cancelled) return;
        setProfileMe(profile);
        setAcademyProfile(ctx);
      } catch (e) {
        if (!cancelled) {
          setAcademyProfile(null);
          setProfileMe(null);
          setError(
            formatAdminApiError(e, "Could not load academy context."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AdminAcademyContextValue>(
    () => ({
      academyProfile,
      profileMe,
      loading,
      error,
    }),
    [academyProfile, profileMe, loading, error],
  );

  return (
    <AdminAcademyContext.Provider value={value}>
      {children}
    </AdminAcademyContext.Provider>
  );
}

export function useAdminAcademy(): AdminAcademyContextValue {
  const ctx = useContext(AdminAcademyContext);
  if (!ctx) {
    throw new Error("useAdminAcademy must be used within AdminAcademyProvider");
  }
  return ctx;
}
