-- ============ ALTERACOES DA TABELA DE TRANSFERENCIAS PARA MULTI-TENANT ============

ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS municipio_origem_id uuid REFERENCES public.municipios(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS municipio_destino_id uuid REFERENCES public.municipios(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS utilizador_origem_id uuid,
  ADD COLUMN IF NOT EXISTS utilizador_destino_id uuid,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'concluida',
  ADD COLUMN IF NOT EXISTS tipo_fluxo text NOT NULL DEFAULT 'origem_inicia',
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS data_conclusao timestamptz;

-- Preencher municipio_origem_id e municipio_destino_id nos registos antigos
UPDATE public.transferencias
SET
  municipio_origem_id = COALESCE(municipio_origem_id, municipio_id),
  municipio_destino_id = COALESCE(municipio_destino_id, municipio_id)
WHERE municipio_origem_id IS NULL OR municipio_destino_id IS NULL;

-- Indices para otimizacao de relatorios e painel
CREATE INDEX IF NOT EXISTS idx_transferencias_origem ON public.transferencias(municipio_origem_id, estado);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON public.transferencias(municipio_destino_id, estado);
CREATE INDEX IF NOT EXISTS idx_transferencias_estado ON public.transferencias(estado);

-- ============ RLS REGRAS PARA TRANSFERENCIAS MULTI-TENANT ============

DROP POLICY IF EXISTS "transferencias_tenant_select" ON public.transferencias;
DROP POLICY IF EXISTS "transferencias_tenant_write" ON public.transferencias;
DROP POLICY IF EXISTS "Public read transferencias" ON public.transferencias;
DROP POLICY IF EXISTS "Public insert transferencias" ON public.transferencias;

CREATE POLICY "transferencias_tenant_select" ON public.transferencias FOR SELECT TO authenticated
  USING (
    public.e_super_admin(auth.uid()) OR
    municipio_origem_id = public.meu_municipio(auth.uid()) OR
    municipio_destino_id = public.meu_municipio(auth.uid()) OR
    municipio_id = public.meu_municipio(auth.uid())
  );

CREATE POLICY "transferencias_tenant_all" ON public.transferencias FOR ALL TO authenticated
  USING (
    public.e_super_admin(auth.uid()) OR
    municipio_origem_id = public.meu_municipio(auth.uid()) OR
    municipio_destino_id = public.meu_municipio(auth.uid()) OR
    municipio_id = public.meu_municipio(auth.uid())
  )
  WITH CHECK (
    public.e_super_admin(auth.uid()) OR
    municipio_origem_id = public.meu_municipio(auth.uid()) OR
    municipio_destino_id = public.meu_municipio(auth.uid()) OR
    municipio_id = public.meu_municipio(auth.uid())
  );

-- ============ AJUSTE RLS DAS MOTOS PARA TRANSFERENCIAS PENDENTES ============

DROP POLICY IF EXISTS "motos_tenant_select" ON public.motos;
CREATE POLICY "motos_tenant_select" ON public.motos FOR SELECT TO authenticated
  USING (
    public.e_super_admin(auth.uid()) OR
    municipio_id = public.meu_municipio(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.transferencias t
      WHERE t.moto_id = motos.id
        AND t.municipio_destino_id = public.meu_municipio(auth.uid())
        AND t.estado IN ('pendente_aceitacao', 'aguardando_origem')
    )
  );

DROP POLICY IF EXISTS "motos_tenant_write" ON public.motos;
CREATE POLICY "motos_tenant_write" ON public.motos FOR ALL TO authenticated
  USING (
    public.e_super_admin(auth.uid()) OR
    (
      municipio_id = public.meu_municipio(auth.uid()) AND
      (public.tem_papel(auth.uid(),'admin_municipal') OR public.tem_papel(auth.uid(),'tecnico_municipal'))
    ) OR
    EXISTS (
      SELECT 1 FROM public.transferencias t
      WHERE t.moto_id = motos.id
        AND t.municipio_destino_id = public.meu_municipio(auth.uid())
        AND t.estado IN ('pendente_aceitacao', 'aguardando_origem')
    )
  )
  WITH CHECK (
    public.e_super_admin(auth.uid()) OR
    (
      public.tem_papel(auth.uid(),'admin_municipal') OR public.tem_papel(auth.uid(),'tecnico_municipal')
    )
  );
