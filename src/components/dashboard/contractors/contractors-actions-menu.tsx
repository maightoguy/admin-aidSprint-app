import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { contractorsStyles } from "./contractors.styles";
import type { ContractorMenuAction, ContractorRecord } from "./contractors.types";

const menuActions: ContractorMenuAction[] = [
  "View profile",
  "Activate account",
  "Deactivate account",
];

const menuItemColors: Record<ContractorMenuAction, string> = {
  "View profile": "text-[#2D3036] focus:text-[#2D3036]",
  "Activate account": "text-[#22C55E] focus:text-[#22C55E]",
  "Deactivate account": "text-[#EF4444] focus:text-[#EF4444]",
};

export function ContractorsActionsMenu({
  contractor,
  onAction,
}: {
  contractor: ContractorRecord;
  onAction: (action: ContractorMenuAction, contractor: ContractorRecord) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 min-h-10 w-10 min-w-10 touch-manipulation items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#667085] transition hover:bg-[#F8FAFC] active:bg-[#EEF2F6] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15"
          aria-label={`Open contractor actions for ${contractor.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={contractorsStyles.actionMenuPanel}
      >
        {menuActions.map((action, index) => (
          <div key={action}>
            <DropdownMenuItem
              onClick={() => onAction(action, contractor)}
              className={cn(contractorsStyles.actionMenuItem, menuItemColors[action])}
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
