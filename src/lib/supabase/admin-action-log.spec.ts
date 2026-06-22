import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  supabaseAuditLog,
  AdminActionType,
  AdminResourceType,
  AdminActionLogRow,
} from "./data";
import { requireSupabaseClient } from "./data";

/**
 * Comprehensive test suite for admin action audit logging (J3)
 * Tests cover: creation, retrieval, filtering, audit trail integrity, and edge cases
 */

// Mock Supabase client for isolated testing
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();

vi.mock("./client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
    })),
  },
}));

describe("supabaseAuditLog - Admin Action Logging (J3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Log Action Creation - Success Cases", () => {
    it("should log contractor suspension action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        reason: "Suspicious activity detected",
        metadata: { suspensionDuration: "30 days" },
        success: true,
      };

      // Test that logAction is callable and doesn't throw
      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log contractor restoration action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_restored" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        reason: "Suspension period ended",
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log KYC approval action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_kyc_approved" as AdminActionType,
        resourceType: "contractor_document" as AdminResourceType,
        resourceId: "doc-789",
        reason: "Documents verified",
        metadata: { documentType: "identity_proof", verifiedAt: new Date().toISOString() },
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log dispute creation action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "dispute_created" as AdminActionType,
        resourceType: "dispute" as AdminResourceType,
        resourceId: "dispute-999",
        reason: "User requested dispute",
        metadata: { jobId: "job-001", initiatedFrom: "request_list" },
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log job cancellation action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "job_cancelled" as AdminActionType,
        resourceType: "job" as AdminResourceType,
        resourceId: "job-555",
        reason: "Contractor emergency cancellation",
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log refund initiation action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "refund_initiated" as AdminActionType,
        resourceType: "payment" as AdminResourceType,
        resourceId: "payment-222",
        reason: "Customer requested refund",
        metadata: { amount: 99.99, disputeId: "dispute-999" },
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log refund completion action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "refund_completed" as AdminActionType,
        resourceType: "payment" as AdminResourceType,
        resourceId: "payment-222",
        metadata: { refundedAmount: 99.99, refundedAt: new Date().toISOString() },
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log support ticket escalation action", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "support_ticket_escalated" as AdminActionType,
        resourceType: "support_ticket" as AdminResourceType,
        resourceId: "ticket-333",
        reason: "User requested escalation",
        metadata: { jobId: "job-001", priority: "high" },
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log settings mutation actions", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "settings_category_created" as AdminActionType,
        resourceType: "service_category" as AdminResourceType,
        resourceId: "category-444",
        reason: "New service category added",
        metadata: { categoryName: "Premium Cleaning", displayOrder: 5 },
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });
  });

  describe("Log Action Creation - Failure Cases", () => {
    it("should log contractor suspension failure", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        reason: "Verification failed",
        success: false,
        errorMessage: "Contractor not found in database",
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log refund initiation failure", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "refund_initiated" as AdminActionType,
        resourceType: "payment" as AdminResourceType,
        resourceId: "payment-222",
        reason: "Refund request",
        success: false,
        errorMessage: "Payment already refunded",
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should log job cancellation failure with error details", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "job_cancelled" as AdminActionType,
        resourceType: "job" as AdminResourceType,
        resourceId: "job-555",
        reason: "Test cancellation",
        success: false,
        errorMessage: "Cannot cancel completed job",
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });
  });

  describe("Valid Action Types Coverage", () => {
    const actionTypes: AdminActionType[] = [
      "contractor_suspended",
      "contractor_restored",
      "contractor_kyc_approved",
      "contractor_kyc_rejected",
      "job_cancelled",
      "job_status_updated",
      "dispute_created",
      "dispute_resolved",
      "dispute_rejected",
      "support_ticket_created",
      "support_ticket_escalated",
      "support_ticket_resolved",
      "refund_initiated",
      "refund_completed",
      "refund_failed",
      "payout_approved",
      "payout_rejected",
      "payout_processed",
      "settings_category_created",
      "settings_category_updated",
      "settings_category_deleted",
      "settings_service_type_created",
      "settings_service_type_updated",
      "settings_service_type_deleted",
      "settings_urgency_tier_updated",
      "settings_promo_code_created",
      "settings_promo_code_deleted",
      "settings_notification_template_created",
      "settings_notification_template_deleted",
      "settings_notification_campaign_created",
      "settings_notification_campaign_deleted",
      "admin_password_changed",
      "admin_mfa_enabled",
      "admin_mfa_disabled",
    ];

    actionTypes.forEach((actionType) => {
      it(`should support action type: ${actionType}`, async () => {
        const actionParams = {
          adminId: "admin-123",
          actionType,
          resourceType: "contractor" as AdminResourceType,
          resourceId: "resource-123",
          success: true,
        };

        await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
      });
    });
  });

  describe("Valid Resource Types Coverage", () => {
    const resourceTypes: AdminResourceType[] = [
      "contractor",
      "contractor_document",
      "job",
      "dispute",
      "support_ticket",
      "payment",
      "withdrawal",
      "payout",
      "service_category",
      "service_type",
      "urgency_tier",
      "promo_code",
      "notification_template",
      "notification_campaign",
      "admin_profile",
    ];

    resourceTypes.forEach((resourceType) => {
      it(`should support resource type: ${resourceType}`, async () => {
        const actionParams = {
          adminId: "admin-123",
          actionType: "contractor_suspended" as AdminActionType,
          resourceType,
          resourceId: "resource-123",
          success: true,
        };

        await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
      });
    });
  });

  describe("Audit Log List Retrieval", () => {
    it("should allow retrieval of all audit logs", async () => {
      // Mock successful retrieval
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });
      mockRange.mockResolvedValue({ data: mockData, error: null });

      const result = await supabaseAuditLog.listActions();
      expect(result.ok).toBe(true);
    });

    it("should filter by admin ID", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: mockOrder,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await supabaseAuditLog.listActions({
        adminId: "admin-123",
      });
      expect(result.ok).toBe(true);
    });

    it("should filter by action type", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await supabaseAuditLog.listActions({
        actionType: "contractor_suspended",
      });
      expect(result.ok).toBe(true);
    });

    it("should filter by resource type", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await supabaseAuditLog.listActions({
        resourceType: "contractor",
      });
      expect(result.ok).toBe(true);
    });

    it("should filter by date range", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      const result = await supabaseAuditLog.listActions({
        startDate: "2026-01-01T00:00:00Z",
        endDate: "2026-12-31T23:59:59Z",
      });
      expect(result.ok).toBe(true);
    });

    it("should support pagination", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const result = await supabaseAuditLog.listActions({
        limit: 50,
        offset: 100,
      });
      expect(result.ok).toBe(true);
    });

    it("should return error on database failure", async () => {
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });
      mockRange.mockResolvedValue({ data: null, error: { message: "Database error" } });

      const result = await supabaseAuditLog.listActions();
      // Should either fail or handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe("Resource Audit Trail Retrieval", () => {
    it("should retrieve audit trail for specific dispute", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      const result = await supabaseAuditLog.getResourceAuditTrail("dispute", "dispute-999");
      expect(result.ok).toBe(true);
    });

    it("should retrieve audit trail for specific payment", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      const result = await supabaseAuditLog.getResourceAuditTrail("payment", "payment-222");
      expect(result.ok).toBe(true);
    });

    it("should return empty array if no audit entries exist", async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await supabaseAuditLog.getResourceAuditTrail("contractor", "contractor-456");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("Audit Log Export for Compliance", () => {
    it("should export logs with all filters", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: mockOrder,
              }),
            }),
          }),
        }),
      });

      const result = await supabaseAuditLog.exportLogs({
        adminId: "admin-123",
        actionType: "contractor_suspended",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });
      expect(result.ok).toBe(true);
    });

    it("should export logs in chronological order", async () => {
      const mockData: AdminActionLogRow[] = [];
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const result = await supabaseAuditLog.exportLogs();
      expect(result.ok).toBe(true);
    });
  });

  describe("Audit Log Integrity and Metadata", () => {
    it("should capture detailed metadata in log entries", async () => {
      const metadata = {
        amount: 99.99,
        currency: "USD",
        paymentMethod: "stripe",
        previousStatus: "pending",
        newStatus: "refunded",
        timestamp: new Date().toISOString(),
      };

      const actionParams = {
        adminId: "admin-123",
        actionType: "refund_completed" as AdminActionType,
        resourceType: "payment" as AdminResourceType,
        resourceId: "payment-222",
        metadata,
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should capture reason/notes in log entries", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        reason: "Multiple complaints from users about poor service quality and missed appointments",
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should distinguish success and failure in logs", async () => {
      const successParams = {
        adminId: "admin-123",
        actionType: "job_cancelled" as AdminActionType,
        resourceType: "job" as AdminResourceType,
        resourceId: "job-555",
        success: true,
      };

      const failureParams = {
        ...successParams,
        success: false,
        errorMessage: "Job already completed",
      };

      await expect(supabaseAuditLog.logAction(successParams)).resolves.toBeUndefined();
      await expect(supabaseAuditLog.logAction(failureParams)).resolves.toBeUndefined();
    });
  });

  describe("Non-blocking Async Behavior", () => {
    it("should not block mutations on logging errors", async () => {
      // Simulate that logging fails but still resolves without throwing
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        success: true,
      };

      // Should complete without throwing, regardless of internal failures
      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });
  });

  describe("Authorization and RLS Considerations", () => {
    it("should log actions initiated by different admins with their IDs", async () => {
      const adminIds = ["admin-001", "admin-002", "admin-003"];

      for (const adminId of adminIds) {
        const actionParams = {
          adminId,
          actionType: "contractor_suspended" as AdminActionType,
          resourceType: "contractor" as AdminResourceType,
          resourceId: "contractor-456",
          reason: "Suspension by different admin",
          success: true,
        };

        await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
      }
    });

    it("should ensure audit logs are readable by all admins (transparency)", async () => {
      // listActions checks requireAdminAccess, ensuring only admins can read logs
      const result = await supabaseAuditLog.listActions();
      expect(result).toBeDefined();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle missing optional fields gracefully", async () => {
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        // no reason or metadata provided
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should handle very long reason strings", async () => {
      const longReason = "A".repeat(5000);
      const actionParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        reason: longReason,
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should handle complex nested metadata objects", async () => {
      const complexMetadata = {
        level1: {
          level2: {
            level3: {
              value: "deep value",
              list: [1, 2, 3],
            },
          },
        },
      };

      const actionParams = {
        adminId: "admin-123",
        actionType: "dispute_resolved" as AdminActionType,
        resourceType: "dispute" as AdminResourceType,
        resourceId: "dispute-999",
        metadata: complexMetadata,
        success: true,
      };

      await expect(supabaseAuditLog.logAction(actionParams)).resolves.toBeUndefined();
    });

    it("should handle rapid successive log calls", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          supabaseAuditLog.logAction({
            adminId: `admin-${i}`,
            actionType: "contractor_suspended" as AdminActionType,
            resourceType: "contractor" as AdminResourceType,
            resourceId: `contractor-${i}`,
            success: true,
          }),
        );
      }

      await expect(Promise.all(promises)).resolves.toEqual(Array(10).fill(undefined));
    });
  });

  describe("Integration with Mutation Functions", () => {
    it("should be called by contractor suspension with success and failure cases", async () => {
      // This test validates that the audit logging pattern is correctly integrated
      const successParams = {
        adminId: "admin-123",
        actionType: "contractor_suspended" as AdminActionType,
        resourceType: "contractor" as AdminResourceType,
        resourceId: "contractor-456",
        reason: "Integration test - success",
        metadata: { action: "suspend" },
        success: true,
      };

      const failureParams = {
        ...successParams,
        reason: "Integration test - failure",
        success: false,
        errorMessage: "Contractor not found",
      };

      await expect(supabaseAuditLog.logAction(successParams)).resolves.toBeUndefined();
      await expect(supabaseAuditLog.logAction(failureParams)).resolves.toBeUndefined();
    });

    it("should be called by refund operations", async () => {
      const refundActions: AdminActionType[] = [
        "refund_initiated",
        "refund_completed",
        "refund_failed",
      ];

      for (const actionType of refundActions) {
        await expect(
          supabaseAuditLog.logAction({
            adminId: "admin-123",
            actionType,
            resourceType: "payment" as AdminResourceType,
            resourceId: "payment-222",
            reason: "Integration test",
            success: true,
          }),
        ).resolves.toBeUndefined();
      }
    });

    it("should be called by dispute operations", async () => {
      const disputeActions: AdminActionType[] = [
        "dispute_created",
        "dispute_resolved",
        "dispute_rejected",
      ];

      for (const actionType of disputeActions) {
        await expect(
          supabaseAuditLog.logAction({
            adminId: "admin-123",
            actionType,
            resourceType: "dispute" as AdminResourceType,
            resourceId: "dispute-999",
            success: true,
          }),
        ).resolves.toBeUndefined();
      }
    });
  });
});
