"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Play, Check, Eye, EyeOff } from "lucide-react";
import { decode } from "blurhash";
import { usePlayback } from "../hooks/usePlayback";
import { markAsPlayed, markAsUnplayed } from "../actions/media";
import { OptimizedImage } from "./optimized-image";
import Link from "next/link";

type MediaCardProps = {
  item: BaseItemDto;
  serverUrl: string;
  percentageWatched?: number;
  continueWatching?: boolean;
  showProgress?: boolean;
  resumePosition?: number;
  fullWidth?: boolean;
};

const MAX_BLURHASH_CACHE_SIZE = 256;
const blurhashDataUrlCache = new Map<string, string>();

function cacheBlurDataUrl(blurHash: string, dataUrl: string) {
  if (blurhashDataUrlCache.has(blurHash)) {
    blurhashDataUrlCache.delete(blurHash);
  }

  blurhashDataUrlCache.set(blurHash, dataUrl);

  if (blurhashDataUrlCache.size > MAX_BLURHASH_CACHE_SIZE) {
    const oldestKey = blurhashDataUrlCache.keys().next().value as
      | string
      | undefined;
    if (oldestKey) blurhashDataUrlCache.delete(oldestKey);
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const MediaCard = React.memo(function MediaCard({
  item,
  serverUrl,
  percentageWatched = 0,
  continueWatching = false,
  showProgress = false,
  resumePosition,
  fullWidth = false,
}: MediaCardProps) {
  const { play } = usePlayback();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);
  const [togglingWatched, setTogglingWatched] = useState(false);
  const [isWatchedOverride, setIsWatchedOverride] = useState<boolean | null>(null);

  const itemId = item.Id ?? "";
  const itemType = item.Type;

  const linkHref = useMemo(() => {
    switch (itemType) {
      case "Movie":
        return `/movie/${itemId}`;
      case "Episode":
        return `/episode/${itemId}`;
      case "Season":
        return `/season/${itemId}`;
      case "BoxSet":
        return `/boxset/${itemId}`;
      default:
        return `/series/${itemId}`;
    }
  }, [itemId, itemType]);

  const hasThumb = continueWatching && !!(
    itemType === "Episode"
      ? item.ParentThumbImageTag
      : item.ImageTags?.Thumb
  );

  const imageType: "Thumb" | "Primary" = hasThumb ? "Thumb" : "Primary";
  const imageItemId = useMemo(() => {
    if (itemType === "Episode" && continueWatching) {
      return item.ParentThumbItemId || item.SeriesId || itemId;
    }
    return itemId;
  }, [continueWatching, item.ParentThumbItemId, item.SeriesId, itemId, itemType]);

  const imageTag = hasThumb
    ? (itemType === "Episode" ? item.ParentThumbImageTag : item.ImageTags?.Thumb)
    : item.ImageTags?.[imageType];

  const imageUrl = useMemo(() => {
    if (!serverUrl || !imageItemId) return "";
    const sizeParams = continueWatching
      ? "maxHeight=324&maxWidth=576"
      : "maxHeight=432&maxWidth=288";
    const tagParam = imageTag ? `&tag=${imageTag}` : "";
    return `${serverUrl}/Items/${imageItemId}/Images/${imageType}?${sizeParams}&quality=100${tagParam}`;
  }, [continueWatching, imageItemId, imageType, serverUrl, imageTag]);
  const blurHash = imageTag
    ? (item.ImageBlurHashes?.[imageType]?.[imageTag] ?? "")
    : "";

  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!blurHash) {
      setBlurDataUrl(null);
      return;
    }

    const cachedDataUrl = blurhashDataUrlCache.get(blurHash);
    if (cachedDataUrl) {
      setBlurDataUrl(cachedDataUrl);
      return;
    }

    let cancelled = false;

    try {
      const pixels = decode(blurHash, 32, 32);
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        if (!cancelled) setBlurDataUrl(null);
        return;
      }

      const imageData = ctx.createImageData(32, 32);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);

      const dataUrl = canvas.toDataURL();
      cacheBlurDataUrl(blurHash, dataUrl);
      if (!cancelled) setBlurDataUrl(dataUrl);
    } catch (error) {
      console.error("Error decoding blur hash:", error);
      if (!cancelled) setBlurDataUrl(null);
    }

    return () => {
      cancelled = true;
    };
  }, [blurHash]);

  const progressPercentage = useMemo(() => {
    if (showProgress && resumePosition && item.RunTimeTicks) {
      return (resumePosition / item.RunTimeTicks) * 100;
    }
    return percentageWatched;
  }, [showProgress, resumePosition, item.RunTimeTicks, percentageWatched]);

  const clampedProgressPercentage = useMemo(
    () => clampNumber(progressPercentage, 0, 100),
    [progressPercentage],
  );

  const isWatched = isWatchedOverride ?? (item.UserData?.Played === true);
  const unplayedCount = (itemType === "Series" || itemType === "Season") ? (item.UserData?.UnplayedItemCount ?? 0) : 0;

  const showProgressBar = progressPercentage > 0 && !isWatched;
  const roundedClass = showProgressBar ? "rounded-t-md" : "rounded-md";

  const cardWidthClass = continueWatching
    ? "w-72"
    : fullWidth
      ? "w-full"
      : "w-36";

  const aspectClass = continueWatching ? "aspect-video" : "aspect-[2/3]";

  const canShowImage = Boolean(serverUrl && imageUrl);

  const secondaryText = useMemo(() => {
    if (
      itemType === "Movie" ||
      itemType === "Series" ||
      itemType === "Season"
    ) {
      return item.ProductionYear;
    }
    return item.SeriesName;
  }, [item.ProductionYear, item.SeriesName, itemType]);

  const episodeText = useMemo(() => {
    if (itemType !== "Episode") return "";
    if (item.ParentIndexNumber == null || item.IndexNumber == null) return "";
    return `S${item.ParentIndexNumber} • E${item.IndexNumber}`;
  }, [item.IndexNumber, item.ParentIndexNumber, itemType]);

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (itemType === "BoxSet") return;

      play({
        id: itemId,
        name: item.Name!,
        type: itemType as "Movie" | "Series" | "Episode",
        resumePositionTicks:
          resumePosition || item.UserData?.PlaybackPositionTicks,
      });
    },
    [
      item.Name,
      item.UserData?.PlaybackPositionTicks,
      itemId,
      itemType,
      play,
      resumePosition,
    ],
  );

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleToggleWatched = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!itemId || togglingWatched) return;
      setTogglingWatched(true);
      const newState = !isWatched;
      setIsWatchedOverride(newState);
      try {
        const success = newState
          ? await markAsPlayed(itemId)
          : await markAsUnplayed(itemId);
        if (!success) setIsWatchedOverride(!newState);
      } catch {
        setIsWatchedOverride(!newState);
      } finally {
        setTogglingWatched(false);
      }
    },
    [itemId, isWatched, togglingWatched],
  );

  return (
    <div
      className={`cursor-pointer group overflow-hidden transition select-none ${cardWidthClass}`}
    >
      <div
        className={`relative w-full border rounded-md overflow-hidden active:scale-[0.98] transition ${aspectClass}`}
      >
        <Link href={linkHref} draggable={false} className="block w-full h-full">
          {canShowImage ? (
            <>
              {/* Blur hash placeholder handled internally by OptimizedImage or redundant if strict lazy load preferred.
                  However, OptimizedImage doesn't support BlurHash prop yet.
                  For now, we will use OptimizedImage for the main image loading/error handling 
                  but keep the blurhash div behind it for the "instant" load effect until the image fades in.
              */}
              {blurDataUrl && !imageLoaded && (
                <div
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${roundedClass}`}
                  style={{
                    backgroundImage: `url(${blurDataUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(0px)",
                  }}
                />
              )}
              {/* Actual image */}
              <OptimizedImage
                src={imageUrl}
                alt={item.Name || ""}
                className={`w-full h-full object-cover transition-opacity duration-300 shadow-lg group-hover:shadow-md ${roundedClass}`}
                onLoad={handleImageLoad}
                draggable={false}
              />
            </>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg shadow-lg">
              <div className="text-white/60 text-sm">No Image</div>
            </div>
          )}
        </Link>

        {/* Play button overlay */}
        {itemType !== "BoxSet" && (
          <div
            className={`absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center pointer-events-none ${roundedClass}`}
          >
            <div className="invisible group-hover:visible transition-opacity duration-300 pointer-events-auto flex gap-2">
              <button
                onClick={handlePlayClick}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition active:scale-[0.97] hover:cursor-pointer"
              >
                <Play className="h-6 w-6 text-white fill-white" />
              </button>
              <button
                onClick={handleToggleWatched}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition active:scale-[0.97] hover:cursor-pointer"
                title={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
              >
                {isWatched ? (
                  <EyeOff className="h-6 w-6 text-white" />
                ) : (
                  <Eye className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress bar overlay at bottom of image */}
        {showProgressBar && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 overflow-hidden"
            style={{
              borderBottomLeftRadius: "6px",
              borderBottomRightRadius: "6px",
            }}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${clampedProgressPercentage}%`,
              }}
            ></div>
          </div>
        )}

        {/* Watched checkmark badge */}
        {isWatched && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-primary rounded-full p-1 shadow-lg">
              <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Unplayed episode count badge */}
        {unplayedCount > 0 && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full shadow-lg font-medium">
              {unplayedCount} left
            </div>
          </div>
        )}
      </div>
      <Link href={linkHref} draggable={false}>
        <div className="px-1">
          <div className="mt-2.5 text-sm font-medium text-foreground truncate group-hover:underline">
            {item.Name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {secondaryText}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {episodeText}
          </div>
        </div>
      </Link>
    </div>
  );
});

MediaCard.displayName = "MediaCard";
