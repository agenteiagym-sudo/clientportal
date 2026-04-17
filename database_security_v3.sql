-- SCRIPT DE SEGURIDAD Y PRIVACIDAD (RLS)
-- Ejecuta esto en el SQL Editor de Supabase para proteger tus datos personales y médicos

-- 1. Habilitar RLS en todas las tablas críticas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'profiles' (Datos Personales)
-- ==========================================

-- Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Los administradores/coaches pueden ver todos los perfiles (para gestión)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'nutritionist' OR profiles.role = 'coach')
  )
);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'medical_exams' (Datos Médicos)
-- ==========================================

-- Los usuarios pueden ver sus propios exámenes
DROP POLICY IF EXISTS "Users can view own exams" ON medical_exams;
CREATE POLICY "Users can view own exams" 
ON medical_exams FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Los usuarios pueden subir sus propios exámenes
DROP POLICY IF EXISTS "Users can insert own exams" ON medical_exams;
CREATE POLICY "Users can insert own exams" 
ON medical_exams FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Los administradores/coaches pueden ver todos los exámenes
DROP POLICY IF EXISTS "Admins can view all exams" ON medical_exams;
CREATE POLICY "Admins can view all exams" 
ON medical_exams FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'nutritionist' OR profiles.role = 'coach')
  )
);

-- ==========================================
-- POLÍTICAS PARA OTRAS TABLAS (Progreso, Entreno, Citas)
-- ==========================================

-- Physical Progress
DROP POLICY IF EXISTS "Users can manage own progress" ON physical_progress;
CREATE POLICY "Users can manage own progress" ON physical_progress FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Training Logs
DROP POLICY IF EXISTS "Users can manage own training" ON training_logs;
CREATE POLICY "Users can manage own training" ON training_logs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Appointments
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments;
CREATE POLICY "Users can manage own appointments" ON appointments FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Payment Proofs
DROP POLICY IF EXISTS "Users can manage own payments" ON payment_proofs;
CREATE POLICY "Users can manage own payments" ON payment_proofs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Weekly Menus
DROP POLICY IF EXISTS "Users can view own menus" ON weekly_menus;
CREATE POLICY "Users can view own menus" ON weekly_menus FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Permitir que Admins vean todo en las tablas de datos
DROP POLICY IF EXISTS "Admins can view all physical_progress" ON physical_progress;
CREATE POLICY "Admins can view all physical_progress" ON physical_progress FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'nutritionist' OR profiles.role = 'coach')));

DROP POLICY IF EXISTS "Admins can view all training_logs" ON training_logs;
CREATE POLICY "Admins can view all training_logs" ON training_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'nutritionist' OR profiles.role = 'coach')));
