"use client";

import { useState, useCallback, useEffect } from "react";
import { getSeerrDiscovery } from "@/src/actions/seerr";
import { SeerrMediaItem } from "@/src/types/seerr-types";
import { useSeerr } from "@/src/contexts/seerr-context";

export function useSeerrDashboard() {
  const { isSeerrConnected } = useSeerr();
  const [loading, setLoading] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<SeerrMediaItem[]>([]);
  const [trending, setTrending] = useState<SeerrMediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<SeerrMediaItem[]>([]);
  const [popularTv, setPopularTv] = useState<SeerrMediaItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!isSeerrConnected) return;

    setLoading(true);
    try {
      const data = await getSeerrDiscovery();
      if (data) {
        if (data.recent?.results) setRecentlyAdded(data.recent.results);
        if (data.trending?.results) setTrending(data.trending.results);
        if (data.popularMovies?.results) setPopularMovies(data.popularMovies.results);
        if (data.popularTv?.results) setPopularTv(data.popularTv.results);
      }
    } catch (error) {
      console.error("Failed to fetch Seerr dashboard content", error);
    } finally {
      setLoading(false);
    }
  }, [isSeerrConnected]);

  // Initial fetch on mount if connected
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    recentlyAdded,
    trending,
    popularMovies,
    popularTv,
    refreshCallback: fetchDashboardData,
  };
}
