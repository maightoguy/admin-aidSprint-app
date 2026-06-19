/**
 * Evidence file handling helpers for disputes
 * - Refresh signed URLs for evidence files
 * - Validate file types
 * - Handle evidence metadata
 */

import { supabase } from "./client";
import type { SupabaseResult } from "./data";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateEvidenceFile(file: File): SupabaseResult<void> {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      ok: false,
      message: `File type "${file.type}" is not allowed. Supported: images, PDF, Word, plain text.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: `File exceeds maximum size of ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB.`,
    };
  }

  return { ok: true, data: undefined };
}

/**
 * Generate a fresh signed URL for an evidence file
 * Use when displaying evidence or when existing signed URL may have expired
 */
export async function getEvidenceFileUrl(params: {
  storagePath: string;
  bucketName?: string;
  expiresInSeconds?: number;
}): Promise<SupabaseResult<string>> {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured.",
    };
  }

  const bucket = (params.bucketName || process.env.VITE_SUPABASE_ADMIN_DISPUTES_BUCKET || "admin-disputes").trim();
  const expiresIn = params.expiresInSeconds ?? 60 * 60 * 24; // 24 hours default

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(params.storagePath, expiresIn);

    if (error) {
      return {
        ok: false,
        message: error.message || "Could not generate file URL.",
      };
    }

    if (!data?.signedUrl) {
      return {
        ok: false,
        message: "No signed URL generated.",
      };
    }

    return {
      ok: true,
      data: data.signedUrl,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to generate file URL.",
    };
  }
}

/**
 * List all evidence files for a dispute to enable bulk URL refreshing
 */
export async function listEvidenceByDisputeId(params: {
  disputeId: string;
}): Promise<SupabaseResult<
  Array<{
    id: string;
    description: string;
    storage_path: string | null;
    url: string | null;
    created_at: string;
  }>
>> {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("dispute_evidence")
      .select("id, description, metadata, url, created_at")
      .eq("dispute_id", params.disputeId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        ok: false,
        message: error.message || "Could not fetch evidence.",
      };
    }

    const records = (data || []).map((row) => ({
      id: row.id,
      description: row.description,
      storage_path: (row.metadata as any)?.storage_path ?? null,
      url: row.url,
      created_at: row.created_at,
    }));

    return { ok: true, data: records };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to list evidence.",
    };
  }
}
