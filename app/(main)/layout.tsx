"use client";
import { FullscreenDetector } from "@/src/components/fullscreen-detector";
import { LayoutContent } from "@/src/components/layout-content";
import { useAuth } from "@/src/hooks/useAuth";
import { PlaybackProvider } from "@/src/playback/context/PlaybackProvider";
import { SeerrProvider } from "@/src/contexts/seerr-context";
import { AuthErrorHandler } from "@/src/components/auth-error-handler";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <PlaybackProvider>
      <SeerrProvider>
        <FullscreenDetector />
        <AuthErrorHandler>
          <LayoutContent>{children}</LayoutContent>
        </AuthErrorHandler>
      </SeerrProvider>
    </PlaybackProvider>
  );
}
