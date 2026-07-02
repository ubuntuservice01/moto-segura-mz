
-- Drop permissive anon policies on motos
DROP POLICY IF EXISTS "Public read motos" ON public.motos;
DROP POLICY IF EXISTS "Public insert motos" ON public.motos;
DROP POLICY IF EXISTS "Public update motos" ON public.motos;
DROP POLICY IF EXISTS "Public delete motos" ON public.motos;

-- Drop permissive anon policies on historico_motos
DROP POLICY IF EXISTS "Public read historico" ON public.historico_motos;
DROP POLICY IF EXISTS "Public insert historico" ON public.historico_motos;

-- Drop permissive anon policies on transferencias
DROP POLICY IF EXISTS "Public read transferencias" ON public.transferencias;
DROP POLICY IF EXISTS "Public insert transferencias" ON public.transferencias;

-- Revoke direct API access from anon/authenticated (service_role bypasses RLS)
REVOKE ALL ON public.motos FROM anon, authenticated;
REVOKE ALL ON public.historico_motos FROM anon, authenticated;
REVOKE ALL ON public.transferencias FROM anon, authenticated;
GRANT ALL ON public.motos TO service_role;
GRANT ALL ON public.historico_motos TO service_role;
GRANT ALL ON public.transferencias TO service_role;

-- Ensure RLS remains enabled (no policies => no anon access even if grants existed)
ALTER TABLE public.motos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_motos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Storage: remove permissive anon policies on moto-documentos bucket
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual LIKE '%moto-documentos%' OR with_check LIKE '%moto-documentos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;
