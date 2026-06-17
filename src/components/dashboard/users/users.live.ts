import type { UserDetailsRecord, UserLocationHistoryItem } from "../user-details/user-details.types";
import type { UserRecord, UserRole, UserStatus } from "./users.types";
import {
  supabaseJobs,
  supabaseProfiles,
  type JobRow,
  type ProfileRow,
} from "@/lib/supabase/data";
import {
  formatDateLabel,
  mapJobRowToUserRequestHistoryItem,
} from "@/lib/supabase/mappers";

function getProfileDisplayName(
  profile: Pick<
    ProfileRow,
    "full_name" | "first_name" | "last_name" | "email"
  >,
) {
  return (
    profile.full_name?.trim() ||
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    profile.email?.trim() ||
    "Unknown user"
  );
}

export function getNameInitials(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return "AU";
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function mapProfileRoleToUserRole(role: string): UserRole {
  return role.trim().toLowerCase() === "admin" ? "Admin" : "User";
}

function mapProfileToUserStatus(
  profile: Pick<ProfileRow, "linked_auth_methods">,
): UserStatus {
  return Array.isArray(profile.linked_auth_methods) &&
    profile.linked_auth_methods.length === 0
    ? "Deactivated"
    : "Active";
}

function sortJobsNewestFirst(jobs: JobRow[]) {
  return [...jobs].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function buildLocationHistory(jobs: JobRow[]): UserLocationHistoryItem[] {
  const uniqueAddresses = Array.from(
    new Set(
      sortJobsNewestFirst(jobs)
        .map((job) => job.address?.trim() ?? "")
        .filter(Boolean),
    ),
  );

  return uniqueAddresses.map((address, index) => ({
    id: `location-${index + 1}-${address.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    primaryLine: address,
    secondaryLine: "Nigeria",
    isCurrent: index === 0,
  }));
}

function buildNameParts(profile: ProfileRow) {
  const displayName = getProfileDisplayName(profile);
  const [fallbackFirstName = displayName, ...rest] = displayName.split(/\s+/);
  const fallbackLastName = rest.join(" ").trim() || "—";

  return {
    displayName,
    firstName: profile.first_name?.trim() || fallbackFirstName,
    lastName: profile.last_name?.trim() || fallbackLastName,
  };
}

export function mapProfileToUserRecord(params: {
  profile: ProfileRow;
  jobs: JobRow[];
}): UserRecord {
  const { profile, jobs } = params;
  const sortedJobs = sortJobsNewestFirst(jobs);
  const latestAddress =
    sortedJobs.find((job) => job.address?.trim())?.address?.trim() || "—";
  const { displayName } = buildNameParts(profile);

  return {
    id: profile.id,
    name: displayName,
    email: profile.email?.trim() || "—",
    avatarUrl: profile.avatar_url,
    location: latestAddress,
    totalServicesRequested: sortedJobs.length,
    dateJoined: formatDateLabel(profile.created_at),
    status: mapProfileToUserStatus(profile),
    role: mapProfileRoleToUserRole(profile.role),
  };
}

export function mapProfileToUserDetailsRecord(params: {
  profile: ProfileRow;
  jobs: JobRow[];
  profilesById: Map<string, ProfileRow>;
}): UserDetailsRecord {
  const { profile, jobs, profilesById } = params;
  const sortedJobs = sortJobsNewestFirst(jobs);
  const baseRecord = mapProfileToUserRecord({
    profile,
    jobs: sortedJobs,
  });
  const { firstName, lastName } = buildNameParts(profile);

  return {
    ...baseRecord,
    firstName,
    lastName,
    gender: profile.gender?.trim() || "—",
    locations: buildLocationHistory(sortedJobs),
    requestHistory: sortedJobs.map((job) =>
      mapJobRowToUserRequestHistoryItem({
        job,
        userProfile: profile,
        contractorProfile: job.contractor_id
          ? (profilesById.get(job.contractor_id) ?? null)
          : null,
      }),
    ),
  };
}

export async function loadLiveUsers() {
  const [profilesResult, jobsResult] = await Promise.all([
    supabaseProfiles.listLatest({
      limit: 200,
      roles: ["admin", "user"],
    }),
    supabaseJobs.listLatest({ limit: 500 }),
  ]);

  if (profilesResult.ok === false) {
    throw new Error(profilesResult.message);
  }

  if (jobsResult.ok === false) {
    throw new Error(jobsResult.message);
  }

  const jobsByUserId = jobsResult.data.reduce<Map<string, JobRow[]>>(
    (accumulator, job) => {
      const currentJobs = accumulator.get(job.user_id) ?? [];
      currentJobs.push(job);
      accumulator.set(job.user_id, currentJobs);
      return accumulator;
    },
    new Map<string, JobRow[]>(),
  );

  return profilesResult.data.map((profile) =>
    mapProfileToUserRecord({
      profile,
      jobs: jobsByUserId.get(profile.id) ?? [],
    }),
  );
}

export async function loadLiveUserDetails(userId: string) {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error("User id is required.");
  }

  const [profileResult, jobsResult] = await Promise.all([
    supabaseProfiles.getById(normalizedUserId),
    supabaseJobs.listByUserIds([normalizedUserId], { limit: 200 }),
  ]);

  if (profileResult.ok === false) {
    throw new Error(profileResult.message);
  }

  if (jobsResult.ok === false) {
    throw new Error(jobsResult.message);
  }

  const relatedProfileIds = Array.from(
    new Set(
      [normalizedUserId]
        .concat(
          jobsResult.data
            .map((job) => job.contractor_id)
            .filter((value): value is string => Boolean(value)),
        )
        .filter(Boolean),
    ),
  );
  const relatedProfilesResult = await supabaseProfiles.listByIds(relatedProfileIds);

  if (relatedProfilesResult.ok === false) {
    throw new Error(relatedProfilesResult.message);
  }

  const profilesById = new Map(
    relatedProfilesResult.data.map((profile) => [profile.id, profile]),
  );
  profilesById.set(profileResult.data.id, profileResult.data);

  return mapProfileToUserDetailsRecord({
    profile: profileResult.data,
    jobs: jobsResult.data,
    profilesById,
  });
}
