// Simple in-memory store used by e2e mocks to simulate DB state.
export const testStore = {
  users: [] as any[],
  profiles: [] as any[],
  jobs: [] as any[],
  contractors: [] as any[],
  contractorDocuments: [] as any[],
  disputes: [] as any[],
  disputeEvidence: [] as any[],
  disputeEvents: [] as any[],
  payments: [] as any[],
  withdrawals: [] as any[],
  supportTickets: [] as any[],
  supportTicketEvents: [] as any[],
  supportMessages: [] as any[],
  reviews: [] as any[],
  notifications: [] as any[],
  audit: [] as any[],
  financeAuditLog: [] as any[],
  jobOperationsLog: [] as any[],
  serviceCategories: [] as any[],
  serviceTypes: [] as any[],
  urgencyTiers: [] as any[],
  promo: [] as any[],
  notificationsCampaigns: [] as any[],
  adminSecurityEvents: [] as any[],
};

const ADMIN_ID = "admin-001";
const CONTRACTOR_ID = "contractor-001";
const USER_ID = "user-001";

export function getAdminId() {
  return ADMIN_ID;
}

export function getContractorId() {
  return CONTRACTOR_ID;
}

export function getUserId() {
  return USER_ID;
}

// Helper to generate ISO timestamps relative to now
function ts(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// Seeded IDs for deterministic test references
export const SEED = {
  adminId: ADMIN_ID,
  contractorId: CONTRACTOR_ID,
  userId: USER_ID,
  jobId: "job-001",
  paymentId: "payment-001",
  withdrawalId: "withdrawal-001",
  disputeId: "dispute-001",
  supportTicketId: "ticket-001",
  reviewId: "review-001",
  notificationId: "notif-001",
  categoryId: "cat-001",
  serviceTypeId: "st-001",
  urgencyTierId: "ut-001",
  promoCodeId: "promo-001",
  campaignId: "campaign-001",
  documentId1: "doc-001",
  documentId2: "doc-002",
};

export async function seedTestData() {
  // Reset in-memory store — clear all arrays
  Object.values(testStore).forEach((arr) => (arr.length = 0));

  const now = Date.now();

  // === PROFILES ===
  testStore.profiles.push(
    { id: ADMIN_ID, email: "admin@aidsprint.com", full_name: "Admin User", role: "admin", created_at: ts(-86400000 * 30), updated_at: ts(-86400000) },
    { id: CONTRACTOR_ID, email: "contractor@example.com", full_name: "Jane Contractor", role: "contractor", created_at: ts(-86400000 * 20), updated_at: ts(-86400000) },
    { id: USER_ID, email: "user@example.com", full_name: "John User", role: "user", created_at: ts(-86400000 * 15), updated_at: ts(-86400000) },
    { id: "contractor-002", email: "bob@example.com", full_name: "Bob Builder", role: "contractor", created_at: ts(-86400000 * 10), updated_at: ts(-86400000) },
    { id: "contractor-003", email: "alice@example.com", full_name: "Alice Architect", role: "contractor", created_at: ts(-86400000 * 5), updated_at: ts(-86400000) },
    { id: "user-002", email: "mary@example.com", full_name: "Mary Customer", role: "user", created_at: ts(-86400000 * 8), updated_at: ts(-86400000) },
  );

  // === CONTRACTORS ===
  testStore.contractors.push(
    {
      id: CONTRACTOR_ID,
      user_id: CONTRACTOR_ID,
      services: ["Plumbing", "Electrical"],
      certifications: ["Licensed Electrician"],
      rating: 4.5,
      total_ratings: 12,
      acceptance_rate: 0.85,
      total_jobs_offered: 20,
      total_jobs_accepted: 17,
      availability_status: "available",
      is_verified: true,
      id_verification_complete: true,
      police_check_complete: true,
      service_licences_complete: true,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      restored_at: null,
      restored_by: null,
      restore_reason: null,
      created_at: ts(-86400000 * 20),
      updated_at: ts(-86400000),
    },
    {
      id: "contractor-002",
      user_id: "contractor-002",
      services: ["Carpentry"],
      certifications: [],
      rating: 3.2,
      total_ratings: 5,
      acceptance_rate: 0.6,
      total_jobs_offered: 10,
      total_jobs_accepted: 6,
      availability_status: "busy",
      is_verified: false,
      id_verification_complete: false,
      police_check_complete: false,
      service_licences_complete: false,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      restored_at: null,
      restored_by: null,
      restore_reason: null,
      created_at: ts(-86400000 * 10),
      updated_at: ts(-86400000),
    },
    {
      id: "contractor-003",
      user_id: "contractor-003",
      services: ["Architecture"],
      certifications: ["Licensed Architect"],
      rating: 4.8,
      total_ratings: 20,
      acceptance_rate: 0.95,
      total_jobs_offered: 22,
      total_jobs_accepted: 21,
      availability_status: "available",
      is_verified: false,
      id_verification_complete: false,
      police_check_complete: false,
      service_licences_complete: false,
      suspended_at: ts(-86400000 * 2),
      suspended_by: ADMIN_ID,
      suspension_reason: "Multiple late arrivals",
      restored_at: null,
      restored_by: null,
      restore_reason: null,
      created_at: ts(-86400000 * 5),
      updated_at: ts(-86400000 * 2),
    },
  );

  // === CONTRACTOR DOCUMENTS ===
  testStore.contractorDocuments.push(
    {
      id: SEED.documentId1,
      contractor_id: CONTRACTOR_ID,
      category: "id_verification",
      file_url: "https://storage.example.com/id_front.jpg",
      file_type: "image/jpeg",
      status: "pending",
      rejection_reason: null,
      reviewed_at: null,
      reviewed_by: null,
      uploaded_at: ts(-86400000 * 5),
      created_at: ts(-86400000 * 5),
    },
    {
      id: SEED.documentId2,
      contractor_id: CONTRACTOR_ID,
      category: "police_check",
      file_url: "https://storage.example.com/police.pdf",
      file_type: "application/pdf",
      status: "pending",
      rejection_reason: null,
      reviewed_at: null,
      reviewed_by: null,
      uploaded_at: ts(-86400000 * 5),
      created_at: ts(-86400000 * 5),
    },
    {
      id: "doc-003",
      contractor_id: "contractor-002",
      category: "id_verification",
      file_url: "https://storage.example.com/id2.jpg",
      file_type: "image/jpeg",
      status: "rejected",
      rejection_reason: "Blurry image, please re-upload",
      reviewed_at: ts(-86400000 * 3),
      reviewed_by: ADMIN_ID,
      uploaded_at: ts(-86400000 * 7),
      created_at: ts(-86400000 * 7),
    },
  );

  // === JOBS ===
  testStore.jobs.push(
    {
      id: SEED.jobId,
      user_id: USER_ID,
      contractor_id: CONTRACTOR_ID,
      service_category_id: SEED.categoryId,
      service_type_id: SEED.serviceTypeId,
      service_type: "Plumbing Repair",
      urgency_tier: "standard",
      description: "Fix leaking pipe under kitchen sink",
      hours: 2,
      base_price: 150,
      urgency_fee: 0,
      platform_fee: 15,
      price_estimate: 165,
      final_price: null,
      status: "in_progress",
      cancellation_reason: null,
      cancelled_by: null,
      latitude: 6.5244,
      longitude: 3.3792,
      address: "123 Main St, Lagos",
      created_at: ts(-86400000 * 3),
      updated_at: ts(-86400000),
      accepted_at: ts(-86400000 * 2),
      started_at: ts(-86400000),
      completed_at: null,
      cancelled_at: null,
    },
    {
      id: "job-002",
      user_id: USER_ID,
      contractor_id: null,
      service_category_id: SEED.categoryId,
      service_type_id: SEED.serviceTypeId,
      service_type: "Electrical Wiring",
      urgency_tier: "emergency",
      description: "Short circuit in living room",
      hours: 3,
      base_price: 300,
      urgency_fee: 100,
      platform_fee: 40,
      price_estimate: 440,
      final_price: null,
      status: "broadcast",
      cancellation_reason: null,
      cancelled_by: null,
      latitude: 6.5,
      longitude: 3.38,
      address: "456 Oak Ave, Lagos",
      created_at: ts(-3600000 * 2),
      updated_at: ts(-3600000 * 2),
      accepted_at: null,
      started_at: null,
      completed_at: null,
      cancelled_at: null,
    },
    {
      id: "job-003",
      user_id: "user-002",
      contractor_id: CONTRACTOR_ID,
      service_category_id: SEED.categoryId,
      service_type_id: SEED.serviceTypeId,
      service_type: "Paint Wall",
      urgency_tier: "standard",
      description: "Paint living room wall",
      hours: 4,
      base_price: 200,
      urgency_fee: 0,
      platform_fee: 20,
      price_estimate: 220,
      final_price: 220,
      status: "completed",
      cancellation_reason: null,
      cancelled_by: null,
      latitude: 6.51,
      longitude: 3.381,
      address: "789 Pine Rd, Lagos",
      created_at: ts(-86400000 * 10),
      updated_at: ts(-3600000 * 12),
      accepted_at: ts(-86400000 * 9),
      started_at: ts(-86400000 * 9),
      completed_at: ts(-86400000 * 8),
      cancelled_at: null,
    },
    {
      id: "job-004",
      user_id: USER_ID,
      contractor_id: null,
      service_category_id: SEED.categoryId,
      service_type_id: SEED.serviceTypeId,
      service_type: "AC Repair",
      urgency_tier: "urgent",
      description: "AC not cooling",
      hours: 2,
      base_price: 180,
      urgency_fee: 50,
      platform_fee: 23,
      price_estimate: 253,
      final_price: null,
      status: "cancelled",
      cancellation_reason: "Customer decided to replace unit instead",
      cancelled_by: ADMIN_ID,
      latitude: 6.52,
      longitude: 3.382,
      address: "101 Beach Dr, Lagos",
      created_at: ts(-86400000 * 4),
      updated_at: ts(-86400000 * 3),
      accepted_at: null,
      started_at: null,
      completed_at: null,
      cancelled_at: ts(-86400000 * 3),
    },
  );

  // === PAYMENTS ===
  testStore.payments.push(
    {
      id: SEED.paymentId,
      job_id: SEED.jobId,
      payer_id: USER_ID,
      payee_id: CONTRACTOR_ID,
      amount: 165,
      platform_fee: 15,
      net_amount: 150,
      status: "captured",
      payment_method: "card",
      stripe_payment_intent_id: "pi_test_001",
      refunded_at: null,
      refund_initiated_by: null,
      refund_reason: null,
      created_at: ts(-86400000 * 2),
      updated_at: ts(-86400000),
    },
    {
      id: "payment-002",
      job_id: "job-003",
      payer_id: "user-002",
      payee_id: CONTRACTOR_ID,
      amount: 220,
      platform_fee: 20,
      net_amount: 200,
      status: "paid",
      payment_method: "transfer",
      stripe_payment_intent_id: "pi_test_002",
      refunded_at: null,
      refund_initiated_by: null,
      refund_reason: null,
      created_at: ts(-86400000 * 9),
      updated_at: ts(-86400000 * 8),
    },
    {
      id: "payment-003",
      job_id: "job-002",
      payer_id: USER_ID,
      payee_id: null,
      amount: 440,
      platform_fee: 40,
      net_amount: 400,
      status: "pending",
      payment_method: "card",
      stripe_payment_intent_id: "pi_test_003",
      refunded_at: null,
      refund_initiated_by: null,
      refund_reason: null,
      created_at: ts(-3600000),
      updated_at: ts(-3600000),
    },
  );

  // === WITHDRAWALS ===
  testStore.withdrawals.push(
    {
      id: SEED.withdrawalId,
      contractor_id: CONTRACTOR_ID,
      amount: 500,
      status: "pending",
      bank_account_id: "bank-001",
      processed_at: null,
      failure_message: null,
      created_at: ts(-86400000),
      updated_at: ts(-86400000),
    },
    {
      id: "withdrawal-002",
      contractor_id: CONTRACTOR_ID,
      amount: 1000,
      status: "processing",
      bank_account_id: "bank-001",
      processed_at: null,
      failure_message: null,
      created_at: ts(-86400000 * 5),
      updated_at: ts(-86400000 * 2),
    },
    {
      id: "withdrawal-003",
      contractor_id: "contractor-002",
      amount: 200,
      status: "completed",
      bank_account_id: "bank-002",
      processed_at: ts(-86400000 * 3),
      failure_message: null,
      created_at: ts(-86400000 * 7),
      updated_at: ts(-86400000 * 3),
    },
  );

  // === DISPUTES ===
  testStore.disputes.push(
    {
      id: SEED.disputeId,
      job_id: SEED.jobId,
      raised_by: USER_ID,
      raised_by_role: "user",
      reason: "Charged for full service but only partial work done",
      status: "under_review",
      resolution: null,
      resolved_by: null,
      resolved_at: null,
      payment_id: SEED.paymentId,
      refund_status: null,
      created_at: ts(-3600000 * 12),
      updated_at: ts(-3600000 * 12),
    },
    {
      id: "dispute-002",
      job_id: "job-003",
      raised_by: "user-002",
      raised_by_role: "user",
      reason: "Damaged wall during painting",
      status: "resolved",
      resolution: "refund_issued",
      resolved_by: ADMIN_ID,
      resolved_at: ts(-86400000 * 6),
      payment_id: "payment-002",
      refund_status: "completed",
      created_at: ts(-86400000 * 8),
      updated_at: ts(-86400000 * 6),
    },
  );

  // === DISPUTE EVIDENCE ===
  testStore.disputeEvidence.push(
    {
      id: "evidence-001",
      dispute_id: SEED.disputeId,
      file_url: "https://storage.example.com/dispute/evidence1.jpg",
      file_name: "damage_photo.jpg",
      file_size: 245000,
      file_type: "image/jpeg",
      uploaded_by: USER_ID,
      uploaded_at: ts(-3600000 * 10),
    },
    {
      id: "evidence-002",
      dispute_id: SEED.disputeId,
      file_url: "https://storage.example.com/dispute/evidence2.pdf",
      file_name: "invoice.pdf",
      file_size: 12000,
      file_type: "application/pdf",
      uploaded_by: USER_ID,
      uploaded_at: ts(-3600000 * 9),
    },
  );

  // === DISPUTE EVENTS ===
  testStore.disputeEvents.push(
    {
      id: "de-001",
      dispute_id: SEED.disputeId,
      actor_id: USER_ID,
      actor_role: "user",
      event_type: "created",
      message: "Dispute created by user",
      created_at: ts(-3600000 * 12),
    },
    {
      id: "de-002",
      dispute_id: SEED.disputeId,
      actor_id: ADMIN_ID,
      actor_role: "admin",
      event_type: "under_review",
      message: "Admin started review",
      created_at: ts(-3600000 * 10),
    },
  );

  // === SUPPORT TICKETS ===
  testStore.supportTickets.push(
    {
      id: SEED.supportTicketId,
      user_id: USER_ID,
      subject: "Payment not reflecting",
      description: "I paid for a service but the contractor says they haven't received payment",
      status: "open",
      priority: "high",
      category: "payment",
      created_at: ts(-86400000 * 2),
      updated_at: ts(-86400000),
      resolved_at: null,
    },
    {
      id: "ticket-002",
      user_id: CONTRACTOR_ID,
      subject: "Account verification delay",
      description: "My documents have been pending for 5 days",
      status: "in_review",
      priority: "medium",
      category: "account",
      created_at: ts(-86400000 * 3),
      updated_at: ts(-86400000),
      resolved_at: null,
    },
    {
      id: "ticket-003",
      user_id: "user-002",
      subject: "Wrong charge applied",
      description: "Was charged premium rate for standard service",
      status: "resolved",
      priority: "low",
      category: "billing",
      created_at: ts(-86400000 * 10),
      updated_at: ts(-86400000 * 8),
      resolved_at: ts(-86400000 * 8),
    },
  );

  // === SUPPORT TICKET EVENTS ===
  testStore.supportTicketEvents.push(
    {
      id: "ste-001",
      ticket_id: SEED.supportTicketId,
      actor_id: USER_ID,
      actor_role: "user",
      event_type: "created",
      message: "Ticket created",
      created_at: ts(-86400000 * 2),
    },
    {
      id: "ste-002",
      ticket_id: SEED.supportTicketId,
      actor_id: ADMIN_ID,
      actor_role: "admin",
      event_type: "status_changed",
      message: "Admin changed status to in_review",
      metadata: { next_status: "in_review" },
      created_at: ts(-86400000),
    },
  );

  // === SUPPORT MESSAGES ===
  testStore.supportMessages.push(
    {
      id: "msg-001",
      ticket_id: SEED.supportTicketId,
      sender_id: USER_ID,
      sender_role: "user",
      content: "Hi, I need help with my payment issue.",
      read_by_admins: {},
      created_at: ts(-86400000 * 2),
    },
    {
      id: "msg-002",
      ticket_id: SEED.supportTicketId,
      sender_id: ADMIN_ID,
      sender_role: "admin",
      content: "Hello, I'll look into this right away. Can you provide the transaction ID?",
      read_by_admins: { [ADMIN_ID]: ts(-86400000) },
      created_at: ts(-86400000),
    },
  );

  // === REVIEWS ===
  testStore.reviews.push(
    {
      id: SEED.reviewId,
      job_id: SEED.jobId,
      reviewer_id: USER_ID,
      reviewee_id: CONTRACTOR_ID,
      rating: 4,
      comment: "Good work but arrived 15 minutes late",
      created_at: ts(-86400000),
    },
    {
      id: "review-002",
      job_id: "job-003",
      reviewer_id: "user-002",
      reviewee_id: CONTRACTOR_ID,
      rating: 5,
      comment: "Excellent painting job!",
      created_at: ts(-86400000 * 7),
    },
  );

  // === NOTIFICATIONS ===
  testStore.notifications.push(
    {
      id: SEED.notificationId,
      recipient_id: ADMIN_ID,
      title: "New dispute raised",
      body: "A new dispute has been raised on job #001",
      type: "dispute",
      reference_id: SEED.disputeId,
      read_at: null,
      created_at: ts(-3600000 * 12),
    },
    {
      id: "notif-002",
      recipient_id: ADMIN_ID,
      title: "KYC documents pending",
      body: "Contractor Jane has uploaded KYC documents for review",
      type: "kyc",
      reference_id: CONTRACTOR_ID,
      read_at: ts(-3600000 * 6),
      created_at: ts(-86400000),
    },
    {
      id: "notif-003",
      recipient_id: CONTRACTOR_ID,
      title: "New job available",
      body: "A new plumbing job is available in your area",
      type: "job",
      reference_id: "job-002",
      read_at: null,
      created_at: ts(-3600000 * 2),
    },
  );

  // === SERVICE CATEGORIES ===
  testStore.serviceCategories.push(
    {
      id: SEED.categoryId,
      name: "Plumbing",
      description: "Plumbing services including repairs and installations",
      icon: "Wrench",
      display_order: 1,
      is_active: true,
      created_at: ts(-86400000 * 60),
    },
    {
      id: "cat-002",
      name: "Electrical",
      description: "Electrical services including wiring and repairs",
      icon: "Zap",
      display_order: 2,
      is_active: true,
      created_at: ts(-86400000 * 60),
    },
    {
      id: "cat-003",
      name: "Cleaning",
      description: "Cleaning services for home and office",
      icon: "Sparkles",
      display_order: 3,
      is_active: false,
      created_at: ts(-86400000 * 60),
    },
  );

  // === SERVICE TYPES ===
  testStore.serviceTypes.push(
    {
      id: SEED.serviceTypeId,
      category_id: SEED.categoryId,
      name: "Pipe Repair",
      description: "Fix leaking or burst pipes",
      base_price: 150,
      is_active: true,
      created_at: ts(-86400000 * 30),
    },
    {
      id: "st-002",
      category_id: SEED.categoryId,
      name: "Drain Cleaning",
      description: "Unclog and clean drains",
      base_price: 100,
      is_active: true,
      created_at: ts(-86400000 * 30),
    },
    {
      id: "st-003",
      category_id: "cat-002",
      name: "Wiring",
      description: "Electrical wiring installation and repair",
      base_price: 200,
      is_active: true,
      created_at: ts(-86400000 * 30),
    },
  );

  // === URGENCY TIERS ===
  testStore.urgencyTiers.push(
    {
      id: SEED.urgencyTierId,
      name: "standard",
      label: "Standard",
      description: "Standard service within 24 hours",
      extra_fee: 0,
      contractor_share_percent: 90,
      platform_share_percent: 10,
      display_order: 1,
      is_active: true,
      created_at: ts(-86400000 * 60),
    },
    {
      id: "ut-002",
      name: "urgent",
      label: "Urgent",
      description: "Service within 4 hours",
      extra_fee: 50,
      contractor_share_percent: 85,
      platform_share_percent: 15,
      display_order: 2,
      is_active: true,
      created_at: ts(-86400000 * 60),
    },
    {
      id: "ut-003",
      name: "emergency",
      label: "Emergency",
      description: "Immediate service within 1 hour",
      extra_fee: 100,
      contractor_share_percent: 80,
      platform_share_percent: 20,
      display_order: 3,
      is_active: true,
      created_at: ts(-86400000 * 60),
    },
  );

  // === PROMO CODES ===
  testStore.promo.push(
    {
      id: SEED.promoCodeId,
      code: "WELCOME20",
      description: "20% off first service",
      discount_type: "percentage",
      discount_value: 20,
      max_uses: 100,
      current_uses: 45,
      max_uses_per_user: 1,
      min_order_amount: 100,
      is_active: true,
      starts_at: ts(-86400000 * 30),
      expires_at: ts(86400000 * 30),
      created_at: ts(-86400000 * 30),
    },
    {
      id: "promo-002",
      code: "FLAT500",
      description: "₦500 off any service",
      discount_type: "fixed",
      discount_value: 500,
      max_uses: 50,
      current_uses: 12,
      max_uses_per_user: 1,
      min_order_amount: 1000,
      is_active: true,
      starts_at: ts(-86400000 * 15),
      expires_at: ts(86400000 * 15),
      created_at: ts(-86400000 * 15),
    },
    {
      id: "promo-003",
      code: "EXPIRED10",
      description: "10% off (expired)",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: 200,
      current_uses: 200,
      max_uses_per_user: 1,
      min_order_amount: 50,
      is_active: false,
      starts_at: ts(-86400000 * 60),
      expires_at: ts(-86400000 * 1),
      created_at: ts(-86400000 * 60),
    },
  );

  // === NOTIFICATION CAMPAIGNS ===
  testStore.notificationsCampaigns.push(
    {
      id: SEED.campaignId,
      title: "Summer Promotion",
      body: "Get 20% off all cleaning services this summer!",
      template_id: null,
      status: "active",
      scheduled_at: null,
      sent_at: ts(-86400000 * 2),
      created_at: ts(-86400000 * 5),
    },
    {
      id: "campaign-002",
      title: "Welcome New Users",
      body: "Welcome to AidSprint! Enjoy your first service.",
      template_id: null,
      status: "draft",
      scheduled_at: null,
      sent_at: null,
      created_at: ts(-86400000),
    },
  );

  // === ADMIN SECURITY EVENTS ===
  testStore.adminSecurityEvents.push(
    {
      id: "ase-001",
      admin_id: ADMIN_ID,
      event_type: "login",
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0",
      created_at: ts(-3600000 * 2),
    },
    {
      id: "ase-002",
      admin_id: ADMIN_ID,
      event_type: "mfa_verified",
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0",
      created_at: ts(-3600000 * 2),
    },
  );
}

export async function teardownTestData() {
  // Clear in-memory store — clear all arrays
  Object.values(testStore).forEach((arr) => (arr.length = 0));
}

// expose globally for tests
(globalThis as any).__E2E_TEST_STORE__ = testStore;