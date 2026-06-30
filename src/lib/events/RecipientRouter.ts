/**
 * RecipientRouter — Determines who should receive notifications for a given event.
 *
 * Supported strategies:
 *   - "acting_admin": Only the admin who performed the action
 *   - "all_admins": Every user with role = 'admin'
 *   - "assigned_admin": The admin assigned to the resource (metadata.assigned_admin_id)
 */
import { supabaseProfiles } from "@/lib/supabase/data";
import { createLogger } from "@/lib/logger";
import type { BusinessEvent } from "./eventTypes";

const logger = createLogger("RecipientRouter");

let cachedAdminIds: string[] | null = null;
let cacheExpiresAtMs = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

async function fetchAllAdminIds(): Promise<string[]> {
  const now = Date.now();
  if (cachedAdminIds && now < cacheExpiresAtMs) {
    return cachedAdminIds;
  }

  try {
    const result = await supabaseProfiles.listLatest({
      limit: 50,
      roles: ["admin"],
    });

    if (result.ok === false) {
      logger.warn("Failed to fetch admin profiles for notification routing", result.message);
      return cachedAdminIds ?? [];
    }

    cachedAdminIds = result.data.map((profile) => profile.id);
    cacheExpiresAtMs = now + CACHE_TTL_MS;
    return cachedAdminIds;
  } catch (err) {
    logger.error("Error fetching admin profiles for notification routing", err);
    return cachedAdminIds ?? [];
  }
}

/**
 * Determine recipient user IDs for a given business event.
 * Returns an empty array if routing cannot be determined.
 */
export async function routeEvent(event: BusinessEvent): Promise<string[]> {
  switch (event.notify) {
    case "acting_admin":
      return event.actorId ? [event.actorId] : [];

    case "all_admins":
      return fetchAllAdminIds();

    case "assigned_admin": {
      const assignedId =
        typeof event.metadata?.assigned_admin_id === "string"
          ? event.metadata.assigned_admin_id.trim()
          : "";
      return assignedId ? [assignedId] : [];
    }

    default:
      // Default: notify all admins
      return fetchAllAdminIds();
  }
}

/**
 * Clear the admin ID cache (useful when admin list changes).
 */
export function clearRecipientCache(): void {
  cachedAdminIds = null;
  cacheExpiresAtMs = 0;
}