"use client";

import { SeerrSection } from "@/src/components/seerr-section";
import { SeerrRequestSection } from "@/src/components/seerr-request-section";
import { useSeerr } from "@/src/contexts/seerr-context";
import { useSeerrDashboard } from "@/src/hooks/use-seerr-dashboard";
import { SeerrSectionSkeleton } from "@/src/components/seerr-section-skeleton";
import { SeerrLoginPrompt } from "@/src/components/seerr-login-prompt";
import { useAuth } from "@/src/hooks/useAuth";

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
    loading: dashboardLoading,
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
