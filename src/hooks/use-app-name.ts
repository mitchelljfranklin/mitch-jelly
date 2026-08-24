"use client";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { appNameAtom } from "@/src/lib/atoms";

interface AppConfig {
  defaultServerUrl: string;
  seerrServerUrl: string;
  seerrAuthType: string;
  appName: string;
}

let configPromise: Promise<AppConfig | null> | null = null;

function fetchAppConfig(): Promise<AppConfig | null> {
  if (!configPromise) {
    configPromise = fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return configPromise;
}

/**
 * Resolves the application name with precedence:
 *   APP_NAME environment variable > per-browser Settings atom > "Mitch-Jelly"
 *
 * `locked` is true when the env var is set — the Settings field should
 * render read-only in that case.
 */
export function useAppName() {
  const atomName = useAtomValue(appNameAtom);
  const [envName, setEnvName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAppConfig().then((config) => {
      if (!cancelled && config?.appName) setEnvName(config.appName);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const locked = envName !== null && envName.length > 0;
  return { appName: locked ? envName! : atomName || "Mitch-Jelly", locked };
}
