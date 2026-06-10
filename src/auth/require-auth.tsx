import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "./auth.store";

function isExpired(expiresAtMs: number | undefined) {
  if (!expiresAtMs) {
    return true;
  }
  return expiresAtMs <= Date.now();
}

export function RequireAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, session, signOut } = useAuthStore();
  const [hasNotifiedExpiry, setHasNotifiedExpiry] = useState(false);

  const expired = useMemo(
    () => isExpired(session?.expiresAtMs),
    [session?.expiresAtMs],
  );

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      return;
    }

    if (expired && !hasNotifiedExpiry) {
      setHasNotifiedExpiry(true);
      signOut();
      toast.error("Session expired", {
        description: "Please sign in again to continue.",
      });
      navigate("/", {
        replace: true,
        state: { reason: "expired", from: location },
      });
      return;
    }

    if (hasNotifiedExpiry) {
      return;
    }

    const remainingMs = session.expiresAtMs - Date.now();
    if (remainingMs <= 0) {
      setHasNotifiedExpiry(true);
      signOut();
      toast.error("Session expired", {
        description: "Please sign in again to continue.",
      });
      navigate("/", {
        replace: true,
        state: { reason: "expired", from: location },
      });
      return;
    }

    const timeout = window.setTimeout(() => {
      setHasNotifiedExpiry(true);
      signOut();
      toast.error("Session expired", {
        description: "Please sign in again to continue.",
      });
      navigate("/", {
        replace: true,
        state: { reason: "expired", from: location },
      });
    }, remainingMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    expired,
    hasNotifiedExpiry,
    location,
    navigate,
    session,
    signOut,
    status,
  ]);

  if (status === "checking") {
    return null;
  }

  if (status === "authenticated" && session && !expired) {
    return <Outlet />;
  }

  return <Navigate to="/" replace state={{ from: location }} />;
}
