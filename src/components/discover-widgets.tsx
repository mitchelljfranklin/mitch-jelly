"use client";

import { SeerrSection } from "@/src/components/seerr-section";
import { SeerrRequestSection } from "@/src/components/seerr-request-section";
import { useSeerr } from "@/src/contexts/seerr-context";
import { useSeerrDashboard } from "@/src/hooks/use-seerr-dashboard";
import { SeerrSectionSkeleton } from "@/src/components/seerr-section-skeleton";
import { SeerrLoginPrompt } from "@/src/components/seerr-login-prompt";
import { useAuth } from "@/src/hooks/useAuth";
import { Button } from "@/src/components/ui/button";
import { RefreshCw, ServerCrash } from "lucide-react";

export function DiscoverWidgets() {
  const {
    recentRequests,
    loading: contextLoading,
    needsSeerrLogin,
    serverUrl,
    setIsSeerrConnected,
  } = useSeerr();
  const { user } = useAuth();
  const {
    recentlyAdded,
    trending,
    popularMovies,
    popularTv,
    error: dashboardError,
    loading: dashboardLoading,
    refreshCallback,
  } = useSeerrDashboard();

  const handleLoginSuccess = () => {
    setIsSeerrConnected(true);
    // Reload the page to refresh all Seerr data with the new session
    window.location.reload();
  };

  if (contextLoading || dashboardLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <SeerrSectionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (needsSeerrLogin && serverUrl && user?.Name) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <SeerrLoginPrompt
          username={user.Name}
          serverUrl={serverUrl}
          onSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const hasContent =
    recentlyAdded.length > 0 ||
    recentRequests.length > 0 ||
    trending.length > 0 ||
    popularMovies.length > 0 ||
    popularTv.length > 0;

  if (!hasContent && dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center">
        <ServerCrash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">
          Couldn&apos;t load Discover content
        </p>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {dashboardError} Check your Seerr connection in Settings and try again.
        </p>
        <Button variant="outline" onClick={() => refreshCallback()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {recentlyAdded.length > 0 && (
        <SeerrSection sectionName="Recently Added" items={recentlyAdded} />
      )}

      {recentRequests.length > 0 && (
        <SeerrRequestSection
          sectionName="Recent Requests"
          items={recentRequests}
        />
      )}

      {trending.length > 0 && (
        <SeerrSection sectionName="Trending" items={trending} />
      )}

      {popularMovies.length > 0 && (
        <SeerrSection sectionName="Popular Movies" items={popularMovies} />
      )}

      {popularTv.length > 0 && (
        <SeerrSection sectionName="Popular TV Shows" items={popularTv} />
      )}
    </div>
  );
}
