"use server";

import { StoreSeerrData } from "@/src/actions/store/store-seerr-data";
import type { SeerrAuthData, SeerrAuthType } from "@/src/actions/store/server-actions";

function getEnvConfig(): SeerrAuthData | null {
  const url = process.env.SEERR_SERVER_URL;
  const authType = process.env.SEERR_AUTH_TYPE as SeerrAuthType | undefined;
  if (!url || !authType) return null;

  if (authType === "api-key") {
    const apiKey = process.env.SEERR_API_KEY;
    if (!apiKey) return null;
    return { authType: "api-key", serverUrl: url, apiKey };
  }
  if (authType === "jellyfin-session") {
    return { authType: "jellyfin-session", serverUrl: url };
  }
  const username = process.env.SEERR_USERNAME;
  const password = process.env.SEERR_PASSWORD;
  if (!username || !password) return null;
  return { authType, serverUrl: url, username, password };
}

export async function getSeerrConfig(): Promise<SeerrAuthData | null> {
  return getEnvConfig() || (await StoreSeerrData.get());
}
