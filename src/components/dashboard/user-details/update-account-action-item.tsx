import type { UpdateAccountAction } from "./user-details.types";

export function UpdateAccountActionItem({
  action,
  busy,
  onSelect,
}: {
  action: UpdateAccountAction;
  busy?: boolean;
  onSelect: (action: UpdateAccountAction) => void;
}) {
  const isActivateAction = action === "Activate Account";

  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      disabled={busy}
      className={[
        "w-full text-left text-[12px] font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isActivateAction ? "text-[#22C55E]" : "text-[#EF4444]",
      ].join(" ")}
    >
      {busy ? "Updating..." : action}
    </button>
  );
}
