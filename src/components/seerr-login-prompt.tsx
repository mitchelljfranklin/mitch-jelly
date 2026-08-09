"use client";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Loader2, Key } from "lucide-react";
import { seerrLoginWithPassword } from "@/src/actions/seerr";
import { toast } from "sonner";

interface SeerrLoginPromptProps {
  username: string;
  serverUrl: string;
  onSuccess: () => void;
}

export function SeerrLoginPrompt({
  username,
  serverUrl,
  onSuccess,
}: SeerrLoginPromptProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const result = await seerrLoginWithPassword(username, password);
      if (result.success) {
        toast.success("Connected to Seerr");
        onSuccess();
      } else {
        toast.error(result.message || "Authentication failed");
      }
    } catch {
      toast.error("Failed to authenticate with Seerr");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-lg font-poppins flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-500" />
          Seerr Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter your Jellyfin password to access Seerr as{" "}
          <span className="font-medium text-foreground">{username}</span>.
          Your password is not stored — only a session cookie is kept.
        </p>
        <div className="space-y-2">
          <Label htmlFor="seerr-pass">Jellyfin Password</Label>
          <Input
            id="seerr-pass"
            type="password"
            placeholder="Enter your Jellyfin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div className="text-[11px] text-muted-foreground">
          Authenticating against: {serverUrl}
        </div>
        <Button className="w-full" onClick={handleLogin} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          Authenticate
        </Button>
      </CardContent>
    </Card>
  );
}
