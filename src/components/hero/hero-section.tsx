"use client";
import { useEffect, useState, useRef } from "react";
import { useAtom } from "jotai";
import { heroItemsAtom, heroLastVisitedTimeAtom } from "@/src/lib/atoms";
import { fetchHeroItems } from "../../actions/media";
import { HeroCarousel } from "./hero-carousel";
import { Skeleton } from "../ui/skeleton";

interface HeroSectionProps {
  serverUrl: string | null;
}

export function HeroSection({ serverUrl }: HeroSectionProps) {
  const [items, setItems] = useAtom(heroItemsAtom);
  const [lastVisitedTime, setLastVisitedTime] = useAtom(heroLastVisitedTimeAtom);
  const hasCached = items.length > 0;
  const [loading, setLoading] = useState(!hasCached);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!serverUrl) return;
    const thisFetchId = ++fetchIdRef.current;
    const now = Date.now();
    // Only refetch if 5 minutes have passed since the page was last visited
    if (now - lastVisitedTime < 300000) {
      setLastVisitedTime(Date.now());
      setLoading(false);
      return;
    }
    if (!hasCached) {
      setLoading(true);
    }
    async function loadHeroItems() {
      try {
        const heroItems = await fetchHeroItems();
        if (thisFetchId !== fetchIdRef.current) return;
        setItems(heroItems);
        setLastVisitedTime(Date.now());
      } catch (error) {
        console.error("Error loading hero items", error);
      } finally {
        setLoading(false);
      }
    }
    loadHeroItems();
  }, [serverUrl]);

  if (loading) {
    return (
      <div className="w-full h-[65vh] min-h-125 mb-8 relative px-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="w-full mb-8 relative fade-in animate-in duration-500">
      <HeroCarousel items={items} serverUrl={serverUrl!} />
    </div>
  );
}
