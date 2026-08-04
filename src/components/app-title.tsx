"use client";
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import { appNameAtom } from "@/src/lib/atoms";

export function AppTitle() {
  const appName = useAtomValue(appNameAtom);
  const pathname = usePathname();

  useEffect(() => {
    document.title = appName;
  }, [appName, pathname]);

  return null;
}
