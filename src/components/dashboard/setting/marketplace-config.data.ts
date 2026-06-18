import type {
  NotificationCampaignRecord,
  NotificationTemplateRecord,
  PromoRecord,
  ServiceCategoryRecord,
  UrgencyTierRecord,
} from "./marketplace-config.types";

export const initialServiceCategories: ServiceCategoryRecord[] = [
  {
    id: "category-plumbing",
    name: "Plumbing",
    status: "Enabled",
    serviceTypesCount: 6,
    updatedAtLabel: "Today, 09:12am",
  },
  {
    id: "category-cleaning",
    name: "Cleaning",
    status: "Enabled",
    serviceTypesCount: 4,
    updatedAtLabel: "Yesterday, 05:44pm",
  },
  {
    id: "category-babysitting",
    name: "Babysitting",
    status: "Disabled",
    serviceTypesCount: 2,
    updatedAtLabel: "Apr 12, 2026",
  },
];

export const initialUrgencyTiers: UrgencyTierRecord[] = [
  {
    id: "tier-standard",
    label: "Standard",
    multiplier: 1,
    status: "Enabled",
    updatedAtLabel: "Today, 09:12am",
  },
  {
    id: "tier-urgent",
    label: "Urgent",
    multiplier: 1.25,
    status: "Enabled",
    updatedAtLabel: "Yesterday, 05:44pm",
  },
  {
    id: "tier-emergency",
    label: "Emergency",
    multiplier: 1.6,
    status: "Enabled",
    updatedAtLabel: "Apr 12, 2026",
  },
];

export const initialPromos: PromoRecord[] = [
  {
    id: "promo-welcome10",
    code: "WELCOME10",
    description: "New user welcome discount",
    discountType: "Percent",
    discountValue: 10,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    status: "Enabled",
    updatedAtLabel: "Today, 10:02am",
  },
  {
    id: "promo-fixed500",
    code: "SAVE500",
    description: "₦500 off selected services",
    discountType: "Amount",
    discountValue: 500,
    startDate: "2026-06-01",
    endDate: "2026-07-15",
    status: "Disabled",
    updatedAtLabel: "Yesterday, 02:20pm",
  },
];

export const initialNotificationCampaigns: NotificationCampaignRecord[] = [
  {
    id: "campaign-new-request",
    name: "New request notifications",
    channel: "Push",
    templateId: "template-admin-dispatch",
    templateName: "Dispatch alert",
    status: "Enabled",
    updatedAtLabel: "Today, 08:00am",
    description: "Notify admins when new requests enter the dispatch queue.",
  },
  {
    id: "campaign-payout-failures",
    name: "Payout failure alerts",
    channel: "Email",
    templateId: "template-payout-failure",
    templateName: "Payout failure alert",
    status: "Enabled",
    updatedAtLabel: "Yesterday, 06:30pm",
    description: "Alert finance ops when payouts fail or are blocked.",
  },
  {
    id: "campaign-kyc-blockers",
    name: "KYC blocker reminders",
    channel: "Push",
    templateId: null,
    status: "Disabled",
    updatedAtLabel: "Apr 12, 2026",
    description: "Remind operations to clear pending verification backlogs.",
  },
];

export const initialNotificationTemplates: NotificationTemplateRecord[] = [
  {
    id: "template-admin-dispatch",
    name: "Dispatch alert",
    channel: "Push",
    titleTemplate: "New request assigned",
    bodyTemplate: "A new request is ready for dispatch review.",
    status: "Enabled",
    updatedAtLabel: "Today, 07:40am",
  },
  {
    id: "template-payout-failure",
    name: "Payout failure alert",
    channel: "Email",
    titleTemplate: "Payout failure detected",
    bodyTemplate: "A contractor payout failed and requires operations review.",
    status: "Enabled",
    updatedAtLabel: "Yesterday, 05:10pm",
  },
];
