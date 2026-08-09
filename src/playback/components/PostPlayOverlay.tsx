"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Play, X } from "lucide-react";

interface PostPlayOverlayProps {
  episodeName: string;
  seriesName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeImageUrl?: string;
  onPlayNow: () => void;
  onCancel: () => void;
}

const COUNTDOWN_SECONDS = 5;

export function PostPlayOverlay({
  episodeName,
  seriesName,
  seasonNumber,
  episodeNumber,
  episodeImageUrl,
  onPlayNow,
  onCancel,
}: PostPlayOverlayProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      onPlayNow();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onPlayNow]);

  const handlePlayNow = useCallback(() => {
    setCountdown(0);
    onPlayNow();
  }, [onPlayNow]);

  return (
    <div className="absolute inset-0 z-80 bg-black/90 flex flex-col items-center justify-center gap-6 px-4">
      <span className="text-sm font-medium tracking-widest uppercase text-white/60">
        Up Next
      </span>

      <div className="flex items-center gap-4">
        {episodeImageUrl && (
          <div className="w-40 h-24 rounded-lg overflow-hidden bg-white/5">
            <img
              src={episodeImageUrl}
              alt={episodeName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-1 max-w-xs">
          {seriesName && (
            <span className="text-sm text-white/50">{seriesName}</span>
          )}
          <h2 className="text-xl font-semibold text-white line-clamp-2">
            {episodeName}
          </h2>
          {seasonNumber && episodeNumber && (
            <span className="text-sm text-white/40">
              S{seasonNumber} E{episodeNumber}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="lg"
          onClick={handlePlayNow}
          className="gap-2"
        >
          <Play className="h-5 w-5 fill-white" />
          Play Now
        </Button>
        <Button variant="ghost" size="lg" onClick={onCancel} className="gap-2">
          <X className="h-5 w-5" />
          Cancel
        </Button>
      </div>

      <span className="text-sm text-white/40">
        Starts in {countdown}...
      </span>
    </div>
  );
}
