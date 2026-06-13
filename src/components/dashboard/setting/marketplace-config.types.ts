export type MarketplaceEntityStatus = "Enabled" | "Disabled";

export type ServiceCategoryRecord = {
  id: string;
  name: string;
  status: MarketplaceEntityStatus;
  serviceTypesCount: number;
  updatedAtLabel: string;
};

export type UrgencyTierRecord = {
  id: string;
  label: string;
  multiplier: number;
  status: MarketplaceEntityStatus;
  updatedAtLabel: string;
};

export type ServiceTypeRecord = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  isAdditional: boolean;
  status: MarketplaceEntityStatus;
  updatedAtLabel: string;
};

export type PlatformConfigRecord = {
  key: string;
  value: string;
  description: string;
  updatedAtLabel: string;
};

export type PromoDiscountType = "Percent" | "Amount";

export type PromoRecord = {
  id: string;
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: MarketplaceEntityStatus;
  updatedAtLabel: string;
};

export type NotificationChannel = "Push" | "Email" | "SMS";

export type NotificationCampaignRecord = {
  id: string;
  name: string;
  channel: NotificationChannel;
  status: MarketplaceEntityStatus;
  updatedAtLabel: string;
  description: string;
};
