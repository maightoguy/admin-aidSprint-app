import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateAccountActionItem } from "./update-account-action-item";
import type { UpdateAccountAction } from "./user-details.types";

const accountActions: UpdateAccountAction[] = [
  "Activate Account",
  "Deactivate Account",
];

export function UpdateAccountModal({
  open,
  busyAction,
  errorMessage,
  onOpenChange,
  onSelectAction,
}: {
  open: boolean;
  busyAction: UpdateAccountAction | null;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (action: UpdateAccountAction) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[190px] gap-0 rounded-[10px] border border-[#EAECF0] p-[10px] shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Update account</DialogTitle>
          <DialogDescription>
            Choose whether to activate or deactivate this account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[10px]">
          {accountActions.map((action, index) => (
            <div key={action}>
              <UpdateAccountActionItem
                action={action}
                busy={busyAction === action}
                onSelect={onSelectAction}
              />
              {index < accountActions.length - 1 ? (
                <div className="my-[10px] h-px bg-[#F0F1F2]" />
              ) : null}
            </div>
          ))}
        </div>
        {errorMessage ? (
          <p role="alert" className="mt-3 text-[11px] font-medium text-[#B42318]">
            {errorMessage}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
