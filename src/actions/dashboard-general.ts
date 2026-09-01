import { getConfigurationApi } from "@jellyfin/sdk/lib/utils/api/configuration-api";
import { getLocalizationApi } from "@jellyfin/sdk/lib/utils/api/localization-api";
import type {
  LocalizationOption,
  ServerConfiguration,
} from "@jellyfin/sdk/lib/generated-client/models";
import { createJellyfinApi } from "../lib/utils";
import { getAuthData } from "./utils";
import { isAuthError } from "./media";

export interface DashboardGeneralData {
  configuration: ServerConfiguration | null;
  localizationOptions: LocalizationOption[];
  quickConnectEnabled: boolean;
}

export async function fetchDashboardGeneralData(): Promise<DashboardGeneralData> {
  try {
    const { serverUrl, user } = await getAuthData();
    const api = createJellyfinApi(serverUrl, user.AccessToken);
    if (!user.AccessToken) {
      throw new Error("No access token found");
    }

    const configurationApi = getConfigurationApi(api);
    const localizationApi = getLocalizationApi(api);

    const [configuration, localizationOptions] = await Promise.all([
      configurationApi
        .getConfiguration()
        .then((response) => response.data)
        .catch((err) => {
          console.error(
            "Failed to fetch system configuration for dashboard general.",
          );
          throw err;
        }),
      localizationApi
        .getLocalizationOptions()
        .then((response) => response.data ?? [])
        .catch((err) => {
          console.error("Failed to fetch localization options.");
          throw err;
        }),
    ]);

    return {
      configuration,
      localizationOptions,
      quickConnectEnabled: Boolean(configuration?.QuickConnectAvailable),
    };
  } catch (error) {
    console.error("Failed to fetch general settings:", error);
    if (isAuthError(error)) {
      const authError = new Error(
        "Authentication expired. Please sign in again.",
      );
      (authError as any).isAuthError = true;
      throw authError;
    }
    return {
      configuration: null,
      localizationOptions: [],
      quickConnectEnabled: false,
    };
  }
}

export async function updateDashboardConfiguration(
  configuration: ServerConfiguration,
): Promise<void> {
  try {
    const { serverUrl, user } = await getAuthData();
    const api = createJellyfinApi(serverUrl, user.AccessToken);
    if (!user.AccessToken) {
      throw new Error("No access token found");
    }

    const configurationApi = getConfigurationApi(api);

    await configurationApi.updateConfiguration({
      serverConfiguration: configuration,
    });
  } catch (error) {
    console.error("Failed to update configuration:", error);
    if (isAuthError(error)) {
      const authError = new Error(
        "Authentication expired. Please sign in again.",
      );
      (authError as any).isAuthError = true;
      throw authError;
    }
    throw error;
  }
}
