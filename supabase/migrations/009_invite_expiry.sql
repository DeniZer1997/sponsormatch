-- Add expiry column to team_invites (default: 7 days from creation)
ALTER TABLE public.team_invites
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT now() + interval '7 days';

-- Backfill existing invites
UPDATE public.team_invites
  SET expires_at = created_at + interval '7 days'
  WHERE expires_at IS NULL;
