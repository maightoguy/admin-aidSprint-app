// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Login from "@/login/login";
import { useAuthStore } from "./auth.store";
import { RequireAuth } from "./require-auth";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState({
    status: "unauthenticated",
    session: null,
    isSigningIn: false,
    lastMessage: null,
  });
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState({
    status: "unauthenticated",
    session: null,
    isSigningIn: false,
    lastMessage: null,
  });
});

describe("RequireAuth", () => {
  it("redirects unauthenticated users to login", async () => {
    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/overview" element={<div>Overview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin Portal")).toBeTruthy();
    expect(screen.queryByText("Overview")).toBeNull();
  });

  it("redirects unauthorized users to login", async () => {
    useAuthStore.setState({
      status: "unauthorized",
      session: null,
      isSigningIn: false,
      lastMessage: "Not authorized",
    });

    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/overview" element={<div>Overview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin Portal")).toBeTruthy();
    expect(screen.queryByText("Overview")).toBeNull();
  });

  it("renders protected routes when authenticated", async () => {
    useAuthStore.setState({
      status: "authenticated",
      session: {
        accessToken: "test-token",
        userEmail: "admin@example.com",
        expiresAtMs: Date.now() + 1000 * 60 * 60,
      },
      isSigningIn: false,
      lastMessage: null,
    });

    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/overview" element={<div>Overview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Overview")).toBeTruthy();
  });
});
