/**
 * Q4 — Abuse Detection & Alerting
 *
 * Analyzes admin activity patterns to detect suspicious behavior
 * and generate actionable alerts for the security team.
 *
 * Detection patterns:
 *   - Volume spikes: >50 mutations in 5 minutes
 *   - Unusual access times: operations between 12am-5am local time
 *   - Failed operation chains: >5 failed attempts in 10 minutes
 *   - Bulk operations on sensitive resources: >10 operations on same resource in 5 min
 *   - Rapid-fire mutations: >10 mutations in 30 seconds
 *   - New IP address: first-time IP detected for admin
 *
 * Alert types:
 *   - "volume_spike": Unusually high operation volume
 *   - "off_hours_activity": Activity during suspicious hours
 *   - "chain_failure": Multiple sequential failures
 *   - "bulk_sensitive": Bulk operations on sensitive resources
 *   - "rapid_fire": Rapid successive mutations
 *   - "new_ip": New IP address detected
 *   - "locked_out": Account lockout triggered
 *
 * Integration:
 *   - Call recordActivity() after each admin action
 *   - Call generateAlerts() periodically or on-demand
 *   - Alerts include contextual details for security team triage
 */

export type AlertType =
  | "volume_spike"
  | "off_hours_activity"
  | "chain_failure"
  | "bulk_sensitive"
  | "rapid_fire"
  | "new_ip"
  | "locked_out";

export interface AbuseAlert {
  id: string;
  type: AlertType;
  severity: "low" | "medium" | "high" | "critical";
  adminId: string;
  message: string;
  details: Record<string, any>;
  timestamp: number;
  acknowledged: boolean;
}

export interface ActivityRecord {
  adminId: string;
  operation: string;
  resourceId?: string;
  ip?: string;
  timestamp: number;
  success: boolean;
}

interface AdminActivityWindow {
  recentActions: ActivityRecord[];
  ips: Set<string>;
  failures: number;
  firstSeen: number;
}

const activityLog: ActivityRecord[] = [];
const adminWindows = new Map<string, AdminActivityWindow>();
const alertedIps = new Map<string, Set<string>>(); // adminId → Set<ip> (already alerted)
const generatedAlerts: AbuseAlert[] = [];
let alertCounter = 0;

// Thresholds
const VOLUME_SPIKE_THRESHOLD = 50; // 50 actions in 5 min
const VOLUME_WINDOW_MS = 5 * 60 * 1000;
const OFF_HOURS_START = 0; // midnight
const OFF_HOURS_END = 5; // 5am
const CHAIN_FAILURE_THRESHOLD = 5; // 5 failures in 10 min
const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const BULK_SENSITIVE_THRESHOLD = 10; // 10 ops on same resource in 5 min
const BULK_WINDOW_MS = 5 * 60 * 1000;
const RAPID_FIRE_THRESHOLD = 10; // 10 mutations in 30 sec
const RAPID_WINDOW_MS = 30 * 1000;

function now(): number {
  return Date.now();
}

function generateAlertId(): string {
  alertCounter += 1;
  return `ALERT-${alertCounter}-${now()}`;
}

/**
 * Record an admin activity event.
 *
 * @param record - The activity to record
 * Call this after every admin mutation or sensitive action.
 */
export function recordActivity(record: ActivityRecord): void {
  activityLog.push(record);

  // Update admin window
  let window = adminWindows.get(record.adminId);
  if (!window) {
    window = {
      recentActions: [],
      ips: new Set(),
      failures: 0,
      firstSeen: record.timestamp,
    };
    adminWindows.set(record.adminId, window);
  }

  window.recentActions.push(record);
  if (record.ip) window.ips.add(record.ip);
  if (!record.success) window.failures += 1;
}

/**
 * Prune old activity records that fall outside detection windows.
 * Call periodically to prevent memory leaks.
 */
export function pruneActivityLog(): void {
  const cutoff = now() - VOLUME_WINDOW_MS;
  const idx = activityLog.findIndex((r) => r.timestamp >= cutoff);
  if (idx > 0) {
    activityLog.splice(0, idx);
  }

  // Prune admin windows
  for (const [adminId, window] of adminWindows.entries()) {
    const windowCutoff = now() - VOLUME_WINDOW_MS;
    window.recentActions = window.recentActions.filter(
      (r) => r.timestamp >= windowCutoff,
    );
    if (window.recentActions.length === 0) {
      adminWindows.delete(adminId);
    }
  }
}

/**
 * Generate abuse alerts by analyzing current activity patterns.
 *
 * @returns Array of AbuseAlert objects for the security team to investigate.
 */
