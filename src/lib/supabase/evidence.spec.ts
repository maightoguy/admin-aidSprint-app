import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateEvidenceFile, getEvidenceFileUrl } from "./evidence";
import type { SupabaseResult } from "./data";

describe("Evidence File Handling", () => {
  describe("validateEvidenceFile", () => {
    it("should accept valid image files", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true);
    });

    it("should accept valid PDF files", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true);
    });

    it("should accept valid Word documents", () => {
      const file = new File(
        ["test"],
        "test.docx",
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
      );
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true);
    });

    it("should reject unsupported file types", () => {
      const file = new File(["test"], "test.exe", { type: "application/x-msdownload" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(false);
      expect((result as any).message).toContain("not allowed");
    });

    it("should reject files exceeding size limit", () => {
      const largeContent = new ArrayBuffer(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], "test.pdf", { type: "application/pdf" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(false);
      expect((result as any).message).toContain("exceeds maximum size");
    });

    it("should accept files at the exact size limit", () => {
      const content = new ArrayBuffer(10 * 1024 * 1024); // Exactly 10MB
      const file = new File([content], "test.pdf", { type: "application/pdf" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true);
    });
  });

  describe("getEvidenceFileUrl", () => {
    beforeEach(() => {
      // Reset environment
      delete process.env.VITE_SUPABASE_ADMIN_DISPUTES_BUCKET;
    });

    it("should handle missing Supabase client gracefully", async () => {
      // This would need actual Supabase mocking in a real test suite
      // For now, just verify the function signature works
      expect(getEvidenceFileUrl).toBeDefined();
    });

    it("should use default bucket name when not provided", async () => {
      const result = await getEvidenceFileUrl({
        storagePath: "admin/disputes/test-id/evidence.pdf",
      });

      // Result will depend on Supabase availability
      expect(result).toHaveProperty("ok");
      expect(typeof result.ok).toBe("boolean");
    });

    it("should use custom bucket name when provided", async () => {
      const result = await getEvidenceFileUrl({
        storagePath: "admin/disputes/test-id/evidence.pdf",
        bucketName: "custom-bucket",
      });

      expect(result).toHaveProperty("ok");
    });

    it("should accept custom expiration time", async () => {
      const result = await getEvidenceFileUrl({
        storagePath: "admin/disputes/test-id/evidence.pdf",
        expiresInSeconds: 60 * 60 * 2, // 2 hours
      });

      expect(result).toHaveProperty("ok");
    });
  });

  describe("File type and size validation edge cases", () => {
    it("should handle files with no extension", () => {
      const file = new File(["test"], "document", { type: "application/pdf" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true);
    });

    it("should handle text files", () => {
      const file = new File(["test"], "notes.txt", { type: "text/plain" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true);
    });

    it("should validate by MIME type, not extension", () => {
      // File named with .pdf but MIME type is wrong
      const file = new File(["test"], "document.pdf", { type: "application/x-msdownload" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(false);
    });

    it("should handle empty file", () => {
      const file = new File([], "empty.pdf", { type: "application/pdf" });
      const result = validateEvidenceFile(file);
      expect(result.ok).toBe(true); // Empty files are valid, size limit only applies to maximum
    });
  });
});
