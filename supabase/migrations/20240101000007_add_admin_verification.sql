-- Clean up old policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Admins can view all" ON public.users;

-- Add is_verified column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;

-- Update existing admins to be verified (assuming legacy admins are trusted)
UPDATE public.users 
SET is_verified = true 
WHERE role = 'admin';

-- Comment on column
COMMENT ON COLUMN public.users.is_verified IS 'Indicates if the user is verified. Citizens are auto-verified, Admins need approval.';

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Function to check if user is admin (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin' AND is_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policy: Admin access (Non-recursive)
CREATE POLICY "Admins can view all profiles" 
ON public.users FOR SELECT 
USING (public.is_admin());



