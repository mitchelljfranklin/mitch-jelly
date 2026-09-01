import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Jellyfin, type Api } from "@jellyfin/sdk";
import { getDeviceId } from "./device-id";
import pkg from "@/package.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CLIENT_NAME = "Mitch-Jelly";
export const DEVICE_NAME = "Mitch-Jelly Web Client";

// Create Jellyfin SDK instance with unique device ID
export function createJellyfinInstance() {
  return new Jellyfin({
    clientInfo: {
      name: CLIENT_NAME,
      version: pkg.version,
    },
    deviceInfo: {
      name: DEVICE_NAME,
      id: getDeviceId(),
    },
  });
}

/**
 * Create an SDK Api instance for a server, with the access token applied.
 * Single point of SDK API creation — any future SDK migration only needs
 * to change this function.
 */
export function createJellyfinApi(
  serverUrl: string,
  accessToken?: string | null,
): Api {
  const jellyfinInstance = createJellyfinInstance();
  const api = jellyfinInstance.createApi(serverUrl);
  if (accessToken) {
    api.accessToken = accessToken;
  }
  return api;
}

/**
 * Full-form Jellyfin authorization header for raw fetch/axios calls.
 * 12.0 requires client/device identification; the abbreviated
 * `MediaBrowser Token="..."`-only form omits these.
 */
export function buildMediaBrowserAuthHeader(accessToken?: string | null): string {
  const params = [
    `Client="${CLIENT_NAME}"`,
    `Device="${DEVICE_NAME}"`,
    `DeviceId="${getDeviceId()}"`,
    `Version="${pkg.version}"`,
  ];
  if (accessToken) {
    params.push(`Token="${accessToken}"`);
  }
  return `MediaBrowser ${params.join(", ")}`;
}

export const getMediaDetailsFromName = (name: string) => {
  const resolutionMatch = name.match(/(\d+p|4K|8K)/i);
  const hdrMatch = name.match(/(HDR|DV|Dolby Vision)/i);
  const audioMatch = name.match(
    /(DDP5[.\s]1|TrueHD|DTS-HD MA|DTS-HD|DTS|AAC|AC3|FLAC|Opus)/i,
  );

  const details: string[] = [];

  if (resolutionMatch) details.push(resolutionMatch[1]);

  if (audioMatch) {
    let audioDetail = audioMatch[1];
    if (audioDetail.toLowerCase() === "ddp5 1") {
      audioDetail = "DDP5.1";
    }
    details.push(audioDetail);
  }

  if (hdrMatch) {
    details.push(hdrMatch[1].toUpperCase());
  }

  return details.length > 0 ? details.join(" • ") : "Unknown";
};

export const cutOffText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const formatRuntime = (runTimeTicks?: number) => {
  if (!runTimeTicks) return null;
  const totalMinutes = Math.round(runTimeTicks / 600000000); // Convert from ticks to minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const convertToWebVTT = (trackEvents: {
  TrackEvents: {
    Id: string;
    Text: string;
    StartPositionTicks: number;
    EndPositionTicks: number;
  }[];
}): string => {
  const convertTicksToTime = (ticks: number): string => {
    const totalSeconds = ticks / 10000000;
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toFixed(3).padStart(6, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  let vtt = "WEBVTT\n\n";
  trackEvents.TrackEvents.forEach((event) => {
    const start = convertTicksToTime(event.StartPositionTicks);
    const end = convertTicksToTime(event.EndPositionTicks);
    vtt += `${event.Id}\n${start} --> ${end}\n${event.Text}\n\n`;
  });
  return vtt;
};

// Convert timestamp string (HH:MM:SS or MM:SS) to seconds
export const convertTimestampToSeconds = (timestamp: string): number => {
  const parts = timestamp.split(":");

  if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // If format is not recognized, try to parse as float (assume it's already in seconds)
  const parsed = parseFloat(timestamp);
  return isNaN(parsed) ? 0 : parsed;
};

// Convert ticks to formatted time string (HH:MM:SS or MM:SS)
export const formatPlaybackPosition = (ticks: number): string => {
  const totalSeconds = Math.floor(ticks / 10000000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Consistent video time formatting based on total duration
export const formatVideoTime = (ticks: number, totalTicks: number): string => {
  const totalSeconds = Math.floor(ticks / 10000000);
  const totalDurationSeconds = Math.floor(totalTicks / 10000000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hasHours = totalDurationSeconds >= 3600;

  if (hasHours) {
    // Always show hours if the video is long enough to have them
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
