import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  StepBack,
  StepForward,
} from "lucide-react";
import { PlaybackContextValue } from "@/src/playback/hooks/usePlaybackManager";
import { formatVideoTime } from "@/src/lib/utils";
import { VideoOSDPlaybackButton } from "./VideoOSDPlaybackButton";

interface VideoOSDTransportProps {
  manager: PlaybackContextValue;
  currentTime: number;
  duration: number;
  paused: boolean;
  muted: boolean;
  volume: number;
  isFullscreen: boolean;
  hasNextEpisode: boolean;
  hasPreviousEpisode: boolean;
  showEpisodeNavigation: boolean;
  toggleFullscreen: () => void;
  onNextEpisode: () => void;
  onPreviousEpisode: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onPlayPause: () => void;
}

export const VideoOSDTransport: React.FC<VideoOSDTransportProps> = ({
  manager,
  currentTime,
  duration,
  paused,
  muted,
  volume,
  isFullscreen,
  toggleFullscreen,
  hasNextEpisode,
  hasPreviousEpisode,
  onNextEpisode,
  onPreviousEpisode,
  showEpisodeNavigation,
  onSeekBack,
  onSeekForward,
  onPlayPause,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 md:gap-6 flex-1">
        {showEpisodeNavigation && (
          <VideoOSDPlaybackButton
            handleClick={onPreviousEpisode}
            Icon={StepBack}
            disabled={!hasPreviousEpisode}
            label="Previous episode"
          />
        )}
        <VideoOSDPlaybackButton handleClick={onSeekBack} Icon={RotateCcw} label="Seek back 10 seconds" />
        <VideoOSDPlaybackButton
          handleClick={onPlayPause}
          Icon={paused ? Play : Pause}
          label={paused ? "Play" : "Pause"}
        />
        <VideoOSDPlaybackButton handleClick={onSeekForward} Icon={RotateCw} label="Seek forward 10 seconds" />
        {showEpisodeNavigation && (
          <VideoOSDPlaybackButton
            handleClick={onNextEpisode}
            Icon={StepForward}
            disabled={!hasNextEpisode}
            label="Next episode"
          />
        )}
        <div className="flex items-center gap-2 ml-2 group/volume">
          <button
            onClick={manager.toggleMute}
            className="text-white/70 hover:text-white transition-colors shrink-0"
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Volume Slider - expands on hover of button or slider */}
          <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out flex items-center">
            <div className="h-1 bg-white/30 rounded-full w-24 relative shrink-0">
              <div
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-100"
                style={{
                  width: `${muted ? 0 : volume}%`,
                }}
              ></div>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => manager.setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-white/60 tracking-wide font-mono">
          <span className="text-white">
            {
              formatVideoTime(
                currentTime * 10000000,
                duration * 10000000,
              ).split(" / ")[0]
            }
          </span>{" "}
          /{" "}
          {
            formatVideoTime(duration * 10000000, duration * 10000000).split(
              " / ",
            )[0]
          }
        </div>

        <div className="w-px h-6 bg-white/10 hidden md:block"></div>

        <button
          onClick={manager.toggleMiniPlayer}
          className="text-white/70 hover:text-white transition-colors hidden md:block"
          title="Picture in Picture"
        >
          <PictureInPicture className="w-5 h-5" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="text-white/70 hover:text-white transition-colors"
          title="Fullscreen"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
