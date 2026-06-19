-- I4: Support Ticket Message Threading
-- Create a dedicated messages table with read-state tracking
-- This keeps messages separate from status events for cleaner conversation display

-- 1) Create support_ticket_messages table for conversation threads
CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "sender_role" text NOT NULL,
  "content" text NOT NULL,
  "read_by_admins" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Enable RLS
ALTER TABLE "public"."support_ticket_messages" ENABLE ROW LEVEL SECURITY;

-- 2) Add indexes for common queries
CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id_idx 
  ON public.support_ticket_messages USING btree (ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS support_ticket_messages_sender_id_idx 
  ON public.support_ticket_messages USING btree (sender_id);

-- 3) Add foreign key constraint
ALTER TABLE "public"."support_ticket_messages" 
ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" 
FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;

ALTER TABLE "public"."support_ticket_messages" 
ADD CONSTRAINT "support_ticket_messages_sender_id_fkey" 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

-- 4) Add constraints for sender_role and content
ALTER TABLE "public"."support_ticket_messages"
ADD CONSTRAINT "support_ticket_messages_sender_role_check" 
CHECK (sender_role = ANY(ARRAY['admin'::text, 'user'::text, 'contractor'::text]));

ALTER TABLE "public"."support_ticket_messages"
ADD CONSTRAINT "support_ticket_messages_content_not_empty" 
CHECK (length(trim(content)) > 0);

-- 5) RLS Policies: Admins can read all messages
DROP POLICY IF EXISTS "support_ticket_messages_select_admins" ON public.support_ticket_messages;
CREATE POLICY "support_ticket_messages_select_admins"
  ON public.support_ticket_messages
  FOR SELECT
  USING (public.is_admin_user());

-- 6) RLS Policy: Admins can insert messages (as admin)
DROP POLICY IF EXISTS "support_ticket_messages_insert_admins" ON public.support_ticket_messages;
CREATE POLICY "support_ticket_messages_insert_admins"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (public.is_admin_user() AND sender_role = 'admin');

-- 7) RLS Policy: Users/contractors can read their own ticket messages
DROP POLICY IF EXISTS "support_ticket_messages_select_requesters" ON public.support_ticket_messages;
CREATE POLICY "support_ticket_messages_select_requesters"
  ON public.support_ticket_messages
  FOR SELECT
  USING (
    -- Requester can view messages on their own ticket
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE requester_id = auth.uid()
    )
  );

-- 8) RLS Policy: Users/contractors can insert their own messages
DROP POLICY IF EXISTS "support_ticket_messages_insert_requesters" ON public.support_ticket_messages;
CREATE POLICY "support_ticket_messages_insert_requesters"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND 
    sender_role IN ('user', 'contractor') AND
    -- Only allow inserting if they own the ticket
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE requester_id = auth.uid()
    )
  );

-- 9) RLS Policy: Admins can update read-state (mark messages as read)
DROP POLICY IF EXISTS "support_ticket_messages_update_admins_read" ON public.support_ticket_messages;
CREATE POLICY "support_ticket_messages_update_admins_read"
  ON public.support_ticket_messages
  FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