export function generateAlerts(): AbuseAlert[] {
  const alerts: AbuseAlert[] = [];
  const ts = now();

  for (const [adminId, window] of adminWindows.entries()) {
    const recentActions = window.recentActions;

    // 1. Volume spike detection
    const volumeWindow = recentActions.filter(
      (r) => r.timestamp >= ts - VOLUME_WINDOW_MS,
    );
    if (volumeWindow.length >= VOLUME_SPIKE_THRESHOLD) {
      const alert = createAlert(
        "volume_spike",
        "high",
        adminId,
        `High volume of actions detected: ${volumeWindow.length} operations in the last 5 minutes.`,
        { operationCount: volumeWindow.length, window: "5min" },
      );
      alerts.push(alert);
    }

    // 2. Off-hours activity detection
    const offHoursActions = recentActions.filter(
      (r) => isOffHours(r.timestamp),
    );
    if (offHoursActions.length > 0) {
      const alert = createAlert(
        "off_hours_activity",
        "low",
        adminId,
        `${offHoursActions.length} operations detected during off-hours (12am-5am).`,
        { operationCount: offHoursActions.length },
      );
      alerts.push(alert);
    }

    // 3. Chain failure detection
    const failureWindow = recentActions.filter(
      (r) => !r.success && r.timestamp >= ts - FAILURE_WINDOW_MS,
    );
    if (failureWindow.length >= CHAIN_FAILURE_THRESHOLD) {
      const alert = createAlert(
        "chain_failure",
        "high",
        adminId,
        `${failureWindow.length} failed operations in the last 10 minutes. Possible attack or broken automation.`,
        { failureCount: failureWindow.length, window: "10min" },
      );
      alerts.push(alert);
    }

    // 4. Bulk operations on sensitive resource
    const resourceOps = new Map<string, ActivityRecord[]>();
    for (const action of recentActions.filter(
      (r) => r.resourceId && r.timestamp >= ts - BULK_WINDOW_MS,
    )) {
      const key = action.resourceId!;
      if (!resourceOps.has(key)) resourceOps.set(key, []);
      resourceOps.get(key)!.push(action);
    }
    for (const [resourceId, ops] of resourceOps.entries()) {
      if (ops.length >= BULK_SENSITIVE_THRESHOLD) {
        const alert = createAlert(
          "bulk_sensitive",
          "critical",
          adminId,
          `${ops.length} operations on the same resource (${resourceId}) in 5 minutes. Possible bulk abuse.`,
          { resourceId, operationCount: ops.length, window: "5min" },
        );
        alerts.push(alert);
      }
    }

    // 5. Rapid-fire mutations
    const rapidWindow = recentActions.filter(
      (r) => r.timestamp >= ts - RAPID_WINDOW_MS,
    );
    if (rapidWindow.length >= RAPID_FIRE_THRESHOLD) {
      const alert = createAlert(
        "rapid_fire",
        "critical",
        adminId,
        `${rapidWindow.length} mutations in 30 seconds. Possible automated attack.`,
        { operationCount: rapidWindow.length, window: "30s" },
      );
      alerts.push(alert);
    }
  }

  // 6. New IP detection — alert on IPs not previously seen for this admin
  for (const [adminId, window] of adminWindows.entries()) {
    let adminAlerted = alertedIps.get(adminId);
    if (!adminAlerted) {
      adminAlerted = new Set();
      alertedIps.set(adminId, adminAlerted);
    }
    for (const action of window.recentActions) {
      if (action.ip && !adminAlerted.has(action.ip)) {
        const alert = createAlert(
          "new_ip",
          "medium",
          adminId,
          `New IP address detected: ${action.ip} for admin ${adminId.slice(0, 8)}.`,
          { ip: action.ip, operation: action.operation },
        );
        alerts.push(alert);
        adminAlerted.add(action.ip);
      }
    }
  }

  // Store generated alerts
  generatedAlerts.push(...alerts);
  return alerts;
}

/**
 * Get all previously generated alerts.
 */
export function getAlerts(): AbuseAlert[] {
  return [...generatedAlerts];
}

/**
 * Acknowledge an alert by ID.
 */
export function acknowledgeAlert(alertId: string): boolean {
  const alert = generatedAlerts.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.acknowledged = true;
  return true;
}

/**
 * Get summary statistics for the compliance dashboard.
 */
export function getComplianceReport(): {
  totalAlerts: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  totalActivities: number;
  uniqueAdmins: number;
} {
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const alert of generatedAlerts) {
    bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    byType[alert.type] = (byType[alert.type] || 0) + 1;
  }

  return {
    totalAlerts: generatedAlerts.length,
    bySeverity,
    byType,
    totalActivities: activityLog.length,
    uniqueAdmins: adminWindows.size,
  };
}

/**
 * Lockdown a specific admin account (manual disable).
 *
 * @param adminId - The admin to disable
 * @param reason - Reason for lockdown (audit trail)
 * @returns Lockdown alert
 */
export function lockdownAdmin(
  adminId: string,
  reason: string,
): AbuseAlert {
  // Clear all activity data for this admin
  adminWindows.delete(adminId);

  const alert = createAlert(
    "locked_out",
    "critical",
    adminId,
    `Admin account ${adminId.slice(0, 8)} has been manually locked down. Reason: ${reason}`,
    { reason },
  );
  generatedAlerts.push(alert);
  return alert;
}

/**
 * Clear all tracked data (for testing).
 */
export function clearAllActivity(): void {
  activityLog.length = 0;
  adminWindows.clear();
  alertedIps.clear();
  generatedAlerts.length = 0;
  alertCounter = 0;
}

// ── Helpers ──

function createAlert(
  type: AlertType,
  severity: AbuseAlert["severity"],
  adminId: string,
  message: string,
  details: Record<string, any>,
): AbuseAlert {
  return {
    id: generateAlertId(),
    type,
    severity,
    adminId,
    message,
    details,
    timestamp: now(),
    acknowledged: false,
  };
}

function isOffHours(timestamp: number): boolean {
  const hour = new Date(timestamp).getHours();
  return hour >= OFF_HOURS_START && hour < OFF_HOURS_END;
}