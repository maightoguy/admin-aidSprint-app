import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronDown, FileText, Loader2, Send, Check, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabaseSupport } from "@/lib/supabase/data";
import { useAuthStore } from "@/auth/auth.store";
import {
  Dialog,
  DialogDescription,
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
import type { SupportTicket, SupportTicketStatus } from "./support.data";

interface SupportDetailsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
  isUpdating?: boolean;
  onUpdateStatus?: (status: SupportTicketStatus) => Promise<void> | void;
}

function getTicketStatusTextClass(status: SupportTicketStatus) {
  if (status === "Open") {
    return "text-[#22C55E]";
  }

  if (status === "Pending") {
    return "text-[#F79009]";
  }

  return "text-[#0088FF]";
}

function getStatusOptionClasses(
  option: Extract<SupportTicketStatus, "Pending" | "Resolved">,
  currentStatus: SupportTicketStatus,
) {
  const isActive = currentStatus === option;

  if (option === "Pending") {
    return isActive
      ? "bg-[#FFF7ED] text-[#F79009]"
      : "text-[#344054] hover:text-[#F79009] focus:text-[#F79009]";
  }

  return isActive
    ? "bg-[#EFF8FF] text-[#0088FF]"
    : "text-[#344054] hover:text-[#0088FF] focus:text-[#0088FF]";
}

function SupportStatusMenu({
  currentStatus,
  isUpdating,
  onSelectStatus,
}: {
  currentStatus: SupportTicketStatus;
  isUpdating: boolean;
  onSelectStatus: (
    status: Extract<SupportTicketStatus, "Pending" | "Resolved">,
  ) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isUpdating}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-[10px] border border-[#B1B5C0] bg-[#041133] px-4 py-[13px] text-[14px] font-medium text-white transition hover:bg-[#0A1C4E] focus:outline-none focus:ring-2 focus:ring-[#071B58]/25 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Update ticket status"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              Update Ticket
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="top"
        avoidCollisions={false}
        sideOffset={8}
        collisionPadding={16}
        className="z-[90] w-[339px] max-w-[calc(100vw-40px)] rounded-[14px] border border-[#EAECF0] bg-white p-2 shadow-[0_24px_40px_rgba(15,23,42,0.14)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        {(["Pending", "Resolved"] as const).map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={isUpdating}
            onClick={() => onSelectStatus(status)}
            className={cn(
              "rounded-[10px] px-4 py-3 text-[14px] font-medium outline-none transition focus:bg-[#F8FAFC]",
              getStatusOptionClasses(status, currentStatus),
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span>{`Set as ${status}`}</span>
              {currentStatus === status ? (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    status === "Pending" ? "bg-[#F79009]" : "bg-[#0088FF]",
                  )}
                />
              ) : null}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SupportDetailsSidebar({
  open,
  onOpenChange,
  ticket,
  isUpdating = false,
  onUpdateStatus,
}: SupportDetailsSidebarProps) {
  const { session } = useAuthStore();
  const [messages, setMessages] = React.useState<Array<{
    id: string;
    content: string;
    sender_role: string;
    created_at: string;
    read_by_admins: Record<string, string>;
  }>>([]);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = React.useState(false);
  const [messageInput, setMessageInput] = React.useState("");

  // Load messages when sidebar opens or ticket changes
  React.useEffect(() => {
    if (!open || !ticket) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      const result = await supabaseSupport.listMessagesByTicketId({ ticketId: ticket.ticketId });
      
      if (result.ok) {
        setMessages(result.data);
        
        // Mark all unread messages as read by current admin
        if (session?.userId) {
          await Promise.all(
            result.data.map(msg => {
              const readByAdmins = msg.read_by_admins || {};
              if (!readByAdmins[session.userId]) {
                return supabaseSupport.markMessageAsRead({
                  messageId: msg.id,
                  adminUserId: session.userId,
                });
              }
            })
          );
        }
      }
      
      setIsLoadingMessages(false);
    };

    loadMessages();
  }, [open, ticket, session?.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !ticket || !session?.userId || isSubmittingMessage) return;

    setIsSubmittingMessage(true);
    try {
      const result = await supabaseSupport.createMessage({
        ticketId: ticket.ticketId,
        senderUserId: session.userId,
        content: messageInput.trim(),
        isAdmin: true,
      });

      if (result.ok) {
        setMessages([...messages, result.data]);
        setMessageInput("");
      }
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-[rgba(15,23,42,0.16)] backdrop-blur-[4px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-[70] h-full w-full bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none duration-300 sm:w-[363px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
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
                  to={ticket.profilePath || `/users/${ticket.userId}`}
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
                    getTicketStatusTextClass(ticket.status),
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
                      {att.type.startsWith("image/") ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-5 w-5 text-[#98A2B3]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Section */}
            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-[12px] font-semibold leading-4 text-[#101828]">
                Messages
              </p>
              
              {/* Message Thread Container */}
              <div className="mt-2 flex-1 overflow-y-auto rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] p-2">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[#98A2B3]" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-[#98A2B3]">
                    No messages yet. Start a conversation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => {
                      const isRead = session?.userId && msg.read_by_admins?.[session.userId];
                      const createdDate = new Date(msg.created_at);
                      const timeStr = createdDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      
                      return (
                        <div key={msg.id} className="rounded-[8px] bg-white p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-[#344054]">
                                {msg.sender_role === "admin" ? "Admin" : "User"}
                              </p>
                              <p className="mt-1 break-words text-[12px] leading-[18px] text-[#2D2D2D]">
                                {msg.content}
                              </p>
                            </div>
                            {msg.sender_role === "admin" && (
                              <div className="flex shrink-0 items-center gap-0.5">
                                {isRead ? (
                                  <CheckCheck className="h-3 w-3 text-[#0088FF]" />
                                ) : (
                                  <Check className="h-3 w-3 text-[#98A2B3]" />
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-[10px] text-[#98A2B3]">
                            {timeStr}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isSubmittingMessage}
                  className="flex-1 rounded-[8px] border border-[#EAECF0] bg-white px-3 py-2 text-[12px] placeholder-[#98A2B3] outline-none transition focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF]/10 disabled:bg-[#F9FAFB]"
                  aria-label="Send message"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSubmittingMessage}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0088FF] text-white transition hover:bg-[#0066CC] disabled:bg-[#98A2B3]"
                  aria-label="Send"
                >
                  {isSubmittingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>

            <div className="mt-auto pt-6">
              <SupportStatusMenu
                currentStatus={ticket.status}
                isUpdating={isUpdating}
                onSelectStatus={(status) => onUpdateStatus?.(status)}
              />
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
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-[10px] py-[11px] last:border-b-0">
      <span className="text-[14px] font-normal leading-5 text-[#98A2B3]">
        {label}
      </span>
      <span
        className={cn(
          "text-right text-[14px] font-semibold leading-5 text-[#2D2D2D]",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}
