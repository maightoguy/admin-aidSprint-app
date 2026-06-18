import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseSettings } from "@/lib/supabase/data";
import {
  mapNotificationCampaignRowsToRecords,
  mapNotificationTemplateRowsToRecords,
  mapPlatformConfigRowsToRecords,
  mapPromoCodeRowsToRecords,
  mapServiceCategoryRowsToRecords,
  mapServiceTypeRowsToRecords,
  mapUrgencyTierRowsToRecords,
} from "@/lib/supabase/mappers";
import { createLogger } from "@/lib/logger";
import {
  initialNotificationCampaigns,
  initialNotificationTemplates,
  initialPromos,
  initialServiceCategories,
  initialUrgencyTiers,
} from "./marketplace-config.data";
import type {
  MarketplaceEntityStatus,
  NotificationCampaignRecord,
  NotificationChannel,
  NotificationTemplateRecord,
  PlatformConfigRecord,
  PromoDiscountType,
  PromoRecord,
  ServiceCategoryRecord,
  ServiceTypeRecord,
  UrgencyTierRecord,
} from "./marketplace-config.types";

const logger = createLogger("MarketplaceConfig");

function isLiveMarketplaceAvailable() {
  return isSupabaseConfigured();
}

type MarketplaceActionTarget =
  | { type: "category"; record: ServiceCategoryRecord }
  | { type: "serviceType"; record: ServiceTypeRecord }
  | { type: "tier"; record: UrgencyTierRecord }
  | { type: "promo"; record: PromoRecord }
  | { type: "notificationTemplate"; record: NotificationTemplateRecord }
  | { type: "notification"; record: NotificationCampaignRecord };

type MarketplaceActionKind =
  | "disable"
  | "enable"
  | "delete"
  | "updateMultiplier";

function getStatusClasses(status: MarketplaceEntityStatus) {
  return status === "Enabled"
    ? "bg-[#ECFDF3] text-[#15803D]"
    : "bg-[#FEF3F2] text-[#B42318]";
}

function formatMultiplier(value: number) {
  return `${value.toFixed(2)}x`;
}

function MarketplaceSectionShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-[#EAECF0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#EAECF0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#101828] sm:text-[20px]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#98A2B3]">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmTone,
  reasonLabel,
  reason,
  onReasonChange,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone: "danger" | "primary";
  reasonLabel: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const canConfirm = Boolean(reason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[560px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            {description}
          </DialogDescription>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#344054]">
              {reasonLabel}
            </label>
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="mt-2 min-h-[132px]"
              aria-label={reasonLabel}
              placeholder="Enter a reason"
            />
            {!canConfirm ? (
              <p className="mt-2 text-xs font-medium text-[#B42318]">
                A reason is required.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={onConfirm}
              className={cn(
                "inline-flex items-center justify-center rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                confirmTone === "danger"
                  ? "bg-[#F04438] hover:bg-[#D92D20]"
                  : "bg-[#071B58] hover:bg-[#0C2877]",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryEditorDialog({
  open,
  mode,
  initialName,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialName: string;
  onSubmit: (name: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);

  const validName = Boolean(name.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setName(initialName);
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[560px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "create" ? "Add category" : "Edit category"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            {mode === "create"
              ? "Create a service category used by the marketplace."
              : "Update the category name and keep it backend-ready."}
          </DialogDescription>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#344054]">
              Category name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Plumbing"
              className="mt-2"
              aria-label="Category name"
            />
            {touched && !validName ? (
              <p className="mt-2 text-xs font-medium text-[#B42318]">
                Enter a category name.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!validName) return;
                onSubmit(name.trim());
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
            >
              {mode === "create" ? "Create category" : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlatformConfigEditorDialog({
  open,
  mode,
  initialKey,
  initialValue,
  initialDescription,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialKey: string;
  initialValue: string;
  initialDescription: string;
  onSubmit: (values: {
    key: string;
    value: string;
    description: string;
  }) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState(initialValue);
  const [description, setDescription] = useState(initialDescription);
  const [touched, setTouched] = useState(false);

  const valid = Boolean(key.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setKey(initialKey);
          setValue(initialValue);
          setDescription(initialDescription);
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[640px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "create" ? "Add platform config" : "Edit platform config"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            {mode === "create"
              ? "Create a platform config key used by the marketplace."
              : "Update the platform config value while keeping the key stable."}
          </DialogDescription>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Key
              </label>
              <Input
                value={key}
                onChange={(event) => setKey(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="e.g. marketplace_min_order_value"
                className="mt-2"
                aria-label="Platform config key"
                disabled={mode === "edit"}
              />
              {touched && !valid ? (
                <p className="mt-2 text-xs font-medium text-[#B42318]">
                  Enter a config key.
                </p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Value
              </label>
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="mt-2"
                aria-label="Platform config value"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 min-h-[110px]"
                aria-label="Platform config description"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!valid) return;
                onSubmit({
                  key: key.trim(),
                  value,
                  description: description.trim(),
                });
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
            >
              {mode === "create" ? "Create key" : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ServiceTypeEditorDialog({
  open,
  mode,
  initial,
  categories,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: {
    categoryId: string;
    name: string;
    basePrice: number;
    isAdditional: boolean;
  };
  categories: ServiceCategoryRecord[];
  onSubmit: (values: {
    categoryId: string;
    name: string;
    basePrice: number;
    isAdditional: boolean;
  }) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [name, setName] = useState(initial.name);
  const [basePrice, setBasePrice] = useState(String(initial.basePrice));
  const [isAdditional, setIsAdditional] = useState(initial.isAdditional);
  const [touched, setTouched] = useState(false);

  const parsedBasePrice = Number(basePrice);
  const valid =
    Boolean(name.trim()) &&
    Boolean(categoryId.trim()) &&
    Number.isFinite(parsedBasePrice) &&
    parsedBasePrice >= 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setCategoryId(initial.categoryId);
          setName(initial.name);
          setBasePrice(String(initial.basePrice));
          setIsAdditional(initial.isAdditional);
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[640px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "create" ? "Add service type" : "Edit service type"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            {mode === "create"
              ? "Create a service type under an existing category."
              : "Update the service type details while keeping it backend-ready."}
          </DialogDescription>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                onBlur={() => setTouched(true)}
                aria-label="Service type category"
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Name
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="e.g. Faucet installation"
                className="mt-2"
                aria-label="Service type name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                Base price
              </label>
              <Input
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="0.00"
                className="mt-2"
                aria-label="Service type base price"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                Pricing
              </label>
              <button
                type="button"
                onClick={() => setIsAdditional((prev) => !prev)}
                className={cn(
                  "mt-2 inline-flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm font-semibold",
                  isAdditional
                    ? "border-[#071B58] bg-[#EFF8FF] text-[#071B58]"
                    : "border-[#D0D5DD] bg-white text-[#344054]",
                )}
                aria-label="Toggle additional pricing"
              >
                {isAdditional ? "Additional pricing" : "Base pricing"}
              </button>
            </div>
          </div>

          {touched && !valid ? (
            <p className="mt-3 text-xs font-medium text-[#B42318]">
              Fill all fields with valid values.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!valid) return;
                onSubmit({
                  categoryId: categoryId.trim(),
                  name: name.trim(),
                  basePrice: parsedBasePrice,
                  isAdditional,
                });
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
            >
              {mode === "create" ? "Create service type" : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TierMultiplierDialog({
  open,
  tier,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  tier: UrgencyTierRecord | null;
  onSubmit: (nextMultiplier: number, reason: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [multiplier, setMultiplier] = useState<string>("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const parsed = Number(multiplier);
  const validMultiplier = Number.isFinite(parsed) && parsed > 0;
  const canConfirm = Boolean(reason.trim()) && validMultiplier;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next && tier) {
          setMultiplier(String(tier.multiplier));
          setReason("");
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[560px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            Update urgency multiplier
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            Capture a reason when changing pricing behavior.
          </DialogDescription>

          <div className="mt-5 rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3">
            <p className="text-sm font-semibold text-[#101828]">
              {tier?.label ?? "Tier"}
            </p>
            <p className="mt-1 text-sm text-[#667085]">
              Current multiplier{" "}
              {tier ? formatMultiplier(tier.multiplier) : "—"}
            </p>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#344054]">
              New multiplier
            </label>
            <Input
              type="number"
              step="0.01"
              value={multiplier}
              onChange={(event) => setMultiplier(event.target.value)}
              onBlur={() => setTouched(true)}
              className="mt-2"
              aria-label="New multiplier"
            />
            {touched && !validMultiplier ? (
              <p className="mt-2 text-xs font-medium text-[#B42318]">
                Enter a valid multiplier greater than 0.
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#344054]">
              Reason for change
            </label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 min-h-[120px]"
              aria-label="Reason for change"
              placeholder="Explain why this multiplier is changing"
            />
            {!reason.trim() ? (
              <p className="mt-2 text-xs font-medium text-[#B42318]">
                A reason is required.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => {
                if (!validMultiplier) {
                  setTouched(true);
                  return;
                }
                if (!reason.trim()) {
                  return;
                }
                onSubmit(parsed, reason.trim());
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirm update
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PromoEditorDialog({
  open,
  mode,
  initialPromo,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialPromo: PromoRecord;
  onSubmit: (promo: PromoRecord) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState(initialPromo.code);
  const [description, setDescription] = useState(initialPromo.description);
  const [discountType, setDiscountType] = useState<PromoDiscountType>(
    initialPromo.discountType,
  );
  const [discountValue, setDiscountValue] = useState(
    String(initialPromo.discountValue),
  );
  const [startDate, setStartDate] = useState(initialPromo.startDate);
  const [endDate, setEndDate] = useState(initialPromo.endDate);
  const [touched, setTouched] = useState(false);

  const parsedValue = Number(discountValue);
  const valid =
    Boolean(code.trim()) &&
    Boolean(description.trim()) &&
    Boolean(startDate.trim()) &&
    Boolean(endDate.trim()) &&
    Number.isFinite(parsedValue) &&
    parsedValue > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setCode(initialPromo.code);
          setDescription(initialPromo.description);
          setDiscountType(initialPromo.discountType);
          setDiscountValue(String(initialPromo.discountValue));
          setStartDate(initialPromo.startDate);
          setEndDate(initialPromo.endDate);
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[640px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "create" ? "Create promo" : "Edit promo"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            Promos are currently local-only in the admin UI. Saving does not
            persist to the database yet.
          </DialogDescription>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                Promo code
              </label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onBlur={() => setTouched(true)}
                placeholder="e.g. WELCOME10"
                className="mt-2"
                aria-label="Promo code"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                Discount type
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["Percent", "Amount"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDiscountType(value)}
                    className={cn(
                      "h-11 rounded-[10px] border px-3 text-sm font-semibold transition",
                      discountType === value
                        ? "border-[#071B58] bg-white text-[#101828]"
                        : "border-[#EAECF0] bg-[#FCFCFD] text-[#667085] hover:bg-[#F8FAFC]",
                    )}
                    aria-pressed={discountType === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                Discount value
              </label>
              <Input
                type="number"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2"
                aria-label="Discount value"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Description
              </label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2"
                aria-label="Promo description"
                placeholder="What does this promo do?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                Start date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2"
                aria-label="Promo start date"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054]">
                End date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2"
                aria-label="Promo end date"
              />
            </div>
          </div>

          {touched && !valid ? (
            <p className="mt-3 text-xs font-medium text-[#B42318]">
              Fill all fields with valid values.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!valid) return;
                onSubmit({
                  ...initialPromo,
                  code: code.trim().toUpperCase(),
                  description: description.trim(),
                  discountType,
                  discountValue: parsedValue,
                  startDate,
                  endDate,
                  updatedAtLabel: "Just now",
                });
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
            >
              {mode === "create" ? "Create promo" : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotificationTemplateEditorDialog({
  open,
  mode,
  initialTemplate,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialTemplate: NotificationTemplateRecord;
  onSubmit: (template: NotificationTemplateRecord) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(initialTemplate.name);
  const [channel, setChannel] = useState<NotificationChannel>(
    initialTemplate.channel,
  );
  const [titleTemplate, setTitleTemplate] = useState(
    initialTemplate.titleTemplate,
  );
  const [bodyTemplate, setBodyTemplate] = useState(
    initialTemplate.bodyTemplate,
  );
  const [touched, setTouched] = useState(false);

  const valid = Boolean(name.trim()) && Boolean(bodyTemplate.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setName(initialTemplate.name);
          setChannel(initialTemplate.channel);
          setTitleTemplate(initialTemplate.titleTemplate);
          setBodyTemplate(initialTemplate.bodyTemplate);
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[640px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "create"
              ? "Create notification template"
              : "Edit notification template"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            Notification templates are stored in Supabase when live integration
            is available.
          </DialogDescription>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Template name
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2"
                aria-label="Notification template name"
                placeholder="e.g. Dispatch alert"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Channel
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["Push", "Email", "SMS"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChannel(value)}
                    className={cn(
                      "h-11 rounded-[10px] border px-3 text-sm font-semibold transition",
                      channel === value
                        ? "border-[#071B58] bg-white text-[#101828]"
                        : "border-[#EAECF0] bg-[#FCFCFD] text-[#667085] hover:bg-[#F8FAFC]",
                    )}
                    aria-pressed={channel === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Title template
              </label>
              <Input
                value={titleTemplate}
                onChange={(event) => setTitleTemplate(event.target.value)}
                className="mt-2"
                aria-label="Notification template title"
                placeholder="Optional notification title"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Body template
              </label>
              <Textarea
                value={bodyTemplate}
                onChange={(event) => setBodyTemplate(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2 min-h-[130px]"
                aria-label="Notification template body"
                placeholder="Write the message body"
              />
            </div>
          </div>

          {touched && !valid ? (
            <p className="mt-3 text-xs font-medium text-[#B42318]">
              Enter a template name and body.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!valid) return;
                onSubmit({
                  ...initialTemplate,
                  name: name.trim(),
                  channel,
                  titleTemplate: titleTemplate.trim(),
                  bodyTemplate: bodyTemplate.trim(),
                  updatedAtLabel: "Just now",
                });
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
            >
              {mode === "create" ? "Create template" : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotificationCampaignEditorDialog({
  open,
  mode,
  initialCampaign,
  templates,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialCampaign: NotificationCampaignRecord;
  templates: NotificationTemplateRecord[];
  onSubmit: (campaign: NotificationCampaignRecord) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(initialCampaign.name);
  const [channel, setChannel] = useState<NotificationChannel>(
    initialCampaign.channel,
  );
  const [templateId, setTemplateId] = useState(
    initialCampaign.templateId ?? "",
  );
  const [description, setDescription] = useState(initialCampaign.description);
  const [touched, setTouched] = useState(false);

  const valid = Boolean(name.trim()) && Boolean(description.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setName(initialCampaign.name);
          setChannel(initialCampaign.channel);
          setTemplateId(initialCampaign.templateId ?? "");
          setDescription(initialCampaign.description);
          setTouched(false);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-32px)] max-w-[640px] rounded-[20px] border border-[#EAECF0] bg-white p-0">
        <div className="px-6 py-6">
          <DialogTitle className="text-xl font-bold text-[#101828]">
            {mode === "create"
              ? "Create notification campaign"
              : "Edit notification campaign"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[#667085]">
            Campaigns can be linked to a stored notification template when one
            is available.
          </DialogDescription>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Campaign name
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2"
                aria-label="Notification campaign name"
                placeholder="e.g. New request notifications"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Channel
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["Push", "Email", "SMS"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChannel(value)}
                    className={cn(
                      "h-11 rounded-[10px] border px-3 text-sm font-semibold transition",
                      channel === value
                        ? "border-[#071B58] bg-white text-[#101828]"
                        : "border-[#EAECF0] bg-[#FCFCFD] text-[#667085] hover:bg-[#F8FAFC]",
                    )}
                    aria-pressed={channel === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Template
              </label>
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                aria-label="Notification campaign template"
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No linked template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#344054]">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => setTouched(true)}
                className="mt-2 min-h-[130px]"
                aria-label="Notification campaign description"
                placeholder="What does this campaign do?"
              />
            </div>
          </div>

          {touched && !valid ? (
            <p className="mt-3 text-xs font-medium text-[#B42318]">
              Enter a campaign name and description.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#D0D5DD] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!valid) return;
                const templateName = templates.find(
                  (template) => template.id === templateId,
                )?.name;
                onSubmit({
                  ...initialCampaign,
                  name: name.trim(),
                  channel,
                  templateId: templateId || null,
                  templateName,
                  description: description.trim(),
                  updatedAtLabel: "Just now",
                });
              }}
              className="inline-flex items-center justify-center rounded-[10px] bg-[#071B58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0C2877]"
            >
              {mode === "create" ? "Create campaign" : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MarketplaceConfigTab() {
  const [categories, setCategories] = useState<ServiceCategoryRecord[]>(
    initialServiceCategories,
  );
  const [tiers, setTiers] = useState<UrgencyTierRecord[]>(initialUrgencyTiers);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeRecord[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfigRecord[]>(
    [],
  );
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>(
    initialNotificationTemplates,
  );
  const [promos, setPromos] = useState<PromoRecord[]>(initialPromos);
  const [campaigns, setCampaigns] = useState<NotificationCampaignRecord[]>(
    initialNotificationCampaigns,
  );

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] =
    useState<ServiceCategoryRecord | null>(null);

  const [serviceTypeDialogOpen, setServiceTypeDialogOpen] = useState(false);
  const [serviceTypeMode, setServiceTypeMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingServiceType, setEditingServiceType] =
    useState<ServiceTypeRecord | null>(null);

  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<UrgencyTierRecord | null>(
    null,
  );

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configMode, setConfigMode] = useState<"create" | "edit">("create");
  const [editingConfig, setEditingConfig] =
    useState<PlatformConfigRecord | null>(null);

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promoMode, setPromoMode] = useState<"create" | "edit">("create");
  const [editingPromo, setEditingPromo] = useState<PromoRecord | null>(null);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplateRecord | null>(null);

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignMode, setCampaignMode] = useState<"create" | "edit">("create");
  const [editingCampaign, setEditingCampaign] =
    useState<NotificationCampaignRecord | null>(null);

  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveDataMode, setLiveDataMode] = useState<"fallback" | "live">(
    "fallback",
  );
  const [platformConfigCount, setPlatformConfigCount] = useState<number | null>(
    null,
  );
  const [liveServiceTypeCount, setLiveServiceTypeCount] = useState<
    number | null
  >(null);
  const [livePromoCount, setLivePromoCount] = useState<number | null>(null);
  const [liveNotificationTemplateCount, setLiveNotificationTemplateCount] =
    useState<number | null>(null);
  const [liveNotificationCampaignCount, setLiveNotificationCampaignCount] =
    useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    kind: MarketplaceActionKind;
    target: MarketplaceActionTarget;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveMarketplaceReadData() {
      if (!isLiveMarketplaceAvailable()) {
        return;
      }

      setIsLiveLoading(true);
      setLiveError(null);

      try {
        const [
          configResult,
          categoriesResult,
          serviceTypesResult,
          tiersResult,
          promosResult,
          templatesResult,
          campaignsResult,
        ] = await Promise.all([
          supabaseSettings.listPlatformConfig(),
          supabaseSettings.listServiceCategories(),
          supabaseSettings.listServiceTypes(),
          supabaseSettings.listUrgencyTiers(),
          supabaseSettings.listPromoCodes(),
          supabaseSettings.listNotificationTemplates(),
          supabaseSettings.listNotificationCampaigns(),
        ]);

        if (configResult.ok === false) {
          throw new Error(configResult.message);
        }
        if (categoriesResult.ok === false) {
          throw new Error(categoriesResult.message);
        }
        if (serviceTypesResult.ok === false) {
          throw new Error(serviceTypesResult.message);
        }
        if (tiersResult.ok === false) {
          throw new Error(tiersResult.message);
        }
        if (promosResult.ok === false) {
          throw new Error(promosResult.message);
        }
        if (templatesResult.ok === false) {
          throw new Error(templatesResult.message);
        }
        if (campaignsResult.ok === false) {
          throw new Error(campaignsResult.message);
        }

        if (cancelled) {
          return;
        }

        setCategories(
          mapServiceCategoryRowsToRecords({
            categories: categoriesResult.data,
            serviceTypes: serviceTypesResult.data,
          }),
        );
        setServiceTypes(
          mapServiceTypeRowsToRecords({
            categories: categoriesResult.data,
            serviceTypes: serviceTypesResult.data,
          }),
        );
        setTiers(mapUrgencyTierRowsToRecords(tiersResult.data));
        setPlatformConfig(mapPlatformConfigRowsToRecords(configResult.data));
        setPromos(mapPromoCodeRowsToRecords(promosResult.data));
        setTemplates(
          mapNotificationTemplateRowsToRecords(templatesResult.data),
        );
        setCampaigns(
          mapNotificationCampaignRowsToRecords({
            campaigns: campaignsResult.data,
            templates: templatesResult.data,
          }),
        );
        setLiveDataMode("live");
        setPlatformConfigCount(configResult.data.length);
        setLiveServiceTypeCount(serviceTypesResult.data.length);
        setLivePromoCount(promosResult.data.length);
        setLiveNotificationTemplateCount(templatesResult.data.length);
        setLiveNotificationCampaignCount(campaignsResult.data.length);
      } catch (error) {
        if (cancelled) {
          return;
        }

        logger.error("Failed to load live marketplace settings.", error);
        setLiveError(
          error instanceof Error
            ? error.message
            : "Unable to load live marketplace settings right now.",
        );
      } finally {
        if (!cancelled) {
          setIsLiveLoading(false);
        }
      }
    }

    void loadLiveMarketplaceReadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadLiveMarketplaceData = async () => {
    if (!isLiveMarketplaceAvailable()) {
      return;
    }

    setIsLiveLoading(true);
    setLiveError(null);

    try {
      const [
        configResult,
        categoriesResult,
        serviceTypesResult,
        tiersResult,
        promosResult,
        templatesResult,
        campaignsResult,
      ] = await Promise.all([
        supabaseSettings.listPlatformConfig(),
        supabaseSettings.listServiceCategories(),
        supabaseSettings.listServiceTypes(),
        supabaseSettings.listUrgencyTiers(),
        supabaseSettings.listPromoCodes(),
        supabaseSettings.listNotificationTemplates(),
        supabaseSettings.listNotificationCampaigns(),
      ]);

      if (configResult.ok === false) throw new Error(configResult.message);
      if (categoriesResult.ok === false)
        throw new Error(categoriesResult.message);
      if (serviceTypesResult.ok === false)
        throw new Error(serviceTypesResult.message);
      if (tiersResult.ok === false) throw new Error(tiersResult.message);
      if (promosResult.ok === false) throw new Error(promosResult.message);
      if (templatesResult.ok === false)
        throw new Error(templatesResult.message);
      if (campaignsResult.ok === false)
        throw new Error(campaignsResult.message);

      setCategories(
        mapServiceCategoryRowsToRecords({
          categories: categoriesResult.data,
          serviceTypes: serviceTypesResult.data,
        }),
      );
      setServiceTypes(
        mapServiceTypeRowsToRecords({
          categories: categoriesResult.data,
          serviceTypes: serviceTypesResult.data,
        }),
      );
      setTiers(mapUrgencyTierRowsToRecords(tiersResult.data));
      setPlatformConfig(mapPlatformConfigRowsToRecords(configResult.data));
      setPromos(mapPromoCodeRowsToRecords(promosResult.data));
      setTemplates(mapNotificationTemplateRowsToRecords(templatesResult.data));
      setCampaigns(
        mapNotificationCampaignRowsToRecords({
          campaigns: campaignsResult.data,
          templates: templatesResult.data,
        }),
      );
      setLiveDataMode("live");
      setPlatformConfigCount(configResult.data.length);
      setLiveServiceTypeCount(serviceTypesResult.data.length);
      setLivePromoCount(promosResult.data.length);
      setLiveNotificationTemplateCount(templatesResult.data.length);
      setLiveNotificationCampaignCount(campaignsResult.data.length);
    } catch (error) {
      logger.error("Failed to reload live marketplace settings.", error);
      setLiveError(
        error instanceof Error
          ? error.message
          : "Unable to load live marketplace settings right now.",
      );
    } finally {
      setIsLiveLoading(false);
    }
  };

  const reasonDialogCopy = useMemo(() => {
    if (!pendingAction) {
      return null;
    }

    const name =
      pendingAction.target.type === "category"
        ? pendingAction.target.record.name
        : pendingAction.target.type === "serviceType"
          ? pendingAction.target.record.name
          : pendingAction.target.type === "tier"
            ? pendingAction.target.record.label
            : pendingAction.target.type === "promo"
              ? pendingAction.target.record.code
              : pendingAction.target.record.name;

    if (pendingAction.kind === "disable") {
      return {
        title: "Disable configuration",
        description: `Disabling ${name} removes it from active marketplace operations.`,
        confirmLabel: "Confirm disable",
        confirmTone: "danger" as const,
        reasonLabel: "Disable reason",
      };
    }

    if (pendingAction.kind === "delete") {
      return {
        title: "Delete configuration",
        description: `Deleting ${name} is destructive and should be audit-ready.`,
        confirmLabel: "Confirm delete",
        confirmTone: "danger" as const,
        reasonLabel: "Delete reason",
      };
    }

    return {
      title: "Enable configuration",
      description: `Enabling ${name} returns it to active marketplace operations.`,
      confirmLabel: "Confirm enable",
      confirmTone: "primary" as const,
      reasonLabel: "Reason",
    };
  }, [pendingAction]);

  const applyToggle = (
    status: MarketplaceEntityStatus,
    action: "enable" | "disable",
  ): MarketplaceEntityStatus => {
    if (action === "enable") return "Enabled";
    return "Disabled";
  };

  const openReasonDialog = (
    kind: MarketplaceActionKind,
    target: MarketplaceActionTarget,
  ) => {
    setPendingAction({ kind, target });
    setReason("");
    setReasonDialogOpen(true);
  };

  const confirmReasonAction = async () => {
    if (!pendingAction || !reason.trim()) {
      return;
    }

    const trimmedReason = reason.trim();
    const { kind, target } = pendingAction;
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (target.type === "category") {
      if (kind === "disable" || kind === "enable") {
        if (isLiveWriteFlow) {
          const updateResult = await supabaseSettings.updateServiceCategory({
            id: target.record.id,
            isActive: kind === "enable",
          });

          if (updateResult.ok === false) {
            toast.error("Unable to update category", {
              description: updateResult.message,
            });
            return;
          }

          await reloadLiveMarketplaceData();
        } else {
          setCategories((prev) =>
            prev.map((item) =>
              item.id === target.record.id
                ? {
                    ...item,
                    status: applyToggle(
                      item.status,
                      kind === "enable" ? "enable" : "disable",
                    ),
                    updatedAtLabel: "Just now",
                  }
                : item,
            ),
          );
        }

        toast.success("Category updated", { description: trimmedReason });
      }
    }

    if (target.type === "serviceType") {
      if (kind === "disable" || kind === "enable") {
        if (isLiveWriteFlow) {
          const updateResult = await supabaseSettings.updateServiceType({
            id: target.record.id,
            isActive: kind === "enable",
          });

          if (updateResult.ok === false) {
            toast.error("Unable to update service type", {
              description: updateResult.message,
            });
            return;
          }

          await reloadLiveMarketplaceData();
        } else {
          setServiceTypes((prev) =>
            prev.map((item) =>
              item.id === target.record.id
                ? {
                    ...item,
                    status: applyToggle(
                      item.status,
                      kind === "enable" ? "enable" : "disable",
                    ),
                    updatedAtLabel: "Just now",
                  }
                : item,
            ),
          );
        }

        toast.success("Service type updated", { description: trimmedReason });
      }
    }

    if (target.type === "tier") {
      if (kind === "disable" || kind === "enable") {
        if (isLiveWriteFlow) {
          const updateResult = await supabaseSettings.updateUrgencyTier({
            id: target.record.id,
            isActive: kind === "enable",
          });

          if (updateResult.ok === false) {
            toast.error("Unable to update tier", {
              description: updateResult.message,
            });
            return;
          }

          await reloadLiveMarketplaceData();
        } else {
          setTiers((prev) =>
            prev.map((item) =>
              item.id === target.record.id
                ? {
                    ...item,
                    status: applyToggle(
                      item.status,
                      kind === "enable" ? "enable" : "disable",
                    ),
                    updatedAtLabel: "Just now",
                  }
                : item,
            ),
          );
        }

        toast.success("Tier updated", { description: trimmedReason });
      }
    }

    if (target.type === "promo") {
      if (kind === "delete") {
        if (isLiveWriteFlow) {
          const result = await supabaseSettings.deletePromoCode(
            target.record.id,
          );
          if (result.ok === false) {
            toast.error("Unable to delete promo", {
              description: result.message,
            });
            return;
          }
          await reloadLiveMarketplaceData();
          toast.success("Promo deleted", { description: trimmedReason });
        } else {
          setPromos((prev) =>
            prev.filter((item) => item.id !== target.record.id),
          );
          toast.info("Promo deleted", {
            description: `${trimmedReason} Saved locally in fallback mode.`,
          });
        }
      } else if (kind === "disable" || kind === "enable") {
        if (isLiveWriteFlow) {
          const result = await supabaseSettings.updatePromoCode({
            id: target.record.id,
            isActive: kind === "enable",
          });
          if (result.ok === false) {
            toast.error("Unable to update promo", {
              description: result.message,
            });
            return;
          }
          await reloadLiveMarketplaceData();
          toast.success("Promo updated", { description: trimmedReason });
        } else {
          setPromos((prev) =>
            prev.map((item) =>
              item.id === target.record.id
                ? {
                    ...item,
                    status: applyToggle(
                      item.status,
                      kind === "enable" ? "enable" : "disable",
                    ),
                    updatedAtLabel: "Just now",
                  }
                : item,
            ),
          );
          toast.info("Promo updated", {
            description: `${trimmedReason} Saved locally in fallback mode.`,
          });
        }
      }
    }

    if (target.type === "notificationTemplate") {
      if (kind === "disable" || kind === "enable") {
        if (isLiveWriteFlow) {
          const result = await supabaseSettings.updateNotificationTemplate({
            id: target.record.id,
            isActive: kind === "enable",
          });
          if (result.ok === false) {
            toast.error("Unable to update template", {
              description: result.message,
            });
            return;
          }
          await reloadLiveMarketplaceData();
          toast.success("Template updated", { description: trimmedReason });
        } else {
          setTemplates((prev) =>
            prev.map((item) =>
              item.id === target.record.id
                ? {
                    ...item,
                    status: applyToggle(
                      item.status,
                      kind === "enable" ? "enable" : "disable",
                    ),
                    updatedAtLabel: "Just now",
                  }
                : item,
            ),
          );
          toast.info("Template updated", {
            description: `${trimmedReason} Saved locally in fallback mode.`,
          });
        }
      }
    }

    if (target.type === "notification") {
      if (kind === "disable" || kind === "enable") {
        if (isLiveWriteFlow) {
          const result = await supabaseSettings.updateNotificationCampaign({
            id: target.record.id,
            status: kind === "enable" ? "enabled" : "disabled",
          });
          if (result.ok === false) {
            toast.error("Unable to update campaign", {
              description: result.message,
            });
            return;
          }
          await reloadLiveMarketplaceData();
          toast.success("Campaign updated", { description: trimmedReason });
        } else {
          setCampaigns((prev) =>
            prev.map((item) =>
              item.id === target.record.id
                ? {
                    ...item,
                    status: applyToggle(
                      item.status,
                      kind === "enable" ? "enable" : "disable",
                    ),
                    updatedAtLabel: "Just now",
                  }
                : item,
            ),
          );
          toast.info("Campaign updated", {
            description: `${trimmedReason} Saved locally in fallback mode.`,
          });
        }
      }
    }

    setReasonDialogOpen(false);
    setPendingAction(null);
    setReason("");
  };

  const createEmptyPromo = (): PromoRecord => ({
    id: `promo-${Math.random().toString(16).slice(2, 10)}`,
    code: "",
    description: "",
    discountType: "Percent",
    discountValue: 10,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    status: "Enabled",
    updatedAtLabel: "Just now",
  });

  const createEmptyTemplate = (): NotificationTemplateRecord => ({
    id: `template-${Math.random().toString(16).slice(2, 10)}`,
    name: "",
    channel: "Push",
    titleTemplate: "",
    bodyTemplate: "",
    status: "Enabled",
    updatedAtLabel: "Just now",
  });

  const createEmptyCampaign = (): NotificationCampaignRecord => ({
    id: `campaign-${Math.random().toString(16).slice(2, 10)}`,
    name: "",
    channel: "Push",
    templateId: null,
    templateName: undefined,
    status: "Enabled",
    updatedAtLabel: "Just now",
    description: "",
  });

  const openCreateCategory = () => {
    setCategoryMode("create");
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (category: ServiceCategoryRecord) => {
    setCategoryMode("edit");
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const openCreateServiceType = () => {
    setServiceTypeMode("create");
    setEditingServiceType(null);
    setServiceTypeDialogOpen(true);
  };

  const openEditServiceType = (serviceType: ServiceTypeRecord) => {
    setServiceTypeMode("edit");
    setEditingServiceType(serviceType);
    setServiceTypeDialogOpen(true);
  };

  const openUpdateTier = (tier: UrgencyTierRecord) => {
    setEditingTier(tier);
    setTierDialogOpen(true);
  };

  const openCreatePlatformConfig = () => {
    setConfigMode("create");
    setEditingConfig(null);
    setConfigDialogOpen(true);
  };

  const openEditPlatformConfig = (config: PlatformConfigRecord) => {
    setConfigMode("edit");
    setEditingConfig(config);
    setConfigDialogOpen(true);
  };

  const openCreatePromo = () => {
    setPromoMode("create");
    setEditingPromo(createEmptyPromo());
    setPromoDialogOpen(true);
  };

  const openEditPromo = (promo: PromoRecord) => {
    setPromoMode("edit");
    setEditingPromo(promo);
    setPromoDialogOpen(true);
  };

  const openCreateTemplate = () => {
    setTemplateMode("create");
    setEditingTemplate(createEmptyTemplate());
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (template: NotificationTemplateRecord) => {
    setTemplateMode("edit");
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const openCreateCampaign = () => {
    setCampaignMode("create");
    setEditingCampaign(createEmptyCampaign());
    setCampaignDialogOpen(true);
  };

  const openEditCampaign = (campaign: NotificationCampaignRecord) => {
    setCampaignMode("edit");
    setEditingCampaign(campaign);
    setCampaignDialogOpen(true);
  };

  const handlePromoSubmit = async (promo: PromoRecord) => {
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (isLiveWriteFlow) {
      if (promoMode === "create") {
        const result = await supabaseSettings.createPromoCode({
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType === "Amount" ? "amount" : "percent",
          discountValue: promo.discountValue,
          startsOn: promo.startDate,
          endsOn: promo.endDate,
          isActive: promo.status === "Enabled",
        });

        if (result.ok === false) {
          toast.error("Unable to create promo", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Promo created", {
          description: `${promo.code} is now available.`,
        });
      } else if (editingPromo) {
        const result = await supabaseSettings.updatePromoCode({
          id: editingPromo.id,
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType === "Amount" ? "amount" : "percent",
          discountValue: promo.discountValue,
          startsOn: promo.startDate,
          endsOn: promo.endDate,
          isActive: promo.status === "Enabled",
        });

        if (result.ok === false) {
          toast.error("Unable to update promo", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Promo updated", {
          description: `${promo.code} has been saved.`,
        });
      }
    } else {
      setPromos((prev) => {
        const exists = prev.some((item) => item.id === promo.id);
        if (exists) {
          return prev.map((item) => (item.id === promo.id ? promo : item));
        }
        return [promo, ...prev];
      });
      toast.info("Promo saved", {
        description: `${promo.code} saved locally in fallback mode.`,
      });
    }

    setPromoDialogOpen(false);
    setEditingPromo(null);
  };

  const handleTemplateSubmit = async (template: NotificationTemplateRecord) => {
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (isLiveWriteFlow) {
      if (templateMode === "create") {
        const result = await supabaseSettings.createNotificationTemplate({
          name: template.name,
          channel: template.channel.toLowerCase() as "push" | "email" | "sms",
          titleTemplate: template.titleTemplate,
          bodyTemplate: template.bodyTemplate,
          isActive: template.status === "Enabled",
        });

        if (result.ok === false) {
          toast.error("Unable to create template", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Template created", {
          description: `${template.name} is now available.`,
        });
      } else if (editingTemplate) {
        const result = await supabaseSettings.updateNotificationTemplate({
          id: editingTemplate.id,
          name: template.name,
          channel: template.channel.toLowerCase() as "push" | "email" | "sms",
          titleTemplate: template.titleTemplate,
          bodyTemplate: template.bodyTemplate,
          isActive: template.status === "Enabled",
        });

        if (result.ok === false) {
          toast.error("Unable to update template", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Template updated", {
          description: `${template.name} has been saved.`,
        });
      }
    } else {
      setTemplates((prev) => {
        const exists = prev.some((item) => item.id === template.id);
        if (exists) {
          return prev.map((item) =>
            item.id === template.id ? template : item,
          );
        }
        return [template, ...prev];
      });
      toast.info("Template saved", {
        description: `${template.name} saved locally in fallback mode.`,
      });
    }

    setTemplateDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleCampaignSubmit = async (campaign: NotificationCampaignRecord) => {
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (isLiveWriteFlow) {
      if (campaignMode === "create") {
        const result = await supabaseSettings.createNotificationCampaign({
          name: campaign.name,
          description: campaign.description,
          channel: campaign.channel.toLowerCase() as "push" | "email" | "sms",
          templateId: campaign.templateId,
          status: campaign.status === "Enabled" ? "enabled" : "disabled",
        });

        if (result.ok === false) {
          toast.error("Unable to create campaign", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Campaign created", {
          description: `${campaign.name} is now available.`,
        });
      } else if (editingCampaign) {
        const result = await supabaseSettings.updateNotificationCampaign({
          id: editingCampaign.id,
          name: campaign.name,
          description: campaign.description,
          channel: campaign.channel.toLowerCase() as "push" | "email" | "sms",
          templateId: campaign.templateId,
          status: campaign.status === "Enabled" ? "enabled" : "disabled",
        });

        if (result.ok === false) {
          toast.error("Unable to update campaign", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Campaign updated", {
          description: `${campaign.name} has been saved.`,
        });
      }
    } else {
      setCampaigns((prev) => {
        const exists = prev.some((item) => item.id === campaign.id);
        if (exists) {
          return prev.map((item) =>
            item.id === campaign.id ? campaign : item,
          );
        }
        return [campaign, ...prev];
      });
      toast.info("Campaign saved", {
        description: `${campaign.name} saved locally in fallback mode.`,
      });
    }

    setCampaignDialogOpen(false);
    setEditingCampaign(null);
  };

  const handleCategorySubmit = async (name: string) => {
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (categoryMode === "create") {
      const duplicate = categories.some(
        (category) => category.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        toast.error("Unable to create category", {
          description: "A category with that name already exists.",
        });
        return;
      }

      if (isLiveWriteFlow) {
        const result = await supabaseSettings.createServiceCategory({
          name,
          isActive: true,
        });

        if (result.ok === false) {
          toast.error("Unable to create category", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Category created", {
          description: `${name} is now enabled.`,
        });
      } else {
        setCategories((prev) => [
          {
            id: `category-${name.toLowerCase().replace(/\s+/g, "-")}`,
            name,
            status: "Enabled",
            serviceTypesCount: 0,
            updatedAtLabel: "Just now",
          },
          ...prev,
        ]);
        toast.success("Category created", {
          description: `${name} is now enabled.`,
        });
      }
    } else if (editingCategory) {
      if (isLiveWriteFlow) {
        const result = await supabaseSettings.updateServiceCategory({
          id: editingCategory.id,
          name,
        });

        if (result.ok === false) {
          toast.error("Unable to update category", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Category updated", {
          description: `${name} has been saved.`,
        });
      } else {
        setCategories((prev) =>
          prev.map((item) =>
            item.id === editingCategory.id
              ? { ...item, name, updatedAtLabel: "Just now" }
              : item,
          ),
        );
        toast.success("Category updated", {
          description: `${name} has been saved.`,
        });
      }
    }
    setCategoryDialogOpen(false);
  };

  const handleTierSubmit = async (nextMultiplier: number, reason: string) => {
    if (!editingTier) return;
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (isLiveWriteFlow) {
      const extraFee = Math.max(0, (nextMultiplier - 1) * 100);
      const result = await supabaseSettings.updateUrgencyTier({
        id: editingTier.id,
        extraFee,
      });

      if (result.ok === false) {
        toast.error("Unable to update tier", {
          description: result.message,
        });
        return;
      }

      await reloadLiveMarketplaceData();
      toast.success("Tier updated", { description: reason });
    } else {
      setTiers((prev) =>
        prev.map((item) =>
          item.id === editingTier.id
            ? {
                ...item,
                multiplier: nextMultiplier,
                updatedAtLabel: "Just now",
              }
            : item,
        ),
      );
      toast.success("Tier updated", { description: reason });
    }

    setTierDialogOpen(false);
    setEditingTier(null);
  };

  const handleServiceTypeSubmit = async (values: {
    categoryId: string;
    name: string;
    basePrice: number;
    isAdditional: boolean;
  }) => {
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (serviceTypeMode === "create") {
      if (isLiveWriteFlow) {
        const result = await supabaseSettings.createServiceType({
          categoryId: values.categoryId,
          name: values.name,
          basePrice: values.basePrice,
          isPriceAdditional: values.isAdditional,
          isActive: true,
        });

        if (result.ok === false) {
          toast.error("Unable to create service type", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Service type created", {
          description: `${values.name} is now enabled.`,
        });
      } else {
        const categoryName =
          categories.find((category) => category.id === values.categoryId)
            ?.name ?? "—";
        setServiceTypes((prev) => [
          {
            id: `service-type-${values.name.toLowerCase().replace(/\s+/g, "-")}`,
            name: values.name,
            categoryId: values.categoryId,
            categoryName,
            basePrice: values.basePrice,
            isAdditional: values.isAdditional,
            status: "Enabled",
            updatedAtLabel: "Just now",
          },
          ...prev,
        ]);
        toast.success("Service type created", {
          description: `${values.name} is now enabled.`,
        });
      }
    } else if (editingServiceType) {
      if (isLiveWriteFlow) {
        const result = await supabaseSettings.updateServiceType({
          id: editingServiceType.id,
          categoryId: values.categoryId,
          name: values.name,
          basePrice: values.basePrice,
          isPriceAdditional: values.isAdditional,
        });

        if (result.ok === false) {
          toast.error("Unable to update service type", {
            description: result.message,
          });
          return;
        }

        await reloadLiveMarketplaceData();
        toast.success("Service type updated", {
          description: `${values.name} has been saved.`,
        });
      } else {
        const categoryName =
          categories.find((category) => category.id === values.categoryId)
            ?.name ?? "—";
        setServiceTypes((prev) =>
          prev.map((item) =>
            item.id === editingServiceType.id
              ? {
                  ...item,
                  name: values.name,
                  categoryId: values.categoryId,
                  categoryName,
                  basePrice: values.basePrice,
                  isAdditional: values.isAdditional,
                  updatedAtLabel: "Just now",
                }
              : item,
          ),
        );
        toast.success("Service type updated", {
          description: `${values.name} has been saved.`,
        });
      }
    }

    setServiceTypeDialogOpen(false);
    setEditingServiceType(null);
  };

  const handlePlatformConfigSubmit = async (values: {
    key: string;
    value: string;
    description: string;
  }) => {
    const isLiveWriteFlow =
      liveDataMode === "live" && isLiveMarketplaceAvailable();

    if (isLiveWriteFlow) {
      const result = await supabaseSettings.upsertPlatformConfig(values);
      if (result.ok === false) {
        toast.error("Unable to save config", { description: result.message });
        return;
      }

      await reloadLiveMarketplaceData();
      toast.success("Platform config saved", {
        description: `${values.key} has been saved.`,
      });
    } else {
      setPlatformConfig((prev) => {
        const existing = prev.find((item) => item.key === values.key);
        const nextRecord: PlatformConfigRecord = {
          key: values.key,
          value: values.value,
          description: values.description,
          updatedAtLabel: "Just now",
        };

        if (!existing) {
          return [nextRecord, ...prev];
        }

        return prev.map((item) =>
          item.key === values.key ? nextRecord : item,
        );
      });

      toast.success("Platform config saved", {
        description: `${values.key} has been saved.`,
      });
    }

    setConfigDialogOpen(false);
    setEditingConfig(null);
  };

  const renderActionsMenu = (
    triggerLabel: string,
    items: Array<{
      label: string;
      tone?: "danger" | "primary" | "neutral";
      onClick: () => void;
      separator?: boolean;
    }>,
  ) => {
    const toneClass = (tone: "danger" | "primary" | "neutral" | undefined) => {
      if (tone === "danger") return "text-[#F04438] focus:text-[#D92D20]";
      if (tone === "primary") return "text-[#071B58] focus:text-[#071B58]";
      return "text-[#2D3036] focus:text-[#2D3036]";
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#EAECF0] bg-white text-[#667085] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
            aria-label={triggerLabel}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="w-[200px] rounded-[10px] border border-[#E6E7EB] bg-white p-[10px] shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
        >
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <DropdownMenuItem
                onClick={item.onClick}
                className={cn(
                  "cursor-pointer px-0 py-0 text-[12px] font-semibold focus:bg-transparent",
                  toneClass(item.tone),
                )}
              >
                {item.label}
              </DropdownMenuItem>
              {item.separator ? (
                <DropdownMenuSeparator className="my-[10px] bg-[#F0F1F2]" />
              ) : null}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const channelBadge = (channel: NotificationChannel) => {
    const tone =
      channel === "Push"
        ? "bg-[#EFF8FF] text-[#175CD3]"
        : channel === "Email"
          ? "bg-[#F4F3FF] text-[#5925DC]"
          : "bg-[#FFF4DB] text-[#B7791F]";

    return (
      <span
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
          tone,
        )}
      >
        {channel}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {isLiveLoading ? (
        <div className="rounded-[14px] border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#667085]">
          Loading live marketplace settings...
        </div>
      ) : null}
      {liveError ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B42318] sm:flex-row sm:items-center sm:justify-between">
          <span>{liveError}</span>
          <button
            type="button"
            onClick={() => void reloadLiveMarketplaceData()}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#FCA5A5] bg-white px-3 text-xs font-semibold text-[#B42318] transition hover:bg-[#FFF1F1]"
          >
            Retry live load
          </button>
        </div>
      ) : null}
      {liveDataMode === "live" ? (
        <div className="rounded-[14px] border border-[#D0D5DD] bg-[#FCFCFD] px-4 py-3 text-sm text-[#475467]">
          Live read source loaded from Supabase:
          {platformConfigCount !== null
            ? ` ${platformConfigCount} platform config keys`
            : ""}
          {platformConfigCount !== null && liveServiceTypeCount !== null
            ? ","
            : ""}
          {liveServiceTypeCount !== null
            ? ` ${liveServiceTypeCount} service types`
            : ""}
          {livePromoCount !== null ? `, ${livePromoCount} promos` : ""}
          {liveNotificationTemplateCount !== null
            ? `, ${liveNotificationTemplateCount} notification templates`
            : ""}
          {liveNotificationCampaignCount !== null
            ? `, ${liveNotificationCampaignCount} notification campaigns`
            : ""}
          .
        </div>
      ) : null}

      <MarketplaceSectionShell
        title="Platform config"
        description="Manage key/value configuration used across the marketplace experience."
        action={
          <button
            type="button"
            onClick={openCreatePlatformConfig}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
          >
            <Plus className="h-4 w-4" />
            Add key
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Key</th>
                <th className="px-5 py-4">Value</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Last updated</th>
                <th className="px-5 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {platformConfig.map((config) => (
                <tr key={config.key}>
                  <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                    {config.key}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {config.value}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {config.description || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {config.updatedAtLabel}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {renderActionsMenu(`Config actions for ${config.key}`, [
                      {
                        label: "Edit config",
                        onClick: () => openEditPlatformConfig(config),
                      },
                    ])}
                  </td>
                </tr>
              ))}
              {platformConfig.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-sm font-medium text-[#98A2B3]"
                  >
                    No platform config keys are loaded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <MarketplaceSectionShell
        title="Service categories"
        description="Manage service categories and enable/disable availability in the marketplace."
        action={
          <button
            type="button"
            onClick={openCreateCategory}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Service types</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Last updated</th>
                <th className="px-5 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                    {category.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {category.serviceTypesCount}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusClasses(category.status),
                      )}
                    >
                      {category.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {category.updatedAtLabel}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {renderActionsMenu(
                      `Category actions for ${category.name}`,
                      [
                        {
                          label: "Edit category",
                          onClick: () => openEditCategory(category),
                          separator: true,
                        },
                        category.status === "Enabled"
                          ? {
                              label: "Disable category",
                              tone: "danger",
                              onClick: () =>
                                openReasonDialog("disable", {
                                  type: "category",
                                  record: category,
                                }),
                            }
                          : {
                              label: "Enable category",
                              tone: "primary",
                              onClick: () =>
                                openReasonDialog("enable", {
                                  type: "category",
                                  record: category,
                                }),
                            },
                      ],
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <MarketplaceSectionShell
        title="Service types"
        description="Manage service types under service categories and enable/disable availability."
        action={
          <button
            type="button"
            onClick={openCreateServiceType}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
          >
            <Plus className="h-4 w-4" />
            Add service type
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Service type</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Base price</th>
                <th className="px-5 py-4">Pricing</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Last updated</th>
                <th className="px-5 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {serviceTypes.map((serviceType) => (
                <tr key={serviceType.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                    {serviceType.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {serviceType.categoryName}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {serviceType.basePrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {serviceType.isAdditional ? "Additional" : "Base"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusClasses(serviceType.status),
                      )}
                    >
                      {serviceType.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {serviceType.updatedAtLabel}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {renderActionsMenu(
                      `Service type actions for ${serviceType.name}`,
                      [
                        {
                          label: "Edit service type",
                          onClick: () => openEditServiceType(serviceType),
                          separator: true,
                        },
                        serviceType.status === "Enabled"
                          ? {
                              label: "Disable service type",
                              tone: "danger",
                              onClick: () =>
                                openReasonDialog("disable", {
                                  type: "serviceType",
                                  record: serviceType,
                                }),
                            }
                          : {
                              label: "Enable service type",
                              tone: "primary",
                              onClick: () =>
                                openReasonDialog("enable", {
                                  type: "serviceType",
                                  record: serviceType,
                                }),
                            },
                      ],
                    )}
                  </td>
                </tr>
              ))}
              {serviceTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-6 text-sm font-medium text-[#98A2B3]"
                  >
                    No service types are loaded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <MarketplaceSectionShell
        title="Urgency tier pricing"
        description="Configure urgency multipliers used for pricing tiers and marketplace dispatch."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Tier</th>
                <th className="px-5 py-4">Multiplier</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Last updated</th>
                <th className="px-5 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {tiers.map((tier) => (
                <tr key={tier.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-[#101828]">
                    {tier.label}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {formatMultiplier(tier.multiplier)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusClasses(tier.status),
                      )}
                    >
                      {tier.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {tier.updatedAtLabel}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {renderActionsMenu(`Tier actions for ${tier.label}`, [
                      {
                        label: "Update multiplier",
                        onClick: () => openUpdateTier(tier),
                        separator: true,
                      },
                      tier.status === "Enabled"
                        ? {
                            label: "Disable tier",
                            tone: "danger",
                            onClick: () =>
                              openReasonDialog("disable", {
                                type: "tier",
                                record: tier,
                              }),
                          }
                        : {
                            label: "Enable tier",
                            tone: "primary",
                            onClick: () =>
                              openReasonDialog("enable", {
                                type: "tier",
                                record: tier,
                              }),
                          },
                    ])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <MarketplaceSectionShell
        title="Promos"
        description="Create and manage promo codes, discount windows, and availability."
        action={
          <button
            type="button"
            onClick={openCreatePromo}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
          >
            <Plus className="h-4 w-4" />
            Create promo
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Discount</th>
                <th className="px-5 py-4">Window</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Last updated</th>
                <th className="px-5 py-4 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {promos.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#101828]">
                      {promo.code}
                    </p>
                    <p className="mt-1 text-xs text-[#98A2B3]">
                      {promo.description}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {promo.discountType === "Percent"
                      ? `${promo.discountValue}%`
                      : `₦${promo.discountValue.toLocaleString("en-US")}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {promo.startDate} → {promo.endDate}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusClasses(promo.status),
                      )}
                    >
                      {promo.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#667085]">
                    {promo.updatedAtLabel}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {renderActionsMenu(`Promo actions for ${promo.code}`, [
                      {
                        label: "Edit promo",
                        onClick: () => openEditPromo(promo),
                        separator: true,
                      },
                      promo.status === "Enabled"
                        ? {
                            label: "Disable promo",
                            tone: "danger",
                            onClick: () =>
                              openReasonDialog("disable", {
                                type: "promo",
                                record: promo,
                              }),
                            separator: true,
                          }
                        : {
                            label: "Enable promo",
                            tone: "primary",
                            onClick: () =>
                              openReasonDialog("enable", {
                                type: "promo",
                                record: promo,
                              }),
                            separator: true,
                          },
                      {
                        label: "Delete promo",
                        tone: "danger",
                        onClick: () =>
                          openReasonDialog("delete", {
                            type: "promo",
                            record: promo,
                          }),
                      },
                    ])}
                  </td>
                </tr>
              ))}
              {promos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-6 text-sm font-medium text-[#98A2B3]"
                  >
                    No promos are configured yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <MarketplaceSectionShell
        title="Notifications"
        description="Manage reusable notification templates and the campaigns that send them."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateTemplate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
            >
              <Plus className="h-4 w-4" />
              Add template
            </button>
            <button
              type="button"
              onClick={openCreateCampaign}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#041133] px-4 text-sm font-semibold text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/20"
            >
              <Plus className="h-4 w-4" />
              Add campaign
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#101828]">
                  Templates
                </h3>
                <p className="text-xs text-[#98A2B3]">
                  Reusable message content for push, email, and SMS campaigns.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#F9FAFB]">
                  <tr className="text-left text-xs font-semibold text-[#667085]">
                    <th className="px-5 py-4">Template</th>
                    <th className="px-5 py-4">Channel</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Last updated</th>
                    <th className="px-5 py-4 text-right" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0]">
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[#101828]">
                          {template.name}
                        </p>
                        <p className="mt-1 text-xs text-[#98A2B3]">
                          {template.titleTemplate || template.bodyTemplate}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {channelBadge(template.channel)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            getStatusClasses(template.status),
                          )}
                        >
                          {template.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#667085]">
                        {template.updatedAtLabel}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {renderActionsMenu(
                          `Template actions for ${template.name}`,
                          [
                            {
                              label: "Edit template",
                              onClick: () => openEditTemplate(template),
                              separator: true,
                            },
                            template.status === "Enabled"
                              ? {
                                  label: "Disable template",
                                  tone: "danger",
                                  onClick: () =>
                                    openReasonDialog("disable", {
                                      type: "notificationTemplate",
                                      record: template,
                                    }),
                                }
                              : {
                                  label: "Enable template",
                                  tone: "primary",
                                  onClick: () =>
                                    openReasonDialog("enable", {
                                      type: "notificationTemplate",
                                      record: template,
                                    }),
                                },
                          ],
                        )}
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-6 text-sm font-medium text-[#98A2B3]"
                      >
                        No notification templates are configured yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#101828]">
                  Campaigns
                </h3>
                <p className="text-xs text-[#98A2B3]">
                  Delivery toggles and audience-ready notification campaigns.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#F9FAFB]">
                  <tr className="text-left text-xs font-semibold text-[#667085]">
                    <th className="px-5 py-4">Campaign</th>
                    <th className="px-5 py-4">Channel</th>
                    <th className="px-5 py-4">Template</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Last updated</th>
                    <th className="px-5 py-4 text-right" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0]">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[#101828]">
                          {campaign.name}
                        </p>
                        <p className="mt-1 text-xs text-[#98A2B3]">
                          {campaign.description}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {channelBadge(campaign.channel)}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#667085]">
                        {campaign.templateName || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            getStatusClasses(campaign.status),
                          )}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#667085]">
                        {campaign.updatedAtLabel}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {renderActionsMenu(
                          `Notification actions for ${campaign.name}`,
                          [
                            {
                              label: "Edit campaign",
                              onClick: () => openEditCampaign(campaign),
                              separator: true,
                            },
                            campaign.status === "Enabled"
                              ? {
                                  label: "Disable campaign",
                                  tone: "danger",
                                  onClick: () =>
                                    openReasonDialog("disable", {
                                      type: "notification",
                                      record: campaign,
                                    }),
                                }
                              : {
                                  label: "Enable campaign",
                                  tone: "primary",
                                  onClick: () =>
                                    openReasonDialog("enable", {
                                      type: "notification",
                                      record: campaign,
                                    }),
                                },
                          ],
                        )}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-6 text-sm font-medium text-[#98A2B3]"
                      >
                        No notification campaigns are configured yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </MarketplaceSectionShell>

      <CategoryEditorDialog
        open={categoryDialogOpen}
        mode={categoryMode}
        initialName={editingCategory?.name ?? ""}
        onSubmit={handleCategorySubmit}
        onOpenChange={setCategoryDialogOpen}
      />

      <PlatformConfigEditorDialog
        open={configDialogOpen}
        mode={configMode}
        initialKey={editingConfig?.key ?? ""}
        initialValue={editingConfig?.value ?? ""}
        initialDescription={editingConfig?.description ?? ""}
        onSubmit={handlePlatformConfigSubmit}
        onOpenChange={(open) => {
          setConfigDialogOpen(open);
          if (!open) {
            setEditingConfig(null);
          }
        }}
      />

      <ServiceTypeEditorDialog
        open={serviceTypeDialogOpen}
        mode={serviceTypeMode}
        initial={{
          categoryId: editingServiceType?.categoryId ?? categories[0]?.id ?? "",
          name: editingServiceType?.name ?? "",
          basePrice: editingServiceType?.basePrice ?? 0,
          isAdditional: editingServiceType?.isAdditional ?? false,
        }}
        categories={categories}
        onSubmit={handleServiceTypeSubmit}
        onOpenChange={(open) => {
          setServiceTypeDialogOpen(open);
          if (!open) {
            setEditingServiceType(null);
          }
        }}
      />

      <TierMultiplierDialog
        open={tierDialogOpen}
        tier={editingTier}
        onSubmit={handleTierSubmit}
        onOpenChange={setTierDialogOpen}
      />

      {editingPromo ? (
        <PromoEditorDialog
          open={promoDialogOpen}
          mode={promoMode}
          initialPromo={editingPromo}
          onSubmit={handlePromoSubmit}
          onOpenChange={(open) => {
            setPromoDialogOpen(open);
            if (!open) {
              setEditingPromo(null);
            }
          }}
        />
      ) : null}

      {editingTemplate ? (
        <NotificationTemplateEditorDialog
          open={templateDialogOpen}
          mode={templateMode}
          initialTemplate={editingTemplate}
          onSubmit={handleTemplateSubmit}
          onOpenChange={(open) => {
            setTemplateDialogOpen(open);
            if (!open) {
              setEditingTemplate(null);
            }
          }}
        />
      ) : null}

      {editingCampaign ? (
        <NotificationCampaignEditorDialog
          open={campaignDialogOpen}
          mode={campaignMode}
          initialCampaign={editingCampaign}
          templates={templates}
          onSubmit={handleCampaignSubmit}
          onOpenChange={(open) => {
            setCampaignDialogOpen(open);
            if (!open) {
              setEditingCampaign(null);
            }
          }}
        />
      ) : null}

      {reasonDialogCopy ? (
        <ReasonDialog
          open={reasonDialogOpen}
          title={reasonDialogCopy.title}
          description={reasonDialogCopy.description}
          confirmLabel={reasonDialogCopy.confirmLabel}
          confirmTone={reasonDialogCopy.confirmTone}
          reasonLabel={reasonDialogCopy.reasonLabel}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={confirmReasonAction}
          onOpenChange={(open) => {
            setReasonDialogOpen(open);
            if (!open) {
              setPendingAction(null);
              setReason("");
            }
          }}
        />
      ) : null}
    </div>
  );
}
