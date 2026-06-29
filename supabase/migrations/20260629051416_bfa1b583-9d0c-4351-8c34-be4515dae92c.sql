
ALTER TABLE public.motos ADD COLUMN IF NOT EXISTS documentos jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE POLICY "Public read moto-documentos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'moto-documentos');
CREATE POLICY "Public upload moto-documentos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'moto-documentos');
CREATE POLICY "Public update moto-documentos" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'moto-documentos');
CREATE POLICY "Public delete moto-documentos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'moto-documentos');
