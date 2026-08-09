"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getSeerrRecentRequests, getSeerrUser, getSeerrConfig } from "@/src/actions/seerr";
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

  const checkConnection = useCallback(async () => {
    setAuthError(null);
    try {
      await getAuthData();
      const seerrData = await getSeerrConfig();
      if (seerrData && seerrData.serverUrl) {
        if (seerrData.authType === "jellyfin-session") {
          const session = await getSeerrSession();
          setServerUrl(seerrData.serverUrl);
          if (session) {
            setIsSeerrConnected(true);
            setNeedsSeerrLogin(false);
            try {
              const user = await getSeerrUser();
              if (user) {
                setCanManageRequests(((user.permissions || 0) & 2) !== 0);
              }
            } catch {
              setIsSeerrConnected(false);
              setNeedsSeerrLogin(true);
            }
          } else {
            setIsSeerrConnected(false);
            setNeedsSeerrLogin(true);
          }
        } else {
          setIsSeerrConnected(true);
          setServerUrl(seerrData.serverUrl);
          setNeedsSeerrLogin(false);

          try {
            const [user, requestsResult] = await Promise.all([
              getSeerrUser(),
              getSeerrRecentRequests(),
            ]);

            if (user) {
              setCanManageRequests(((user.permissions || 0) & 2) !== 0);
            }

            if (requestsResult?.results) {
              setRecentRequests(requestsResult.results);
            }
          } catch (e) {
            console.error("Failed to fetch Seerr user info", e);
          }
        }
      } else {
        setIsSeerrConnected(false);
        setServerUrl(null);
        setRecentRequests([]);
        setCanManageRequests(false);
        setNeedsSeerrLogin(false);
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
