"use client";
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { appNameAtom } from "@/src/lib/atoms";

export function AppTitle() {
  const appName = useAtomValue(appNameAtom);

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  return null;
}
