"use client";
import {
  fetchResumeItems,
  fetchLibraryItems,
  fetchLiveTVItems,
  fetchNextUpItems,
} from "@/src/actions/media";
import { ItemSortBy, SortOrder, ItemFilter } from "@jellyfin/sdk/lib/generated-client/models";
import { getAuthData, getUserLibraries } from "@/src/actions/utils";
import { useAuthError } from "@/src/hooks/use-auth-error";
import { MediaSection } from "@/src/components/media-section";
import { SearchBar } from "@/src/components/search-component";
import { AuroraBackground } from "@/src/components/aurora-background";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import {
  homeLastVisitedTimeAtom,
  homeServerUrlAtom,
  homeUserAtom,
  homeResumeItemsAtom,
  homeNextupItemsAtom,
  homeLibrariesAtom,
} from "@/src/lib/atoms";
import LoadingSpinner from "@/src/components/loading-spinner";
import { HeroSection } from "@/src/components/hero/hero-section";
import { useRouter } from "next/navigation";
import ErrorWindow from "@/src/components/error-window";

export default function Home() {
  const router = useRouter();

  const [serverUrl, setServerUrl] = useAtom(homeServerUrlAtom);
  const [user, setUser] = useAtom(homeUserAtom);
  const [resumeItems, setResumeItems] = useAtom(homeResumeItemsAtom);
  const [nextupItems, setNextupItems] = useAtom(homeNextupItemsAtom);
  const [libraries, setLibraries] = useAtom(homeLibrariesAtom);
  const [lastVisitedTime, setLastVisitedTime] = useAtom(homeLastVisitedTimeAtom);

  const { handleAuthError } = useAuthError();
  const hasCachedData = libraries.length > 0 && !!(serverUrl && user);
  const [loading, setLoading] = useState<boolean>(!hasCachedData);

  useEffect(() => {
    const now = Date.now();
    // Only refetch if 5 minutes have passed since the page was last visited
    if (now - lastVisitedTime < 300000) {
      setLastVisitedTime(Date.now());
      setLoading(false);
      return;
    }

    if (!hasCachedData) {
      setLoading(true);
    }

    async function fetchData() {
      try {
        // Fire all fetches in parallel — don't block page render on anything except auth
        const authPromise = getAuthData();
        const resumePromise = fetchResumeItems();
        const nextupPromise = fetchNextUpItems();
        const librariesPromise = getUserLibraries().then(async (userLibraries) => {
          const libraryData = await Promise.all(
            userLibraries.map(async (library) => {
              const items =
                library.CollectionType === "livetv"
                  ? (await fetchLiveTVItems(true)).items
                  : (await fetchLibraryItems(
                      { id: library.Id!, collectionType: library.CollectionType },
                      20,
                      0,
                      ItemSortBy.DateCreated,
                      SortOrder.Descending,
                      [ItemFilter.IsUnplayed],
                    )).items;
              return { library, items };
            }),
          );
          return libraryData;
        });

        // Show page as soon as auth resolves (user name, search bar, etc.)
        const authData = await authPromise;
        setServerUrl(authData.serverUrl);
        setUser(authData.user);
        setLoading(false);

        // Resume + Next Up populate as soon as they arrive
        const [resumeItemsResult, nextupItemsResult] = await Promise.all([
          resumePromise,
          nextupPromise,
        ]);
        setResumeItems(resumeItemsResult);
        setNextupItems(
          nextupItemsResult.filter(
            (item) =>
              !resumeItemsResult.some(
                (resumeItem) => resumeItem.Id === item.Id,
              ),
          ),
        );

        // Libraries load in background and populate when ready
        const libraryData = await librariesPromise;
        setLibraries(libraryData);
        setLastVisitedTime(Date.now());
      } catch (error: any) {
        console.error("Failed to load data:", error);

        if (handleAuthError(error)) {
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) return <LoadingSpinner />;

  if (!libraries || serverUrl == null)
    return (
      <ErrorWindow message="Error loading Home Page. Please try again." />
    );

  return (
      <div className="relative px-4 py-3 max-w-full overflow-hidden">
        <AuroraBackground />

        <div className="relative z-99 mb-8">
          <div className="mb-6">
            <SearchBar />
          </div>
        </div>

        <div className="relative z-10 mb-4">
          <h2 className="text-3xl font-semibold text-foreground mb-2 font-poppins">
            Welcome back, {user?.Name}
          </h2>
          <p className="text-muted-foreground mb-6">
            Continue watching or discover something new
          </p>
        </div>

        <HeroSection serverUrl={serverUrl} />

        {resumeItems.length > 0 && (
          <MediaSection
            sectionName="Continue Watching"
            mediaItems={resumeItems}
            serverUrl={serverUrl}
            continueWatching
            hideViewAll
          />
        )}

        {nextupItems.length > 0 && (
          <MediaSection
            sectionName="Next Up"
            mediaItems={nextupItems}
            serverUrl={serverUrl}
            continueWatching
            hideViewAll
          />
        )}

        {libraries.map(({ library, items }) => (
          <MediaSection
            key={library.Id}
            library={library}
            sectionName={library.Name || "Library"}
            mediaItems={items}
            serverUrl={serverUrl}
          />
        ))}
      </div>
  );
}
