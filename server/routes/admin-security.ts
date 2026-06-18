import crypto from "node:crypto";
import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function getUserIdFromAccessToken(accessToken: string) {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function createAuthedSupabaseClient(accessToken: string) {
  const url = getEnv("VITE_SUPABASE_URL");
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function generateRecoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(12);
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars
    .slice(8, 12)
    .join("")}`;
}

function hashRecoveryCode(params: { userId: string; code: string }) {
  return crypto
    .createHash("sha256")
    .update(`${params.userId}:${params.code}`)
    .digest("hex");
}

function getAccessTokenFromRequest(req: Parameters<RequestHandler>[0]) {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header) {
    return null;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

const generateSchema = z.object({
  count: z.number().int().min(1).max(20).optional(),
});

export const handleGenerateRecoveryCodes: RequestHandler = async (req, res) => {
  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) {
    res.status(401).json({ error: "Authorization token is required." });
    return;
  }

  const userId = getUserIdFromAccessToken(accessToken);
  if (!userId) {
    res.status(401).json({ error: "Invalid access token." });
    return;
  }

  const parsed = generateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  const count = parsed.data.count ?? 10;
  const client = createAuthedSupabaseClient(accessToken);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role =
    typeof profile?.role === "string" ? profile.role.trim().toLowerCase() : "";
  if (profileError || role !== "admin") {
    res.status(403).json({ error: "Not authorized." });
    return;
  }

  const codes = Array.from({ length: count }, () => generateRecoveryCode());
  const batchId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const { error: deleteError } = await client
    .from("admin_mfa_recovery_codes")
    .delete()
    .eq("admin_user_id", userId);

  if (deleteError) {
    res.status(400).json({ error: deleteError.message });
    return;
  }

  const inserts = codes.map((code) => ({
    admin_user_id: userId,
    code_hash: hashRecoveryCode({ userId, code }),
    metadata: { batch_id: batchId },
  }));

  const { error: insertError } = await client
    .from("admin_mfa_recovery_codes")
    .insert(inserts);

  if (insertError) {
    res.status(400).json({ error: insertError.message });
    return;
  }

  await client.from("admin_security_settings").upsert(
    {
      admin_user_id: userId,
      recovery_codes_generated_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "admin_user_id" },
  );

  await client.from("admin_security_events").insert({
    admin_user_id: userId,
    actor_id: userId,
    action: "recovery_codes_generated",
    reason: "",
    metadata: { count, batch_id: batchId },
  });

  res.status(200).json({ codes });
};

const verifySchema = z.object({
  code: z.string().min(1),
});

export const handleVerifyRecoveryCode: RequestHandler = async (req, res) => {
  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) {
    res.status(401).json({ ok: false, error: "Authorization token is required." });
    return;
  }

  const userId = getUserIdFromAccessToken(accessToken);
  if (!userId) {
    res.status(401).json({ ok: false, error: "Invalid access token." });
    return;
  }

  const parsed = verifySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid request body." });
    return;
  }

  const code = parsed.data.code.trim();
  const codeHash = hashRecoveryCode({ userId, code });
  const client = createAuthedSupabaseClient(accessToken);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role =
    typeof profile?.role === "string" ? profile.role.trim().toLowerCase() : "";
  if (profileError || role !== "admin") {
    res.status(403).json({ ok: false, error: "Not authorized." });
    return;
  }

  const { data: row, error: matchError } = await client
    .from("admin_mfa_recovery_codes")
    .select("id")
    .eq("admin_user_id", userId)
    .eq("code_hash", codeHash)
    .is("consumed_at", null)
    .maybeSingle();

  if (matchError) {
    res.status(400).json({ ok: false, error: matchError.message });
    return;
  }

  if (!row?.id) {
    res.status(400).json({ ok: false, error: "Recovery code is invalid or already used." });
    return;
  }

  const nowIso = new Date().toISOString();
  const ip = typeof req.ip === "string" ? req.ip : null;

  const { error: updateError } = await client
    .from("admin_mfa_recovery_codes")
    .update({
      consumed_at: nowIso,
      consumed_by_ip: ip,
    })
    .eq("id", row.id);

  if (updateError) {
    res.status(400).json({ ok: false, error: updateError.message });
    return;
  }

  await client.from("admin_security_events").insert({
    admin_user_id: userId,
    actor_id: userId,
    action: "recovery_code_used",
    reason: "",
    metadata: { code_id: row.id },
  });

  res.status(200).json({ ok: true });
};

