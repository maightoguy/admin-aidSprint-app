import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronDown, User, FileText, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportTicket, SupportTicketStatus } from "./support.data";

interface SupportDetailsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
  onUpdateStatus?: (ticketId: string, status: SupportTicketStatus) => void;
}

export function SupportDetailsSidebar({
  open,
  onOpenChange,
  ticket,
  onUpdateStatus,
}: SupportDetailsSidebarProps) {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-[rgba(15,23,42,0.16)] backdrop-blur-[4px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-[70] h-full w-full bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none duration-300 sm:w-[363px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto px-3 pb-3 pt-[14px]">
            <div className="flex items-center justify-between gap-4 px-[2px]">
              <DialogTitle className="text-[16px] font-bold leading-6 text-[#101828]">
                Ticket details
              </DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#101828] transition hover:bg-[#F2F4F7]"
                aria-label="Close ticket details"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <DialogDescription className="sr-only">
              Support ticket details for {ticket.ticketId}
            </DialogDescription>

            {/* User Section */}
            <div className="mt-[14px]">
              <p className="text-[12px] font-semibold leading-4 text-[#101828]">
                User
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#D4AF7A_0%,#6B4E2E_100%)] text-[11px] font-semibold text-white">
                    {ticket.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate text-[24px] font-medium leading-7 text-[#2D2D2D]">
                    {ticket.userName}
                  </span>
                </div>
                <Link
                  to={`/contractors/${ticket.userId}`}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-[4px] border border-[#EAECF0] px-3 text-[12px] font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
                >
                  View profile
                </Link>
              </div>
            </div>

            {/* Details Table */}
            <div className="mt-[16px] overflow-hidden rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD]">
              <DetailRow label="Ticket ID" value={ticket.ticketId} />
              <DetailRow label="Subject" value={ticket.subject} />
              
              {ticket.description && (
                <div className="flex flex-col gap-1 border-b border-[#EAECF0] px-[10px] py-[11px]">
                  <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                    Additional Description
                  </span>
                  <p className="text-[12px] leading-[18px] text-[#2D2D2D]">
                    {ticket.description}
                  </p>
                </div>
              )}

              {ticket.requestId && (
                <DetailRow 
                  label="Request ID" 
                  value={ticket.requestId} 
                  valueClassName="text-[#0088FF] underline"
                />
              )}
              
              <div className="flex items-center justify-between gap-4 px-[10px] py-[11px]">
                <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
                  Status
                </span>
                <span
                  className={cn(
                    "text-right text-[14px] font-semibold leading-5",
                    ticket.status === "Open" ? "text-[#22C55E]" : 
                    ticket.status === "Pending" ? "text-[#F79009]" : "text-[#0088FF]"
                  )}
                >
                  • {ticket.status}
                </span>
              </div>
            </div>

            {/* Attachments Section */}
            {ticket.attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-[12px] font-semibold leading-4 text-[#101828]">
                  Proof
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ticket.attachments.map((att) => (
                    <div 
                      key={att.id}
                      className="h-[44px] w-[44px] rounded-[10px] border border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-center overflow-hidden"
                    >
                      {att.type.startsWith('image/') ? (
                        <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-5 w-5 text-[#98A2B3]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update Status Button */}
            <div className="mt-auto pt-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E]"
                  >
                    Update Ticket
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-[352px] rounded-[14px] p-0 shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => onUpdateStatus?.(ticket.id, "Open")}
                    className="px-4 py-3 text-[14px] font-medium text-[#22C55E] focus:bg-[#F8FAFC]"
                  >
                    Set as Open
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onUpdateStatus?.(ticket.id, "Pending")}
                    className="px-4 py-3 text-[14px] font-medium text-[#F79009] border-t border-[#EAECF0] focus:bg-[#F8FAFC]"
                  >
                    Set as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onUpdateStatus?.(ticket.id, "Resolved")}
                    className="px-4 py-3 text-[14px] font-medium text-[#0088FF] border-t border-[#EAECF0] focus:bg-[#F8FAFC]"
                  >
                    Set as Resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function DetailRow({ 
  label, 
  value, 
  valueClassName 
}: { 
  label: string; 
  value: string; 
  valueClassName?: string 
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-[10px] py-[11px] last:border-b-0">
      <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
        {label}
      </span>
      <span className={cn("text-right text-[14px] font-semibold leading-5 text-[#2D2D2D]", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
