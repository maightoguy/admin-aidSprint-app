import { useMemo, useState } from "react";
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
import {
  initialNotificationCampaigns,
  initialPromos,
  initialServiceCategories,
  initialUrgencyTiers,
} from "./marketplace-config.data";
import type {
  MarketplaceEntityStatus,
  NotificationCampaignRecord,
  NotificationChannel,
  PromoDiscountType,
  PromoRecord,
  ServiceCategoryRecord,
  UrgencyTierRecord,
} from "./marketplace-config.types";

type MarketplaceActionTarget =
  | { type: "category"; record: ServiceCategoryRecord }
  | { type: "tier"; record: UrgencyTierRecord }
  | { type: "promo"; record: PromoRecord }
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
              Current multiplier {tier ? formatMultiplier(tier.multiplier) : "—"}
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
            Model promo configuration as backend-ready state even before API integration.
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

export function MarketplaceConfigTab() {
  const [categories, setCategories] = useState<ServiceCategoryRecord[]>(
    initialServiceCategories,
  );
  const [tiers, setTiers] = useState<UrgencyTierRecord[]>(initialUrgencyTiers);
  const [promos, setPromos] = useState<PromoRecord[]>(initialPromos);
  const [campaigns, setCampaigns] = useState<NotificationCampaignRecord[]>(
    initialNotificationCampaigns,
  );

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] =
    useState<ServiceCategoryRecord | null>(null);

  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<UrgencyTierRecord | null>(null);

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promoMode, setPromoMode] = useState<"create" | "edit">("create");
  const [editingPromo, setEditingPromo] = useState<PromoRecord | null>(null);

  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    kind: MarketplaceActionKind;
    target: MarketplaceActionTarget;
  } | null>(null);

  const reasonDialogCopy = useMemo(() => {
    if (!pendingAction) {
      return null;
    }

    const name =
      pendingAction.target.type === "category"
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

  const openReasonDialog = (kind: MarketplaceActionKind, target: MarketplaceActionTarget) => {
    setPendingAction({ kind, target });
    setReason("");
    setReasonDialogOpen(true);
  };

  const confirmReasonAction = () => {
    if (!pendingAction || !reason.trim()) {
      return;
    }

    const trimmedReason = reason.trim();
    const { kind, target } = pendingAction;

    if (target.type === "category") {
      if (kind === "disable" || kind === "enable") {
        setCategories((prev) =>
          prev.map((item) =>
            item.id === target.record.id
              ? {
                  ...item,
                  status: applyToggle(item.status, kind === "enable" ? "enable" : "disable"),
                  updatedAtLabel: "Just now",
                }
              : item,
          ),
        );
        toast.success("Category updated", { description: trimmedReason });
      }
    }

    if (target.type === "tier") {
      if (kind === "disable" || kind === "enable") {
        setTiers((prev) =>
          prev.map((item) =>
            item.id === target.record.id
              ? {
                  ...item,
                  status: applyToggle(item.status, kind === "enable" ? "enable" : "disable"),
                  updatedAtLabel: "Just now",
                }
              : item,
          ),
        );
        toast.success("Tier updated", { description: trimmedReason });
      }
    }

    if (target.type === "promo") {
      if (kind === "delete") {
        setPromos((prev) => prev.filter((item) => item.id !== target.record.id));
        toast.success("Promo deleted", { description: trimmedReason });
      } else if (kind === "disable" || kind === "enable") {
        setPromos((prev) =>
          prev.map((item) =>
            item.id === target.record.id
              ? {
                  ...item,
                  status: applyToggle(item.status, kind === "enable" ? "enable" : "disable"),
                  updatedAtLabel: "Just now",
                }
              : item,
          ),
        );
        toast.success("Promo updated", { description: trimmedReason });
      }
    }

    if (target.type === "notification") {
      if (kind === "disable" || kind === "enable") {
        setCampaigns((prev) =>
          prev.map((item) =>
            item.id === target.record.id
              ? {
                  ...item,
                  status: applyToggle(item.status, kind === "enable" ? "enable" : "disable"),
                  updatedAtLabel: "Just now",
                }
              : item,
          ),
        );
        toast.success("Notification updated", { description: trimmedReason });
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

  const openUpdateTier = (tier: UrgencyTierRecord) => {
    setEditingTier(tier);
    setTierDialogOpen(true);
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

  const handlePromoSubmit = (promo: PromoRecord) => {
    setPromos((prev) => {
      const exists = prev.some((item) => item.id === promo.id);
      if (exists) {
        return prev.map((item) => (item.id === promo.id ? promo : item));
      }
      return [promo, ...prev];
    });
    toast.success("Promo saved", { description: `${promo.code} has been saved.` });
    setPromoDialogOpen(false);
  };

  const handleCategorySubmit = (name: string) => {
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
      toast.success("Category created", { description: `${name} is now enabled.` });
    } else if (editingCategory) {
      setCategories((prev) =>
        prev.map((item) =>
          item.id === editingCategory.id
            ? { ...item, name, updatedAtLabel: "Just now" }
            : item,
        ),
      );
      toast.success("Category updated", { description: `${name} has been saved.` });
    }
    setCategoryDialogOpen(false);
  };

  const handleTierSubmit = (nextMultiplier: number, reason: string) => {
    if (!editingTier) return;
    setTiers((prev) =>
      prev.map((item) =>
        item.id === editingTier.id
          ? { ...item, multiplier: nextMultiplier, updatedAtLabel: "Just now" }
          : item,
      ),
    );
    toast.success("Tier updated", { description: reason });
    setTierDialogOpen(false);
    setEditingTier(null);
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
      <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tone)}>
        {channel}
      </span>
    );
  };

  return (
    <div className="space-y-6">
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
                    {renderActionsMenu(`Category actions for ${category.name}`, [
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
                    ])}
                  </td>
                </tr>
              ))}
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
        description="Create and manage promos. Keep this UI backend-ready even if persistence is mock-data for now."
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
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <MarketplaceSectionShell
        title="Notifications"
        description="Configure notification templates and campaign toggles for operational visibility."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-xs font-semibold text-[#667085]">
                <th className="px-5 py-4">Campaign</th>
                <th className="px-5 py-4">Channel</th>
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
                  <td className="px-5 py-4">{channelBadge(campaign.channel)}</td>
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
                    {renderActionsMenu(`Notification actions for ${campaign.name}`, [
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
                    ])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketplaceSectionShell>

      <CategoryEditorDialog
        open={categoryDialogOpen}
        mode={categoryMode}
        initialName={editingCategory?.name ?? ""}
        onSubmit={handleCategorySubmit}
        onOpenChange={setCategoryDialogOpen}
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
          onOpenChange={setPromoDialogOpen}
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

