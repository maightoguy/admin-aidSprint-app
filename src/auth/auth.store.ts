import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type AuthSession = {
  accessToken: string;
  userEmail: string;
  expiresAtMs: number;
  refreshToken?: string;
  userId?: string;
};

export type AuthStatus =
  | "authenticated"
  | "checking"
  | "unauthenticated"
  | "locked"
  | "unauthorized";

type SignInInput = {
  email: string;
  password: string;
  rememberDevice: boolean;
};

type SignInResult =
  | { ok: true }
  | {
      ok: false;
      status: Extract<AuthStatus, "locked" | "unauthorized" | "unauthenticated">;
      message: string;
    };

type AuthState = {
  status: AuthStatus;
  session: AuthSession | null;
  isSigningIn: boolean;
  lastMessage: string | null;
  signIn: (input: SignInInput) => Promise<SignInResult>;
  signOut: () => void;
  refreshFromStorage: () => void;
  syncSessionFromSupabase: (supabaseSession: Session) => void;
};

const STORAGE_KEY = "admin-auth-session-v1";
const UNAUTHORIZED_MESSAGE =
  "Your account is not authorized to access the admin portal.";

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeNow() {
  return Date.now();
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (
      !parsed ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.userEmail !== "string" ||
      typeof parsed.expiresAtMs !== "number"
    ) {
      return null;
    }

    if (parsed.expiresAtMs <= safeNow()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession, rememberDevice: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(session);
  const primary = rememberDevice ? window.localStorage : window.sessionStorage;
  const secondary = rememberDevice ? window.sessionStorage : window.localStorage;

  primary.setItem(STORAGE_KEY, raw);
  secondary.removeItem(STORAGE_KEY);
}

function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function writeSessionToExistingStorage(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(session);

  if (window.localStorage.getItem(STORAGE_KEY) !== null) {
    window.localStorage.setItem(STORAGE_KEY, raw);
    return;
  }

  if (window.sessionStorage.getItem(STORAGE_KEY) !== null) {
    window.sessionStorage.setItem(STORAGE_KEY, raw);
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, raw);
}

function toAuthSession(supabaseSession: Session): AuthSession {
  const expiresAtMs = supabaseSession.expires_at
    ? supabaseSession.expires_at * 1000
    : safeNow() + 1000 * 60 * 60;

  return {
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    userEmail: supabaseSession.user.email ?? "",
    userId: supabaseSession.user.id,
    expiresAtMs,
  };
}

const bootSession = readSession();

async function tryRestoreSupabaseSession(session: AuthSession | null) {
  if (!supabase || !session?.accessToken || !session.refreshToken) {
    return;
  }

  await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });
}

