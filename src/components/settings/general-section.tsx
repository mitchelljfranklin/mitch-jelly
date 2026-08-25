"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Pencil, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { appNameAtom } from "@/src/lib/atoms";
import { useAppName } from "@/src/hooks/use-app-name";
import { getUser } from "@/src/actions";

export default function GeneralSection() {
  const [generalOpen, setGeneralOpen] = useState(false);
  const [, setAppName] = useAtom(appNameAtom);
  const { appName, locked } = useAppName();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getUser().then((user) => {
      setIsAdmin(user?.Policy?.IsAdministrator || false);
    }).catch(() => {});
  }, []);

  if (!isAdmin) return null;

  return (
    <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
      <Card className="bg-card/80 backdrop-blur">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-wrap items-start justify-between gap-3 cursor-pointer">
            <CardTitle className="flex items-center gap-2 font-poppins text-lg">
              <Pencil className="h-5 w-5" />
              General
            </CardTitle>
            <button
              type="button"
              aria-expanded={generalOpen}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              {generalOpen ? "Hide" : "Show"}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  generalOpen ? "rotate-180" : "rotate-0",
                )}
              />
            </button>
            <CardDescription className="w-full">
              Customize the application name and branding.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-up data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-down">
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Mitch-Jelly"
                disabled={locked}
                className={locked ? "opacity-70 cursor-not-allowed" : ""}
              />
              {locked ? (
                <p className="text-xs text-muted-foreground">
                  Configured via the <code className="font-mono">APP_NAME</code>{" "}
                  environment variable. To change it, update the variable and
                  restart the server.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This name appears in the sidebar, browser tab, and throughout the interface.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
