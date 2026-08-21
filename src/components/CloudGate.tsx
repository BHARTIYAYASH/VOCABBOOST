import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { pullCloudState } from "../lib/cloudSync";

/**
 * Bridges auth ↔ store: on sign-in, pulls the user's cloud state once
 * and merges it into the app (cloud wins; local AI/notification prefs stay).
 */
export function CloudGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { state, dispatch } = useStore();
  const [pulled, setPulled] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user?.id || pulled === user.id) return;
    setPulled(user.id);
    setSyncing(true);
    pullCloudState(user.id)
      .then((payload) => dispatch({ type: "hydrateCloud", payload, userId: user.id }))
      .catch(console.error)
      .finally(() => setSyncing(false));
  }, [user?.id, pulled, dispatch]);

  if (syncing && !state.onboarded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-swan border-t-feather rounded-full animate-spin" />
        <p className="text-wolf font-extrabold text-sm">Syncing your progress…</p>
      </div>
    );
  }

  return <>{children}</>;
}
