-- SCRIPT DE ACTUALIZACIÓN PARA MENÚ DIARIO Y EXÁMENES
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Asegurar que la tabla de menús tenga la columna para datos estructurados
ALTER TABLE weekly_menus 
ADD COLUMN IF NOT EXISTS daily_menus JSONB DEFAULT '[]'::jsonb;

-- 2. Asegurar que la tabla de exámenes use JSONB para los resultados de la IA
-- Primero intentamos cambiar el tipo si existe como texto, o crearla si no existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_exams' AND column_name = 'digitized_data') THEN
        ALTER TABLE medical_exams ALTER COLUMN digitized_data TYPE JSONB USING digitized_data::jsonb;
    ELSE
        ALTER TABLE medical_exams ADD COLUMN digitized_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Crear tabla de menús si no existe (por si acaso)
CREATE TABLE IF NOT EXISTS weekly_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    daily_menus JSONB DEFAULT '[]'::jsonb,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar RLS para menús
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad para menús
DROP POLICY IF EXISTS "Users can view their own menus" ON weekly_menus;
CREATE POLICY "Users can view their own menus" 
ON weekly_menus FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all menus" ON weekly_menus;
CREATE POLICY "Admins can manage all menus" 
ON weekly_menus FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'nutritionist')
  )
);
