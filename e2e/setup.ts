// Simple in-memory store used by e2e mocks to simulate DB state.
export const testStore = {
  users: [] as any[],
  jobs: [] as any[],
  disputes: [] as any[],
  payments: [] as any[],
  audit: [] as any[],
};

// Optional real Supabase client for true integration tests. To enable, set
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the environment when running
// the tests (see e2e/README.md for details).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let realClient: SupabaseClient | null = null;
let testRunId: string | null = null;

function getRealClient(): SupabaseClient | null {
  if (realClient) return realClient;
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (typeof url === "string" && url && typeof anonKey === "string" && anonKey) {
    realClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return realClient;
}

export async function seedTestData() {
  // Reset in-memory store
  testStore.users.length = 0;
  testStore.jobs.length = 0;
  testStore.disputes.length = 0;
  testStore.payments.length = 0;
  testStore.audit.length = 0;

  // In-memory defaults used by UI-level tests (fast, deterministic)
  testStore.users.push({ id: "emery-torff", name: "Emery Torff", email: "emery@example.com", location: "Test City", totalServicesRequested: 0, dateJoined: "Apr 12, 2023", status: "Active" });
  testStore.users.push({ id: "maren-dokidis", name: "Maren Dokidis", email: "maren@example.com", location: "Test Town", totalServicesRequested: 10, dateJoined: "Apr 12, 2023", status: "Active" });

  // sample payment
  testStore.payments.push({ id: "payment-1", status: "captured", amount: 1000, refunded: false });

  const client = getRealClient();
  if (!client) {
    // Not running against a real Supabase instance — use in-memory store only
    return;
  }

  // If real Supabase is configured, attempt to seed minimal rows.
  // Use a test-run marker so teardown can clean up safely.
  testRunId = `e2e-${Date.now()}`;

  try {
    // Insert a minimal test profile (id chosen to avoid collisions)
    const profile = {
      id: `e2e-admin-${Date.now()}`,
      email: `e2e-admin+${Date.now()}@example.com`,
      full_name: "E2E Admin",
      role: "admin",
      created_at: new Date().toISOString(),
      test_run_id: testRunId,
    } as any;

    await client.from("profiles").insert(profile);

    // Insert a minimal payment row if table exists. Wrap in try/catch to avoid
    // failing tests if schema differs.
    try {
      await client.from("payments").insert({ id: "e2e-payment-1", status: "captured", amount: 1000, created_at: new Date().toISOString(), test_run_id: testRunId });
    } catch (err) {
      // ignore
    }
  } catch (err) {
    // If seeding fails, don't block tests — fallback to in-memory store.
    // The test runner can be configured to retry with a correctly provisioned DB.
    // eslint-disable-next-line no-console
    console.warn("E2E: failed to seed real Supabase instance:", err);
  }
}

export async function teardownTestData() {
  // Clear in-memory store
  testStore.users.length = 0;
  testStore.jobs.length = 0;
  testStore.disputes.length = 0;
  testStore.payments.length = 0;
  testStore.audit.length = 0;

  const client = getRealClient();
  if (!client || !testRunId) return;

  try {
    // Delete rows with `test_run_id` marker where supported. Wrap in try/catch
    // so teardown is best-effort and doesn't block the test runner.
    try {
      await client.from("payments").delete().eq("test_run_id", testRunId);
    } catch (err) {
      // ignore
    }
    try {
      await client.from("profiles").delete().eq("test_run_id", testRunId);
    } catch (err) {
      // ignore
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("E2E: failed to teardown real Supabase test data:", err);
  }
}

// expose globally for tests
(globalThis as any).__E2E_TEST_STORE__ = testStore;
