import { getApiKeyApi } from "@jellyfin/sdk/lib/utils/api/api-key-api";
import type {
  AuthenticationInfo,
  AuthenticationInfoQueryResult,
} from "@jellyfin/sdk/lib/generated-client/models";
import { createJellyfinApi } from "../lib/utils";
import { getAuthData } from "./utils";
import { isAuthError } from "./media";

export async function fetchApiKeys(): Promise<AuthenticationInfoQueryResult> {
  try {
    const { serverUrl, user } = await getAuthData();
    const api = createJellyfinApi(serverUrl, user.AccessToken);
    if (!user.AccessToken) {
      throw new Error("No access token found");
    }

    const apiKeyApi = getApiKeyApi(api);

    const { data } = await apiKeyApi.getKeys();
    return {
      Items: data.Items ?? [],
      TotalRecordCount: data.TotalRecordCount ?? 0,
      StartIndex: data.StartIndex ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    if (isAuthError(error)) {
      const authError = new Error(
        "Authentication expired. Please sign in again.",
      );
      (authError as any).isAuthError = true;
      throw authError;
    }
    return {
      Items: [],
      TotalRecordCount: 0,
      StartIndex: 0,
    };
  }
}

export function normalizeApiKeys(
  items: AuthenticationInfo[],
): AuthenticationInfo[] {
  return (items ?? []).map((item) => ({
    ...item,
    AccessToken: item.AccessToken ?? "",
    AppName: item.AppName ?? "Unknown",
    AppVersion: item.AppVersion ?? "",
    DeviceName: item.DeviceName ?? "",
    DeviceId: item.DeviceId ?? "",
    UserId: item.UserId ?? "",
    UserName: item.UserName ?? "",
    DateCreated: item.DateCreated ?? "",
    DateLastActivity: item.DateLastActivity ?? "",
    IsActive: Boolean(item.IsActive),
  }));
}

export async function createApiKey(appName: string): Promise<void> {
  try {
    const { serverUrl, user } = await getAuthData();
    const api = createJellyfinApi(serverUrl, user.AccessToken);
    if (!user.AccessToken) {
      throw new Error("No access token found");
    }

    const apiKeyApi = getApiKeyApi(api);

    await apiKeyApi.createKey({ app: appName });
  } catch (error) {
    console.error("Failed to create API key:", error);
    if (isAuthError(error)) {
      const authError = new Error(
        "Authentication expired. Please sign in again.",
      );
      (authError as any).isAuthError = true;
      throw authError;
    }
  }
}

export async function revokeApiKey(key: string): Promise<void> {
  try {
    const { serverUrl, user } = await getAuthData();
    const api = createJellyfinApi(serverUrl, user.AccessToken);
    if (!user.AccessToken) {
      throw new Error("No access token found");
    }

    const apiKeyApi = getApiKeyApi(api);

    await apiKeyApi.revokeKey({ key });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    if (isAuthError(error)) {
      const authError = new Error(
        "Authentication expired. Please sign in again.",
      );
      (authError as any).isAuthError = true;
      throw authError;
    }
  }
}
