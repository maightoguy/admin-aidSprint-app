import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usersStyles } from "./users.styles";
import type { UserMenuAction, UserRecord } from "./users.types";

const menuActions: UserMenuAction[] = [
  "View profile",
  "Activate account",
  "Deactivate account",
];

const menuItemColors: Record<UserMenuAction, string> = {
  "View profile": "text-[#2D3036] focus:text-[#2D3036]",
  "Activate account": "text-[#22C55E] focus:text-[#22C55E]",
  "Deactivate account": "text-[#EF4444] focus:text-[#EF4444]",
};

export function UsersActionsMenu({
  user,
  onAction,
}: {
  user: UserRecord;
  onAction?: (action: UserMenuAction, user: UserRecord) => void;
}) {
  const handleAction = (action: UserMenuAction) => {
    if (onAction) {
      onAction(action, user);
      return;
    }

    toast.success(action, {
      description: `${action} selected for ${user.name}`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#D0D5DD] bg-white text-[#667085] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
          aria-label={`Open user actions for ${user.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={usersStyles.actionMenuPanel}
      >
        {menuActions.map((action, index) => (
          <div key={action}>
            <DropdownMenuItem
              onClick={() => handleAction(action)}
              className={cn(
                usersStyles.actionMenuItem,
                menuItemColors[action],
              )}
            >
              {action}
            </DropdownMenuItem>
            {index < menuActions.length - 1 ? (
              <DropdownMenuSeparator className="my-[10px] bg-[#F0F1F2]" />
            ) : null}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
