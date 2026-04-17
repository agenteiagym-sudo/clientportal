-- SOLUCIÓN AL ERROR DE RECURSIÓN INFINITA EN RLS
-- Ejecuta esto en el SQL Editor de Supabase para corregir las políticas de seguridad

-- 1. Crear una función auxiliar con SECURITY DEFINER para verificar roles sin causar recursión
CREATE OR REPLACE FUNCTION public.check_is_admin_or_coach(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (role = 'admin' OR role = 'nutritionist' OR role = 'coach')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corregir la política de la tabla 'profiles'
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));

-- 3. Corregir la política de la tabla 'medical_exams'
DROP POLICY IF EXISTS "Admins can view all exams" ON public.medical_exams;
CREATE POLICY "Admins can view all exams" 
ON public.medical_exams FOR SELECT 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));

-- 4. Corregir la política de la tabla 'physical_progress'
DROP POLICY IF EXISTS "Admins can view all physical_progress" ON public.physical_progress;
CREATE POLICY "Admins can view all physical_progress" 
ON public.physical_progress FOR SELECT 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));

-- 5. Corregir la política de la tabla 'training_logs'
DROP POLICY IF EXISTS "Admins can view all training_logs" ON public.training_logs;
CREATE POLICY "Admins can view all training_logs" 
ON public.training_logs FOR SELECT 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));

-- 6. Corregir la política de la tabla 'payment_proofs' para que los admins vean todo
DROP POLICY IF EXISTS "Admins can view all payment_proofs" ON public.payment_proofs;
CREATE POLICY "Admins can view all payment_proofs" 
ON public.payment_proofs FOR SELECT 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));

-- 7. Corregir la política de la tabla 'weekly_menus' para que los admins vean todo
DROP POLICY IF EXISTS "Admins can view all weekly_menus" ON public.weekly_menus;
CREATE POLICY "Admins can view all weekly_menus" 
ON public.weekly_menus FOR SELECT 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));

-- 8. Asegurar que los usuarios puedan seguir viendo su propio perfil (esta no causa recursión)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
