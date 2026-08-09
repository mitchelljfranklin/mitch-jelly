"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getSeerrRecentRequests, getSeerrUser } from "@/src/actions/seerr";
import { StoreSeerrData } from "@/src/actions/store/store-seerr-data";
import { getSeerrSession } from "@/src/actions/store/server-actions";
import { SeerrRequestItem } from "@/src/types/seerr-types";
import { getAuthData } from "@/src/actions";

interface SeerrContextType {
  recentRequests: SeerrRequestItem[];
  canManageRequests: boolean;
  loading: boolean;
  isSeerrConnected: boolean;
  setIsSeerrConnected: (connected: boolean) => void;
  needsSeerrLogin: boolean;
  authError: any | null;
  addRequest: (request: SeerrRequestItem) => void;
  removeRequest: (requestId: number) => void;
  serverUrl: string | null;
}

const SeerrContext = createContext<SeerrContextType | undefined>(undefined);

export function SeerrProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isSeerrConnected, setIsSeerrConnected] = useState(false);
  const [needsSeerrLogin, setNeedsSeerrLogin] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<SeerrRequestItem[]>([]);
  const [canManageRequests, setCanManageRequests] = useState(false);
  const [authError, setAuthError] = useState<any | null>(null);

  // Check connection and permissions (Lightweight)

  const checkConnection = useCallback(async () => {
    setAuthError(null);
    try {
      await getAuthData();
      const seerrData = await StoreSeerrData.get();
      if (seerrData && seerrData.serverUrl) {
        if (seerrData.authType === "jellyfin-session") {
          // Per-user mode: check if user has a Seerr session cookie
          const session = await getSeerrSession();
          if (session) {
            setServerUrl(seerrData.serverUrl);
            setIsSeerrConnected(true);
            setNeedsSeerrLogin(false);
            // Verify session is still valid
            try {
              const user = await getSeerrUser();
              if (user) {
                const permissions = user.permissions || 0;
                setCanManageRequests((permissions & 2) !== 0);
              }
            } catch {
              // Session may be expired
              setIsSeerrConnected(false);
              setNeedsSeerrLogin(true);
            }
          } else {
            // No session cookie — show login prompt
            setServerUrl(seerrData.serverUrl);
            setIsSeerrConnected(false);
            setNeedsSeerrLogin(true);
          }
        } else if (
          ((seerrData.authType === "api-key" && seerrData.apiKey) ||
            ((seerrData.authType === "jellyfin-user" ||
              seerrData.authType === "local-user") &&
              seerrData.username &&
              seerrData.password))
        ) {
          setIsSeerrConnected(true);
          setServerUrl(seerrData.serverUrl);
          setNeedsSeerrLogin(false);

        // Fetch user permissions & initial requests
        try {
          const [user, requestsResult] = await Promise.all([
            getSeerrUser(),
            getSeerrRecentRequests(),
          ]);

          if (user) {
            const permissions = user.permissions || 0;
            if ((permissions & 2) !== 0) {
              setCanManageRequests(true);
            } else {
              setCanManageRequests(false);
            }
          }

          if (requestsResult?.results) {
            setRecentRequests(requestsResult.results);
          }
        } catch (e) {
          console.error("Failed to fetch Seerr user info", e);
        }
      } else {
        setIsSeerrConnected(false);
        setServerUrl(null);
        setRecentRequests([]);
        setCanManageRequests(false);
        setNeedsSeerrLogin(false);
      }
      }
    } catch (error: any) {
      console.error("Failed to check Seerr connection", error);
      if (error.isAuthError) {
        setAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const addRequest = useCallback((newRequest: SeerrRequestItem) => {
    setRecentRequests((prev) => {
      const filtered = prev.filter((r) => r.id !== newRequest.id);
      return [newRequest, ...filtered].slice(0, 10);
    });
  }, []);

  const removeRequest = useCallback((requestId: number) => {
    setRecentRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const value = useMemo(() => {
    return {
      recentRequests,
      canManageRequests,
      loading,
      isSeerrConnected,
      needsSeerrLogin,
      authError,
      addRequest,
      removeRequest,
      serverUrl,
      setIsSeerrConnected,
    };
  }, [
    recentRequests,
    canManageRequests,
    loading,
    isSeerrConnected,
    needsSeerrLogin,
    authError,
    addRequest,
    removeRequest,
    serverUrl,
    setIsSeerrConnected,
  ]);

  return (
    <SeerrContext.Provider value={value}>{children}</SeerrContext.Provider>
  );
}

export function useSeerr() {
  const context = useContext(SeerrContext);
  if (context === undefined) {
    throw new Error("useSeerr must be used within a SeerrProvider");
  }
  return context;
}
