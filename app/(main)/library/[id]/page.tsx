"use client";
import { fetchLibraryItems, getLibraryById } from "@/src/actions";
import { getAuthData } from "@/src/actions/utils";
import { LibraryMediaList } from "@/src/components/library-media-list";
import { SearchBar } from "@/src/components/search-component";
import { ScanLibraryButton } from "@/src/components/scan-library-button";
import { AuroraBackground } from "@/src/components/aurora-background";
import { useEffect, useState, useRef } from "react";
import { useAtom } from "jotai";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useParams } from "next/navigation";
import ErrorWindow from "@/src/components/error-window";
import { useAuthError } from "@/src/hooks/use-auth-error";
import { libraryCacheAtom } from "@/src/lib/atoms";

const PAGE_SIZE = 200;
const CACHE_TTL = 300000; // 5 minutes

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 auto-rows-max">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="w-full">
          <Skeleton className="aspect-[2/3] w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 mt-2.5" />
          <Skeleton className="h-3 w-1/2 mt-1" />
        </div>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const { id } = useParams<{ id: string }>();

  const [libraryDetails, setLibraryDetails] = useState<BaseItemDto | null>(null);
  const [libraryItems, setLibraryItems] = useState<BaseItemDto[]>([]);
  const [libraryName, setLibraryName] = useState<string>("Library");
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const { handleAuthError } = useAuthError();
  const fetchIdRef = useRef(0);
  const [cache, setCache] = useAtom(libraryCacheAtom);

  useEffect(() => {
    if (!id?.trim()) return;

    // Check cache for this library
    const cached = cache[id];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Restore cached data immediately — no API calls needed
      setLibraryDetails(cached.details);
      setLibraryItems(cached.items);
      setLibraryName(cached.name);
      setServerUrl(cached.serverUrl);
      setLoading(false);
      return;
    }

    const thisFetchId = ++fetchIdRef.current;

    async function fetchLibraryData() {
      if (!id?.trim()) return;

      try {
        const authData = await getAuthData();
        setServerUrl(authData.serverUrl);

        setLoading(true);
        setLoadingProgress("");

        const [details, countResult] = await Promise.all([
          getLibraryById(id),
          fetchLibraryItems({ id }, 1),
        ]);

        if (!details || !countResult || thisFetchId !== fetchIdRef.current) return;

        setLibraryDetails(details);
        setLibraryName(details.Name || "Library");

        const totalCount = countResult.totalRecordCount;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        let accumulated: BaseItemDto[] = [];

        for (let page = 1; page <= totalPages; page++) {
          if (thisFetchId !== fetchIdRef.current) return;
          setLoadingProgress(`Loading ${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} items...`);

          const result = await fetchLibraryItems(
            { id, collectionType: details.CollectionType },
            PAGE_SIZE,
            (page - 1) * PAGE_SIZE,
          );

          if (thisFetchId !== fetchIdRef.current) return;

          accumulated = [...accumulated, ...result.items];
          setLibraryItems(accumulated);

          if (page === 1) setLoading(false);
        }

        if (thisFetchId === fetchIdRef.current) {
          setLoadingProgress("");
          // Store in cache for instant revisits
          setCache((prev) => ({
            ...prev,
            [id]: {
              items: accumulated,
              details,
              name: details.Name || "Library",
              serverUrl: authData.serverUrl,
              timestamp: Date.now(),
            },
          }));
        }
      } catch (err: any) {
        console.error(err);
        if (handleAuthError(err)) return;
        if (thisFetchId === fetchIdRef.current) {
          setLoading(false);
          setLoadingProgress("");
        }
      }
    }

    fetchLibraryData();
  }, [id]);

  if (!libraryDetails) {
    if (loading) {
      return (
        <div className="relative px-4 py-3 max-w-full overflow-hidden">
          <AuroraBackground />
          <div className="relative z-10">
            <div className="mb-8">
              <Skeleton className="h-10 w-48 mb-4" />
              <Skeleton className="h-8 w-96" />
            </div>
            <SkeletonGrid />
          </div>
        </div>
      );
    }
    return <ErrorWindow message="Error loading Library. Please try again." />;
  }

  if (id == null || serverUrl == null)
    return <ErrorWindow message="Error loading Library. Please try again." />;

  return (
    <div className="relative px-4 py-3 max-w-full overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10">
        <div className="relative z-99 mb-8">
          <div className="mb-6">
            <SearchBar />
          </div>
        </div>
        {loadingProgress && (
          <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {loadingProgress}
          </div>
        )}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-semibold text-foreground font-poppins">
              {libraryName}
            </h2>
            <ScanLibraryButton libraryId={id} />
          </div>
          <span className="font-mono text-muted-foreground">
            {libraryItems.length} items
          </span>
        </div>
        <LibraryMediaList mediaItems={libraryItems} serverUrl={serverUrl} />
      </div>
    </div>
  );
}
