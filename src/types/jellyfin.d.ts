// types/jellyfin.d.ts
// This file is deprecated. Use @jellyfin/sdk types directly instead.

// Re-export types from the Jellyfin SDK for backward compatibility
export type { BaseItemDto as JellyfinItem } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
export type { UserDto as JellyfinUser } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
export type { MediaSourceInfo } from "@jellyfin/sdk/lib/generated-client/models/media-source-info";
export type { MediaStream } from "@jellyfin/sdk/lib/generated-client/models/media-stream";
export type { BaseItemPerson as PersonInfo } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";

// Import UserDto for the extended type
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";

// Extended type for user with access token
export type JellyfinUserWithToken = UserDto & { AccessToken?: string };
