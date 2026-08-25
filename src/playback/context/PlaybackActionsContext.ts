import { createContext, useContext } from "react";
import { PlaybackActions } from "../hooks/usePlaybackManager";

export const PlaybackActionsContext = createContext<PlaybackActions | null>(
  null,
);

export function usePlaybackActionsContext() {
  const context = useContext(PlaybackActionsContext);
  if (!context) {
    throw new Error(
      "usePlaybackActionsContext must be used within a PlaybackProvider",
    );
  }
  return context;
}
