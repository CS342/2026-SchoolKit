-- ================================================================
-- SchoolKit — role-based access control (RBAC)
-- Adds app-level privilege roles (admin, moderator) distinct from
-- profiles.role (which is the audience type: student/parent/staff).
--
-- Design: privileges live in a dedicated user_roles table that has NO
-- user-facing write policy, so a user can never grant themselves a role
-- (unlike a column on the user-writable profiles table). is_moderator()
-- is redefined to read from this table, so every existing RLS policy that
-- already calls it upgrades automatically.
-- ================================================================

CREATE TYPE app_role AS ENUM ('admin', 'moderator');

CREATE TABLE user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users may read their OWN roles (so the client can gate UI). There are
-- deliberately NO INSERT/UPDATE/DELETE policies — writes go only through
-- the SECURITY DEFINER helpers below or the service role.
CREATE POLICY "Users can read own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ─── authorization helpers ───────────────────────────────────────
-- SECURITY DEFINER so they can read user_roles regardless of the caller's
-- RLS, and so they're safe to call from inside other tables' policies
-- without recursion.
CREATE OR REPLACE FUNCTION public.has_app_role(_role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_app_role('admin'); $$;

-- Redefine the existing email-based moderator check to be role-based.
-- Admins are implicitly moderators. Every policy calling is_moderator()
-- picks this up with no further change.
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_app_role('moderator') OR public.has_app_role('admin');
$$;

-- ─── admin-only role management (callable from the client) ───────
CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role app_role, _grant boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can manage roles'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
  END IF;
END;
$$;

-- ─── bootstrap: grant roles by email on signup ───────────────────
-- Edit these lists to change who is seeded. After the first admin exists,
-- prefer set_user_role() (or the dashboard) for further changes.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email = ANY (ARRAY['lvalsote@stanford.edu']) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.email = ANY (ARRAY['janinatroper@gmail.com', 'ngounder@stanford.edu']) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'moderator')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Fires on signup and on an email being set/changed (covers anon→email upgrade).
CREATE TRIGGER on_auth_user_role
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Backfill any already-existing users matching the bootstrap lists.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'lvalsote@stanford.edu'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'moderator'::app_role FROM auth.users
WHERE email IN ('janinatroper@gmail.com', 'ngounder@stanford.edu')
ON CONFLICT (user_id, role) DO NOTHING;