async function isAdminUser(userId: string) {
  if (!supabase) {
    return {
      ok: false as const,
      message:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  if (userId.trim() === "") {
    return { ok: false as const, message: UNAUTHORIZED_MESSAGE };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    return { ok: false as const, message: UNAUTHORIZED_MESSAGE };
  }

  const role =
    typeof data?.role === "string" ? data.role.trim().toLowerCase() : "";

  if (role !== "admin") {
    return { ok: false as const, message: UNAUTHORIZED_MESSAGE };
  }

  return { ok: true as const };
}

async function restoreAndAuthorizeSession(
  session: AuthSession,
  setState: (patch: Partial<AuthState>) => void,
) {
  if (!supabase) {
    clearSession();
    setState({
      status: "unauthenticated",
      session: null,
      isSigningIn: false,
      lastMessage:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    });
    return;
  }

  try {
    await tryRestoreSupabaseSession(session);

    let userId = session.userId?.trim() ?? "";
    if (userId === "") {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.id) {
        clearSession();
        setState({
          status: "unauthenticated",
          session: null,
          isSigningIn: false,
          lastMessage: "Please sign in again to continue.",
        });
        return;
      }
      userId = data.user.id;
    }

    const adminCheck = await isAdminUser(userId);
    if (!adminCheck.ok) {
      clearSession();
      await supabase.auth.signOut();
      setState({
        status: "unauthorized",
        session: null,
        isSigningIn: false,
        lastMessage: adminCheck.message,
      });
      return;
    }

    const normalizedSession =
      session.userId?.trim() === ""
        ? { ...session, userId }
        : session.userId
          ? session
          : { ...session, userId };

    setState({
      status: "authenticated",
      session: normalizedSession,
      isSigningIn: false,
      lastMessage: null,
    });
  } catch {
    clearSession();
    setState({
      status: "unauthenticated",
      session: null,
      isSigningIn: false,
      lastMessage: "Please sign in again to continue.",
    });
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: bootSession ? "checking" : "unauthenticated",
  session: bootSession,
  isSigningIn: false,
  lastMessage: null,
  syncSessionFromSupabase: (supabaseSession: Session) => {
    const session = toAuthSession(supabaseSession);
    writeSessionToExistingStorage(session);
    set({ status: "authenticated", session, lastMessage: null });
  },
  refreshFromStorage: () => {
    const session = readSession();
    if (!session) {
      set({ status: "unauthenticated", session: null });
      return;
    }

    set({ status: "checking", session, lastMessage: null });
    void restoreAndAuthorizeSession(session, (patch) => set(patch));
  },
  signOut: () => {
    clearSession();
    if (supabase) {
      void supabase.auth.signOut();
    }
    set({
      status: "unauthenticated",
      session: null,
      lastMessage: null,
      isSigningIn: false,
    });
  },
  signIn: async ({ email, password, rememberDevice }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!isEmailLike(normalizedEmail)) {
      const message = "Enter a valid email address.";
      set({
        status: "unauthenticated",
        session: null,
        lastMessage: message,
      });
      return { ok: false, status: "unauthenticated", message };
    }

    if (normalizedPassword.length < 6) {
      const message = "Password must be at least 6 characters.";
      set({
        status: "unauthenticated",
        session: null,
        lastMessage: message,
      });
      return { ok: false, status: "unauthenticated", message };
    }

    if (!supabase) {
      const message =
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
      set({
        status: "unauthenticated",
        session: null,
        isSigningIn: false,
        lastMessage: message,
      });
      return { ok: false, status: "unauthenticated", message };
    }

    set({ isSigningIn: true, lastMessage: null });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error || !data.session) {
      const rawMessage =
        error?.message?.trim() || "Unable to sign in. Try again.";
      const status: Extract<
        AuthStatus,
        "locked" | "unauthenticated" | "unauthorized"
      > = rawMessage.toLowerCase().includes("confirm")
        ? "locked"
        : "unauthenticated";

      set({
        status,
        session: null,
        isSigningIn: false,
        lastMessage: rawMessage,
      });
      return { ok: false, status, message: rawMessage };
    }

    const authSession = data.session;
    const expiresAtMs = authSession.expires_at
      ? authSession.expires_at * 1000
      : safeNow() + 1000 * 60 * 60;

    const session: AuthSession = {
      accessToken: authSession.access_token,
      refreshToken: authSession.refresh_token,
      userEmail: authSession.user.email ?? normalizedEmail,
      userId: authSession.user.id,
      expiresAtMs,
    };

    const adminCheck = await isAdminUser(session.userId ?? "");
    if (!adminCheck.ok) {
      clearSession();
      await supabase.auth.signOut();
      set({
        status: "unauthorized",
        session: null,
        isSigningIn: false,
        lastMessage: adminCheck.message,
      });
      return { ok: false, status: "unauthorized", message: adminCheck.message };
    }

    writeSession(session, rememberDevice);

    set({
      status: "authenticated",
      session,
      isSigningIn: false,
      lastMessage: null,
    });
    return { ok: true };
  },
}));

if (bootSession) {
  void restoreAndAuthorizeSession(bootSession, (patch) =>
    useAuthStore.setState(patch),
  );
}
