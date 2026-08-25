import { usePlaybackActionsContext } from "../playback/context/PlaybackActionsContext";
import { logger } from "@/src/lib/logger";
import { fetchMediaDetails, getNextEpisodeForSeries } from "../actions";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export interface PlayOptions {
  id: string;
  name: string;
  type: "Movie" | "Series" | "Episode" | "TvChannel";
  resumePositionTicks?: number;
  selectedVersion?: any;
  audioStreamIndex?: number;
}

export function usePlayback() {
  // Subscribe ONLY to stable actions — never to volatile playbackState.
  // This keeps card components from re-rendering on every timeupdate.
  const manager = usePlaybackActionsContext();

  const play = async (options: PlayOptions) => {
    try {
      let selectedVersion = options.selectedVersion;
      let targetId = options.id;
      let targetName = options.name;
      let targetType = options.type;
      let resumePosition = options.resumePositionTicks;

      if (targetType === "Series") {
        logger.log("Fetching next episode for series...");
        const nextEpisode = await getNextEpisodeForSeries(targetId);
        if (nextEpisode) {
          targetId = nextEpisode.Id!;
          targetType = "Episode";
          targetName =
            nextEpisode.Name || nextEpisode.OriginalTitle || "Episode";
          resumePosition = nextEpisode.UserData?.PlaybackPositionTicks || 0;
        } else {
          throw new Error("No playable episodes found for series.");
        }
      }

      // If no version provided, fetch item details to get media sources
      if (!selectedVersion) {
        logger.log("No version selected, fetching item details...");
        const itemDetails = await fetchMediaDetails(targetId);
        if (
          itemDetails &&
          itemDetails.MediaSources &&
          itemDetails.MediaSources.length > 0
        ) {
          selectedVersion = itemDetails.MediaSources[0]; // Default to first source
          logger.log("Selected default version:", selectedVersion.Name);
        } else {
          throw new Error("No media sources found for item.");
        }
      }

      // Delegate URL generation to manager to handle default audio/subtitle selection
      const item: BaseItemDto = {
        Id: targetId,
        Name: targetName,
        MediaType: targetType as any,
        RunTimeTicks: selectedVersion?.RunTimeTicks,
        MediaSources: selectedVersion ? [selectedVersion] : [],
      };

      await manager.play(item, {
        startPositionTicks: resumePosition,
        mediaSourceId: selectedVersion?.Id,
        audioStreamIndex: options.audioStreamIndex,
      });
    } catch (e) {
      console.error("Failed to start playback", e);
    }
  };

  return {
    play,
  };
}
