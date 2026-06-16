import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSession, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockFrom = vi.fn();

  return {
    mockGetSession,
    mockFrom,
    mockSupabase: {
      auth: {
        getSession: (...args: unknown[]) => mockGetSession(...args),
      },
      from: (...args: unknown[]) => mockFrom(...args),
    },
  };
});

vi.mock("./client", () => ({
  supabase: mockSupabase,
}));

type MockQueryResult = {
  data: unknown;
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
};

function createSingleBuilder(result: MockQueryResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function createListBuilder(result: MockQueryResult) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

async function loadDataModule() {
  vi.resetModules();
  return import("./data");
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockFrom.mockReset();
});

describe("supabase admin access guards", () => {
  it("fails support reads explicitly when there is no active admin session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { supabaseSupport } = await loadDataModule();
    const result = await supabaseSupport.listLatest({ limit: 5 });

    expect(result).toEqual({
      ok: false,
      message: "Please sign in again to continue.",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("blocks admin reads when the current session user is not an admin", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
          },
        },
      },
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return createSingleBuilder({
          data: { role: "user" },
          error: null,
        });
      }

      throw new Error(`Unexpected table lookup: ${table}`);
    });

    const { supabaseDisputes } = await loadDataModule();
    const result = await supabaseDisputes.listLatest({ limit: 5 });

    expect(result).toEqual({
      ok: false,
      message: "Your account is not authorized to access the admin portal.",
    });
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("rejects mutations when the supplied actor id does not match the active admin session", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "admin-1",
          },
        },
      },
      error: null,
    });

    const { supabaseSupport } = await loadDataModule();
    const result = await supabaseSupport.updateStatus({
      ticketId: "ticket-1",
      status: "resolved",
      actorUserId: "admin-2",
    });

    expect(result).toEqual({
      ok: false,
      message:
        "Your admin session no longer matches this action. Please sign in again.",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("maps RLS permission errors to the shared admin authorization message", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "admin-1",
          },
        },
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return createSingleBuilder({
          data: { role: "admin" },
          error: null,
        });
      }

      if (table === "support_tickets") {
        return createListBuilder({
          data: null,
          error: {
            code: "42501",
            message: "new row violates row-level security policy",
            details: "",
            hint: "",
          },
        });
      }

      throw new Error(`Unexpected table lookup: ${table}`);
    });

    const { supabaseSupport } = await loadDataModule();
    const result = await supabaseSupport.listLatest({ limit: 5 });

    expect(result).toEqual({
      ok: false,
      message: "Your account is not authorized to access the admin portal.",
    });
  });
});
