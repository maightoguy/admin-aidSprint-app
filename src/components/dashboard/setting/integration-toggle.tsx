import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type IntegrationToggleId =
  | "cleaning"
  | "psw-care"
  | "plumbing"
  | "locksmith"
  | "electrician"
  | "babysitting"
  | "petsitter"
  | "handyman";

export interface IntegrationToggleProps {
  id: IntegrationToggleId;
  label: string;
  icon: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function IntegrationToggle({
  id,
  label,
  icon,
  checked,
  onCheckedChange,
  disabled = false,
}: IntegrationToggleProps) {
  const switchId = `integration-toggle-${id}`;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-[12px] bg-white px-4 py-4",
        "shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        "border border-[#EAECF0]",
        disabled ? "opacity-70" : "",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D0D5DD] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
          <span className="text-[#0F172A]" aria-hidden="true">
            {icon}
          </span>
        </div>
        <label
          htmlFor={switchId}
          className="truncate text-[14px] font-semibold leading-5 text-[#101828]"
        >
          {label}
        </label>
      </div>

      <Switch
        id={switchId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className={cn(
          "h-6 w-11",
          "data-[state=checked]:bg-[#22C55E] data-[state=unchecked]:bg-[#E4E7EC]",
        )}
      />
    </div>
  );
}
