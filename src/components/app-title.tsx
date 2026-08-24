"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppName } from "@/src/hooks/use-app-name";

export function AppTitle() {
  const { appName } = useAppName();
  const pathname = usePathname();

  useEffect(() => {
    document.title = appName;
  }, [appName, pathname]);

  return null;
}
