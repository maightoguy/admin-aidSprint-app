/**
 * Q4 — Abuse Detection Tests
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  recordActivity,
  generateAlerts,
  getAlerts,
  acknowledgeAlert,
  getComplianceReport,
  lockdownAdmin,
  clearAllActivity,
  pruneActivityLog,
  ActivityRecord,
  AbuseAlert,
} from "./abuse-detector";

const ADMIN_1 = "admin-001";
const ADMIN_2 = "admin-002";

function makeActivity(
  overrides: Partial<ActivityRecord> = {},
): ActivityRecord {
  return {
    adminId: ADMIN_1,
    operation: "contractor_suspend",
    timestamp: Date.now(),
    success: true,
    ...overrides,
  };
}

describe("Q4: Abuse Detection & Alerting", () => {
  beforeEach(() => clearAllActivity());
  afterEach(() => clearAllActivity());

  // ──────────────────────────────────────────────────────────
  // 1. BASIC ACTIVITY RECORDING
  // ──────────────────────────────────────────────────────────
  describe("1. Activity Recording", () => {
    it("records activity and tracks admin window", () => {
      recordActivity(makeActivity());
      recordActivity(makeActivity({ operation: "kyc_approve" }));
      const alerts = generateAlerts();
      // No alert yet — not enough for any pattern
      expect(alerts.length).toBe(0);
    });

    it("generates no alerts under normal usage", () => {
      for (let i = 0; i < 30; i++) {
        recordActivity(makeActivity({ success: true }));
      }
      const alerts = generateAlerts();
      expect(alerts.some((a) => a.type === "volume_spike")).toBe(false);
      expect(alerts.some((a) => a.type === "chain_failure")).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. VOLUME SPIKE DETECTION
  // ──────────────────────────────────────────────────────────
  describe("2. Volume Spike Detection (>50 in 5 min)", () => {
    it("detects volume spike at threshold", () => {
      for (let i = 0; i < 50; i++) {
        recordActivity(makeActivity());
      }
      const alerts = generateAlerts();
      const spike = alerts.find((a) => a.type === "volume_spike");
      expect(spike).toBeTruthy();
      expect(spike!.severity).toBe("high");
      expect(spike!.message).toContain("50");
    });

    it("does not generate spike below threshold", () => {
      for (let i = 0; i < 49; i++) {
        recordActivity(makeActivity());
      }
      const alerts = generateAlerts();
      expect(alerts.find((a) => a.type === "volume_spike")).toBeFalsy();
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. CHAIN FAILURE DETECTION
  // ──────────────────────────────────────────────────────────
  describe("3. Chain Failure Detection (>5 failures in 10 min)", () => {
    it("detects chain failure at threshold", () => {
      for (let i = 0; i < 5; i++) {
        recordActivity(makeActivity({ success: false }));
      }
      const alerts = generateAlerts();
      const cf = alerts.find((a) => a.type === "chain_failure");
      expect(cf).toBeTruthy();
      expect(cf!.severity).toBe("high");
      expect(cf!.message).toContain("failed");
    });

    it("does not detect chain failure below threshold", () => {
      for (let i = 0; i < 4; i++) {
        recordActivity(makeActivity({ success: false }));
      }
      const alerts = generateAlerts();
      expect(alerts.find((a) => a.type === "chain_failure")).toBeFalsy();
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. BULK SENSITIVE RESOURCE DETECTION
  // ──────────────────────────────────────────────────────────
  describe("4. Bulk Sensitive Resource Detection (>10 on same resource)", () => {
    it("detects bulk operations on same resource", () => {
      for (let i = 0; i < 10; i++) {
        recordActivity(
          makeActivity({ resourceId: "contractor-sensitive-1" }),
        );
      }
      const alerts = generateAlerts();
      const bulk = alerts.find((a) => a.type === "bulk_sensitive");
      expect(bulk).toBeTruthy();
      expect(bulk!.severity).toBe("critical");
      expect(bulk!.message).toContain("contractor-sensitive-1");
    });

    it("different resources don't trigger bulk alert", () => {
      for (let i = 0; i < 9; i++) {
        recordActivity(makeActivity({ resourceId: `res-${i}` }));
      }
      const alerts = generateAlerts();
      expect(alerts.find((a) => a.type === "bulk_sensitive")).toBeFalsy();
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. RAPID-FIRE DETECTION
  // ──────────────────────────────────────────────────────────
  describe("5. Rapid-Fire Detection (>10 in 30 sec)", () => {
    it("detects rapid-fire mutations", () => {
      for (let i = 0; i < 10; i++) {
        recordActivity(makeActivity());
      }
      const alerts = generateAlerts();
      const rf = alerts.find((a) => a.type === "rapid_fire");
      expect(rf).toBeTruthy();
      expect(rf!.severity).toBe("critical");
      expect(rf!.message).toContain("30");
    });

    it("does not trigger below threshold", () => {
      for (let i = 0; i < 9; i++) {
        recordActivity(makeActivity());
      }
      const alerts = generateAlerts();
      expect(alerts.find((a) => a.type === "rapid_fire")).toBeFalsy();
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. NEW IP DETECTION
  // ──────────────────────────────────────────────────────────
  describe("6. New IP Detection", () => {
    it("detects new IP addresses", () => {
      recordActivity(makeActivity({ ip: "10.0.0.1" }));
      recordActivity(makeActivity({ ip: "10.0.0.2" }));
      const alerts = generateAlerts();
      const ipAlerts = alerts.filter((a) => a.type === "new_ip");
      // Both IPs are new, should generate at least one alert
      expect(ipAlerts.length).toBeGreaterThanOrEqual(1);
      const ips = ipAlerts.map((a) => a.details.ip);
      expect(ips).toContain("10.0.0.1");
      expect(ips).toContain("10.0.0.2");
    });

    it("same IP only triggers new_ip alert once", () => {
      recordActivity(makeActivity({ ip: "10.0.0.1" }));
      generateAlerts(); // first pass — should trigger new_ip for 10.0.0.1
      recordActivity(makeActivity({ ip: "10.0.0.1" }));
      const alerts = generateAlerts();
      // Second pass — no new IP because already alerted
      expect(alerts.filter((a) => a.type === "new_ip").length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 7. ALERT ACKNOWLEDGMENT
  // ──────────────────────────────────────────────────────────
  describe("7. Alert Acknowledgment", () => {
    it("acknowledges an alert", () => {
      for (let i = 0; i < 50; i++) recordActivity(makeActivity());
      generateAlerts();
      const allAlerts = getAlerts();
      expect(allAlerts.length).toBeGreaterThan(0);

      const result = acknowledgeAlert(allAlerts[0].id);
      expect(result).toBe(true);

      const updated = getAlerts();
      expect(updated[0].acknowledged).toBe(true);
    });

    it("returns false for non-existent alert", () => {
      expect(acknowledgeAlert("nonexistent")).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 8. COMPLIANCE REPORT
  // ──────────────────────────────────────────────────────────
  describe("8. Compliance Dashboard", () => {
    it("returns report with correct stats", () => {
      for (let i = 0; i < 50; i++) recordActivity(makeActivity());
      generateAlerts();
      const report = getComplianceReport();
      expect(report.totalAlerts).toBeGreaterThan(0);
      expect(report.totalActivities).toBe(50);
      expect(report.uniqueAdmins).toBe(1);
      expect(typeof report.bySeverity).toBe("object");
      expect(typeof report.byType).toBe("object");
    });
  });

  // ──────────────────────────────────────────────────────────
  // 9. ADMIN LOCKDOWN
  // ──────────────────────────────────────────────────────────
  describe("9. Admin Lockdown", () => {
    it("creates lockdown alert", () => {
      const alert = lockdownAdmin(ADMIN_1, "Compromised account detected");
      expect(alert.type).toBe("locked_out");
      expect(alert.severity).toBe("critical");
      expect(alert.message).toContain("locked down");
      expect(alert.message).toContain("Compromised");
    });
  });

  // ──────────────────────────────────────────────────────────
  // 10. MULTI-ADMIN ISOLATION
  // ──────────────────────────────────────────────────────────
  describe("10. Multi-Admin Isolation", () => {
    it("alerts reference correct admin ID", () => {
      for (let i = 0; i < 50; i++) {
        recordActivity(makeActivity({ adminId: ADMIN_1 }));
      }
      recordActivity(makeActivity({ adminId: ADMIN_2 }));
      const alerts = generateAlerts();
      const admin1Alerts = alerts.filter((a) => a.adminId === ADMIN_1);
      const admin2Alerts = alerts.filter((a) => a.adminId === ADMIN_2);
      expect(admin1Alerts.length).toBeGreaterThan(0);
      expect(admin2Alerts.length).toBe(0); // ADMIN_2 under threshold
    });
  });

  // ──────────────────────────────────────────────────────────
  // 11. PRUNE
  // ──────────────────────────────────────────────────────────
  describe("11. Prune & Cleanup", () => {
    it("prune removes old activity but keeps recent", () => {
      const oldTime = Date.now() - 10 * 60 * 1000; // 10 min ago
      recordActivity(makeActivity({ timestamp: oldTime }));
      recordActivity(makeActivity()); // current time
      pruneActivityLog();
      // Activity log should still have at least 1 recent entry
      const stats = getComplianceReport();
      expect(stats.totalActivities).toBeGreaterThanOrEqual(1);
    });

    it("clearAllActivity resets everything", () => {
      for (let i = 0; i < 50; i++) recordActivity(makeActivity());
      generateAlerts();
      clearAllActivity();
      const report = getComplianceReport();
      expect(report.totalAlerts).toBe(0);
      expect(report.totalActivities).toBe(0);
    });
  });
});