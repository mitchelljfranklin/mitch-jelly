"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.querySelector(
      '[data-slot="sidebar-inset"] > div'
    ) as HTMLElement | null;
    if (!container) return;
    scrollContainerRef.current = container;

    const onScroll = () => {
      setVisible(container.scrollTop > 300);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-border hover:bg-accent"
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
