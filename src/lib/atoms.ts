import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { JellyfinItem, JellyfinUserWithToken } from "@/src/types/jellyfin";

// Global loading state for dashboard
export const dashboardLoadingAtom = atom(false);

// Global auth error state
export const globalAuthErrorAtom = atom<Error | null>(null);

// Fullscreen state
export const isFullscreenAtom = atom(false);

// Aurora background colors with transition support
export const auroraColorsAtom = atom<string[]>([
  "#AA5CC3",
  "#00A4DC",
  "#AA5CC3",
]);

export const previousAuroraColorsAtom = atom<string[]>([
  "#AA5CC3",
  "#00A4DC",
  "#AA5CC3",
]);

// Derived atom for updating colors with transition
export const updateAuroraColorsAtom = atom(
  null,
  (get, set, newColors: string[]) => {
    const currentColors = get(auroraColorsAtom);
    set(previousAuroraColorsAtom, currentColors);
    set(auroraColorsAtom, newColors);
  },
);

export interface ThemePresetSelection {
  family: string;
  variant: string;
}

const defaultThemeSelection: ThemePresetSelection = {
  family: "Choose theme",
  variant: "Auto",
};

export const themeSelectionAtom = atomWithStorage<ThemePresetSelection>(
  "mitch-jelly-dashboard-theme",
  defaultThemeSelection,
);

// Home page data, persisted to localStorage so returning visitors see instant content
export const homeServerUrlAtom = atomWithStorage<string | null>("mitch-jelly-home-serverUrl", null);
export const homeUserAtom = atomWithStorage<JellyfinUserWithToken | null>("mitch-jelly-home-user", null);
export const homeResumeItemsAtom = atomWithStorage<BaseItemDto[]>("mitch-jelly-home-resume", []);
export const homeNextupItemsAtom = atomWithStorage<JellyfinItem[]>("mitch-jelly-home-nextup", []);
export const homeLibrariesAtom = atomWithStorage<
  {
    library: BaseItemDto;
    items: BaseItemDto[];
  }[]
>("mitch-jelly-home-libraries", []);
export const homeLastVisitedTimeAtom = atomWithStorage<number>("mitch-jelly-home-visitedAt", 0);
export const heroItemsAtom = atomWithStorage<BaseItemDto[]>("mitch-jelly-hero-items", []);
export const heroLastVisitedTimeAtom = atomWithStorage<number>("mitch-jelly-hero-visitedAt", 0);

// Customizable app name
export const appNameAtom = atomWithStorage<string>("mitch-jelly-app-name", "Mitch-Jelly");

// Library page cache — in-memory only (libraries can be too large for localStorage)
export interface LibraryCacheEntry {
  items: BaseItemDto[];
  details: BaseItemDto | null;
  name: string;
  serverUrl: string;
  timestamp: number;
}
export const libraryCacheAtom = atom<Record<string, LibraryCacheEntry>>({});
