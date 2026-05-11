import { create } from "zustand";

export type AuthSession = {
  accessToken: string;
  userEmail: string;
  expiresAtMs: number;
};

export type AuthStatus =
  | "authenticated"
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
};

const STORAGE_KEY = "admin-auth-session-v1";

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeNow() {
  return Date.now();
}

function safeRandomToken() {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.randomUUID) {
    return `mock_${cryptoObj.randomUUID()}`;
  }
  return `mock_${safeNow()}_${Math.random().toString(16).slice(2)}`;
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

const bootSession = readSession();

export const useAuthStore = create<AuthState>((set) => ({
  status: bootSession ? "authenticated" : "unauthenticated",
  session: bootSession,
  isSigningIn: false,
  lastMessage: null,
  refreshFromStorage: () => {
    const session = readSession();
    set({
      status: session ? "authenticated" : "unauthenticated",
      session,
    });
  },
  signOut: () => {
    clearSession();
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

    set({ isSigningIn: true, lastMessage: null });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450);
    });

    if (normalizedEmail.includes("locked")) {
      const message =
        "Account is locked. Contact an administrator to regain access.";
      set({
        status: "locked",
        session: null,
        isSigningIn: false,
        lastMessage: message,
      });
      return { ok: false, status: "locked", message };
    }

    if (normalizedEmail.includes("unauthorized")) {
      const message = "You do not have access to this admin portal.";
      set({
        status: "unauthorized",
        session: null,
        isSigningIn: false,
        lastMessage: message,
      });
      return { ok: false, status: "unauthorized", message };
    }

    const expiresAtMs = rememberDevice
      ? safeNow() + 1000 * 60 * 60 * 24 * 14
      : safeNow() + 1000 * 60 * 60 * 2;

    const session: AuthSession = {
      accessToken: safeRandomToken(),
      userEmail: normalizedEmail,
      expiresAtMs,
    };

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

