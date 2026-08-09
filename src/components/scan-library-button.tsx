"use client";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { TextShimmer } from "../components/motion-primitives/text-shimmer";
import { RefreshCw, ScanSearch, Replace, FolderSearch } from "lucide-react";
import { scanLibrary, ScanMode } from "../actions";
import { toast } from "sonner";

interface ScanLibraryButtonProps {
  libraryId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ScanLibraryButton({
  libraryId,
  variant = "outline",
  size = "default",
  className,
}: ScanLibraryButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanLabel, setScanLabel] = useState("");

  const handleScan = async (mode: ScanMode, label: string) => {
    try {
      setIsScanning(true);
      setScanLabel(label);
      await scanLibrary(libraryId, mode);
      toast.success(`${label} started!`);
    } catch (error: any) {
      console.error("Failed to scan library:", error);
      if (error?.isAuthError) {
        toast.error("Authentication expired. Please sign in again.");
      } else {
        toast.error(`Failed to start ${label.toLowerCase()}. Please try again.`);
      }
    } finally {
      setIsScanning(false);
      setScanLabel("");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isScanning}
          variant={variant}
          size={size}
          className={className}
        >
          <RefreshCw
            className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`}
          />
          {isScanning ? (
            <TextShimmer className="text-sm font-medium">
              {`${scanLabel}...`}
            </TextShimmer>
          ) : (
            "Scan Library"
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" side="bottom" align="end">
        <DropdownMenuItem
          onClick={() => handleScan("scan", "Scanning")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FolderSearch className="h-4 w-4" />
          Scan Library Files
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleScan("refresh", "Refreshing Metadata")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ScanSearch className="h-4 w-4" />
          Refresh Metadata
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleScan("replace", "Replacing All Metadata")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Replace className="h-4 w-4" />
          Replace All Metadata
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
