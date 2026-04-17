-- Añadir políticas de eliminación para medical_exams
-- Permite que los usuarios eliminen sus propios exámenes
DROP POLICY IF EXISTS "Users can delete own exams" ON public.medical_exams;
CREATE POLICY "Users can delete own exams" 
ON public.medical_exams FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Permite que los administradores eliminen cualquier examen (opcional, pero útil)
DROP POLICY IF EXISTS "Admins can delete any exam" ON public.medical_exams;
CREATE POLICY "Admins can delete any exam" 
ON public.medical_exams FOR DELETE 
TO authenticated 
USING (check_is_admin_or_coach(auth.uid()));
